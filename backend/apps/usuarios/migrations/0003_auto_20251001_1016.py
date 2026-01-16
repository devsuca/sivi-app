
from django.db import migrations, models

PERFIL_CHOICES = (
    ('admin', 'Administrador'),
    ('operador', 'Operador'),
    ('visitante', 'Visitante'),
)

def forwards_func(apps, schema_editor):
    Perfil = apps.get_model('authentication', 'Perfil')
    for perfil_value, perfil_display in PERFIL_CHOICES:
        Perfil.objects.get_or_create(nome=perfil_display, nivel_acesso=perfil_value)

    Usuario = apps.get_model('usuarios', 'Usuario')
    for usuario in Usuario.objects.all():
        if usuario.perfil_char:
            perfil = Perfil.objects.get(nivel_acesso=usuario.perfil_char)
            usuario.perfil = perfil
            usuario.save()

class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0002_remove_usuario_ativo_alter_usuario_is_active'),
        ('authentication', '0001_initial'),
    ]

    operations = [
        migrations.RenameField(
            model_name='usuario',
            old_name='perfil',
            new_name='perfil_char',
        ),
        migrations.AddField(
            model_name='usuario',
            name='perfil',
            field=models.ForeignKey(null=True, on_delete=models.deletion.SET_NULL, to='authentication.perfil'),
        ),
        migrations.RunPython(forwards_func),
        migrations.RemoveField(
            model_name='usuario',
            name='perfil_char',
        ),
    ]
