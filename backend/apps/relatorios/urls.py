from django.urls import path
from . import views

app_name = 'relatorios'

urlpatterns = [
    path('estatisticas/', views.estatisticas, name='estatisticas'),
    path('detalhados/', views.detalhados, name='detalhados'),
]