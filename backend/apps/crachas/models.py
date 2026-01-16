from django.db import models
from apps.visitas.models import Visita
from django.core.exceptions import ValidationError


class Cracha(models.Model):
    class EstadoCracha(models.TextChoices):
        LIVRE = 'livre', 'Livre'
        OCUPADO = 'ocupado', 'Ocupado'
        INATIVO = 'inativo', 'Inativo'

    numero = models.CharField(max_length=20, unique=True)
    estado = models.CharField(
        max_length=20,
        choices=EstadoCracha.choices,
        default=EstadoCracha.LIVRE
    )
    visita = models.ForeignKey(
        Visita,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='crachas'
    )

    def __str__(self):
        return f'Crachá {self.numero} - {self.get_estado_display()}'

    def save(self, *args, **kwargs):
        # Get the original state from the database if it's an existing object
        original_estado = None
        original_visita = None
        if self.pk:
            try:
                original = Cracha.objects.get(pk=self.pk)
                original_estado = original.estado
                original_visita = original.visita
            except Cracha.DoesNotExist:
                # This can happen if the save is part of a transaction
                # where the object hasn't been committed yet.
                pass

        # Case 1: Assigning a visit
        if self.visita:
            # If it's a new assignment (was not assigned before, or assigned to a different visit)
            if self.visita != original_visita:
                # For a new crachá, original_estado is None, and self.estado is 'livre' by default
                current_state = original_estado or self.estado
                if current_state != self.EstadoCracha.LIVRE:
                    raise ValidationError(f"O crachá {self.numero} não está disponível (estado: {current_state}).")
            
            # Set state to occupied
            self.estado = self.EstadoCracha.OCUPADO

        # Case 2: Un-assigning a visit (returning the badge)
        else:
            # Only change state if it was previously occupied
            if original_estado == self.EstadoCracha.OCUPADO:
                self.estado = self.EstadoCracha.LIVRE
        
        super().save(*args, **kwargs)
