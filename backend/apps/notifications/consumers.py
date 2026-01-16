import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

User = get_user_model()
logger = logging.getLogger(__name__)


class DSINotificationConsumer(AsyncWebsocketConsumer):
    """
    Consumer WebSocket para notificações DSI em tempo real
    """
    
    async def connect(self):
        """
        Conectar ao WebSocket
        """
        self.room_group_name = 'dsi_notifications'
        self.user = None
        
        # Aceitar conexão
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info(f"WebSocket conectado: {self.channel_name}")
    
    async def disconnect(self, close_code):
        """
        Desconectar do WebSocket
        """
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        logger.info(f"WebSocket desconectado: {self.channel_name}")
    
    async def receive(self, text_data):
        """
        Receber mensagem do cliente
        """
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'authenticate':
                await self.handle_authentication(data)
            elif message_type == 'user_info':
                await self.handle_user_info(data)
            else:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Tipo de mensagem não reconhecido'
                }))
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Formato JSON inválido'
            }))
        except Exception as e:
            logger.error(f"Erro ao processar mensagem WebSocket: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Erro interno do servidor'
            }))
    
    async def handle_authentication(self, data):
        """
        Processar autenticação via token JWT
        """
        token = data.get('token')
        
        if not token:
            await self.send(text_data=json.dumps({
                'type': 'auth_error',
                'message': 'Token não fornecido'
            }))
            return
        
        try:
            # Validar token JWT
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            self.user = await self.get_user(user_id)
            
            if self.user:
                await self.send(text_data=json.dumps({
                    'type': 'auth_success',
                    'message': 'Autenticado com sucesso',
                    'user': {
                        'id': self.user.id,
                        'username': self.user.username,
                        'role': self.user.perfil.nivel_acesso if hasattr(self.user, 'perfil') else None
                    }
                }))
                logger.info(f"Usuário autenticado via WebSocket: {self.user.username}")
            else:
                await self.send(text_data=json.dumps({
                    'type': 'auth_error',
                    'message': 'Usuário não encontrado'
                }))
                
        except (InvalidToken, TokenError) as e:
            await self.send(text_data=json.dumps({
                'type': 'auth_error',
                'message': 'Token inválido'
            }))
            logger.warning(f"Token inválido no WebSocket: {e}")
    
    async def handle_user_info(self, data):
        """
        Processar informações do usuário
        """
        user_info = data.get('user', {})
        user_id = user_info.get('id')
        
        if user_id:
            self.user = await self.get_user(user_id)
            
            # Verificar se é portaria do DSI
            if self.user and self.should_receive_notifications(self.user):
                await self.send(text_data=json.dumps({
                    'type': 'user_info_success',
                    'message': 'Usuário autorizado para receber notificações DSI',
                    'user': {
                        'id': self.user.id,
                        'username': self.user.username,
                        'role': self.user.perfil.nivel_acesso if hasattr(self.user, 'perfil') else None,
                        'orgao': {
                            'id': self.user.efetivo.orgao.id,
                            'nome': self.user.efetivo.orgao.nome,
                            'sigla': self.user.efetivo.orgao.sigla
                        } if hasattr(self.user, 'efetivo') and self.user.efetivo.orgao else None
                    }
                }))
            else:
                await self.send(text_data=json.dumps({
                    'type': 'user_info_error',
                    'message': 'Usuário não autorizado para receber notificações DSI'
                }))
    
    @database_sync_to_async
    def get_user(self, user_id):
        """
        Buscar usuário no banco de dados
        """
        try:
            return User.objects.select_related('perfil', 'efetivo__orgao').get(id=user_id)
        except User.DoesNotExist:
            return None
    
    def should_receive_notifications(self, user):
        """
        Verificar se o usuário deve receber notificações DSI
        """
        if not user or not hasattr(user, 'perfil'):
            return False
        
        # Verificar se é portaria
        if user.perfil.nivel_acesso != 'portaria':
            return False
        
        # Verificar se pertence ao DSI
        if hasattr(user, 'efetivo') and user.efetivo.orgao:
            orgao = user.efetivo.orgao
            return (
                orgao.nome == 'DEPARTAMENTO DE SEGURANÇA INSTITUCIONAL' or
                'SEGURANÇA INSTITUCIONAL' in orgao.nome or
                orgao.sigla == 'DSI'
            )
        
        return False
    
    async def new_notification(self, event):
        """
        Enviar nova notificação para o cliente
        """
        if self.user and self.should_receive_notifications(self.user):
            await self.send(text_data=json.dumps({
                'type': 'new_notification',
                'notification': event['notification']
            }))
    
    async def notification_updated(self, event):
        """
        Enviar atualização de notificação para o cliente
        """
        if self.user and self.should_receive_notifications(self.user):
            await self.send(text_data=json.dumps({
                'type': 'notification_updated',
                'notification': event['notification']
            }))
    
    async def notification_deleted(self, event):
        """
        Enviar exclusão de notificação para o cliente
        """
        if self.user and self.should_receive_notifications(self.user):
            await self.send(text_data=json.dumps({
                'type': 'notification_deleted',
                'notification_id': event['notification_id']
            }))
