# Leitor de QR Code - Documentação

## 📋 Visão Geral

O sistema SIC-SIVIS agora inclui funcionalidade de leitura de QR Code para automatizar o preenchimento de dados de visitantes a partir de documentos de identidade (BI, Passaporte, etc.).

## 🎯 Funcionalidades Implementadas

### 1. **Leitor de QR Code Reutilizável**
- Componente `QRCodeReader` que pode ser usado em diferentes partes do sistema
- Suporte a múltiplas câmeras
- Interface intuitiva com preview dos dados
- Tratamento de erros e validação

### 2. **Parser Inteligente de Dados**
- Suporte a diferentes formatos de QR Code:
  - Bilhete de Identidade de Angola
  - Passaporte (formato MRZ)
  - Formato JSON genérico
  - Formato genérico com extração de padrões
- Extração automática dos seguintes campos:
  - Nome completo
  - Número do documento
  - Tipo de documento
  - Data de nascimento
  - Província de nascimento
  - Nacionalidade
  - Gênero
  - Data de emissão
  - Data de validade
  - Local de emissão
  - Estado civil

### 3. **Integração no Fluxo de Visitas**
- Botão "Ler QR Code" no componente `VisitanteSearch`
- Busca automática de visitante existente
- Criação automática de novo visitante se não existir
- Seleção automática do visitante encontrado/criado

### 4. **Integração no Cadastro Manual**
- Botão "Preencher com QR Code" na página de cadastro de pessoas
- Preenchimento automático dos campos do formulário
- Validação dos dados extraídos

## 🚀 Como Usar

### No Fluxo de Criação de Visitas

1. Acesse a página de criação de nova visita
2. Na seção "Pesquisar Visitante", clique no botão **"Ler QR Code"**
3. Posicione o QR Code do documento dentro da área de leitura
4. O sistema irá:
   - Extrair os dados do QR Code
   - Buscar se o visitante já existe
   - Se existir: selecionar automaticamente
   - Se não existir: criar novo visitante e selecionar

### No Cadastro Manual de Pessoas

1. Acesse a página de cadastro de nova pessoa
2. Selecione "Pessoa Singular"
3. Clique no botão **"Preencher com QR Code"**
4. Posicione o QR Code do documento dentro da área de leitura
5. O sistema irá preencher automaticamente os campos disponíveis
6. Revise e complete os dados se necessário
7. Salve o cadastro

## 🔧 Configurações Técnicas

### Permissões Necessárias
- Acesso à câmera do dispositivo
- Permissão deve ser concedida no navegador

### Formatos Suportados
- **BI Angola**: `BI123456789|NOME|DD/MM/AAAA|PROVINCIA|...`
- **Passaporte**: Formato MRZ padrão
- **JSON**: `{"nome": "...", "documento": "...", ...}`
- **Genérico**: Extração por padrões de texto

### Validações Implementadas
- Verificação de dados obrigatórios (nome, documento)
- Validação de formato de datas
- Tratamento de erros de parsing
- Feedback visual para o usuário

## 🛠️ Estrutura de Arquivos

```
frontend-sivis/src/
├── utils/
│   └── qrCodeParser.ts          # Parser principal
├── components/ui/
│   ├── QRCodeReader.tsx         # Componente leitor
│   └── QRDataPreview.tsx        # Preview dos dados
├── components/visitas/
│   └── VisitanteSearch.tsx      # Integração em visitas
└── app/dashboard/pessoas/novo/
    └── page.tsx                 # Integração em cadastro
```

## 🔍 Solução de Problemas

### QR Code não é detectado
- Verifique se a câmera está funcionando
- Certifique-se de que há boa iluminação
- Tente ajustar a distância do documento
- Verifique se o QR Code não está danificado

### Dados não são extraídos corretamente
- O formato do QR Code pode não ser suportado
- Verifique se o documento é um BI ou Passaporte válido
- Tente usar o cadastro manual como alternativa

### Erro de permissão da câmera
- Verifique as configurações do navegador
- Certifique-se de que o site tem permissão para acessar a câmera
- Tente recarregar a página

## 📱 Compatibilidade

### Navegadores Suportados
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

### Dispositivos
- Desktop com câmera
- Laptop com câmera integrada
- Smartphone/Tablet (via navegador)

## 🔒 Segurança

- Dados do QR Code são processados localmente
- Não há envio de dados para servidores externos
- Permissões de câmera são solicitadas apenas quando necessário
- Dados são validados antes de serem salvos no sistema

## 🎨 Personalização

O componente `QRCodeReader` aceita as seguintes props para personalização:

```typescript
interface QRCodeReaderProps {
  onQRCodeScanned: (data: QRParsedData) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
  title?: string;
  description?: string;
  showPreview?: boolean;
  className?: string;
}
```

## 📈 Próximas Melhorias

- [ ] Suporte a mais formatos de documento
- [ ] Histórico de QR Codes escaneados
- [ ] Exportação de dados extraídos
- [ ] Integração com outros módulos do sistema
- [ ] Suporte offline para parsing básico


