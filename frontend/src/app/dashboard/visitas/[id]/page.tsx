"use client";
import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { finalizeVisita, getVisitaById } from '@/services/visitaService';
import { Visita } from '@/types/visita';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { Lock, Eye } from 'lucide-react';
import dynamic from 'next/dynamic';
import api from '@/services/api'; // Garante que temos o cliente api para chamadas customizadas

const AssignCrachaButton = dynamic(() => import('@/components/visitas/AssignCrachaButton'), { ssr: false });

export default function VisitaDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const [visita, setVisita] = useState<Visita | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { id } = React.use(params);
  const [confirmandoRecepcao, setConfirmandoRecepcao] = useState(false);
  const [confirmadaRecepcao, setConfirmadaRecepcao] = useState(visita?.confirmada_recepcao ?? false);

  useEffect(() => {
    if (!id) return;
    getVisitaById(id)
      .then((data) => { setVisita(data); })
      .finally(() => setLoading(false));
  }, [id]);

  const estadoBadge = useMemo(() => {
    const estado = visita?.estado;
    if (estado === 'concluida') return 'bg-green-100 text-green-800';
    if (estado === 'em_curso') return 'bg-yellow-100 text-yellow-800';
    if (estado === 'cancelada') return 'bg-red-100 text-red-800';
    return 'bg-blue-100 text-blue-800';
  }, [visita]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-96">
          <span className="animate-pulse text-lg text-muted-foreground">Carregando detalhes...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!visita) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <span className="text-muted-foreground text-xl">Visita não encontrada.</span>
        </div>
      </DashboardLayout>
    );
  }

  const visitanteNome = (visita as any).visitante_obj?.nome || (visita as any).visitante_obj?.designacao_social || '-';
  const efetivoNome = (visita as any).efetivo_visitar_obj?.nome || 'Não informado';
  const orgaoNome = (visita as any).orgao_obj?.nome || '-';
  const crachaNumero = (visita as any).cracha?.numero || (visita as any).crachas?.[0]?.numero || null;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto mt-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Visita Nº {String(visita.numero)}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>Visitante:</span>
              <span className="font-medium text-foreground">{visitanteNome}</span>
              <span className="mx-1">•</span>
              <span>Órgão:</span>
              <span className="font-medium text-foreground">{orgaoNome}</span>
              <span className="mx-1">•</span>
              <Badge className={estadoBadge}>{visita.estado}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            {user?.role === 'recepcao' ? (
              // Para usuários de recepção, mostrar apenas informações sobre crachá
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md border">
                <Lock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {crachaNumero ? `Crachá: ${crachaNumero}` : 'Sem crachá associado'}
                </span>
              </div>
            ) : (
              // Para outros usuários, mostrar botões de ação
              <>
                <AssignCrachaButton visitaId={id} trigger={<Button variant="secondary">{crachaNumero ? `Crachá: ${crachaNumero}` : 'Associar crachá'}</Button>} />
                <Link href={`/dashboard/visitas/${id}/editar`}>
                  <Button variant="outline">Editar</Button>
                </Link>
                {visita.estado === 'em_curso' && (
                  <Button onClick={async () => {
                    try {
                      // Se existir crachá associado, exigir devolução
                      const hasCracha = Boolean(crachaNumero);
                      const payload = hasCracha ? { devolver_cracha: true } : {};
                      await finalizeVisita(id, payload as any);
                      window.location.reload();
                    } catch (e: any) {
                      const detail = e?.response?.data?.detail || 'Não foi possível finalizar a visita.';
                      alert(detail);
                    }
                  }} className="bg-green-600 hover:bg-green-700">Finalizar visita</Button>
                )}
              </>
            )}
          </div>
        </div>

        {user?.role === 'recepcao' && visita && visita.orgao_obj?.id === user?.orgao?.id && !confirmadaRecepcao && (
          <div className="mt-4">
            <Button
              onClick={async () => {
                setConfirmandoRecepcao(true);
                try {
                  await api.post(`/visitas/${visita.id}/confirmar_recepcao/`);
                  setConfirmadaRecepcao(true);
                  alert('Presença da visita confirmada com sucesso!');
                } catch (e: any) {
                  alert(e?.response?.data?.detail || 'Não foi possível confirmar presença.');
                } finally {
                  setConfirmandoRecepcao(false);
                }
              }}
              disabled={confirmandoRecepcao}
              className="bg-blue-700 hover:bg-blue-800 text-white"
            >
              {confirmandoRecepcao ? 'Confirmando...' : 'Confirmar presença no órgão'}
            </Button>
          </div>
        )}
        {user?.role === 'recepcao' && confirmadaRecepcao && (
            <div className="mt-4 text-green-700 font-semibold">Presença da visita já confirmada para esse órgão.</div>
        )}

        {/* Card informativo para recepção */}
        {user?.role === 'recepcao' && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Eye className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Modo de Visualização - Recepção</h3>
                  <p className="text-blue-800 text-sm">
                    Você está visualizando esta visita em modo somente leitura. 
                    Como usuário de recepção, você não pode editar, finalizar ou associar crachás às visitas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Infos principais */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoItem label="Visitante" value={visitanteNome} />
                <InfoItem label="Efetivo a visitar" value={efetivoNome} />
                <InfoItem label="Órgão" value={orgaoNome} />
                <InfoItem label="Entrada" value={visita.data_hora_entrada ? new Date(visita.data_hora_entrada).toLocaleString() : 'Não registrada'} />
                <InfoItem label="Saída" value={visita.data_hora_saida ? new Date(visita.data_hora_saida).toLocaleString() : '-'} />
                <InfoItem label="Motivo" value={visita.motivo || '-'} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 whitespace-pre-wrap">{visita.observacoes || '—'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Listas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Acompanhantes</CardTitle>
            </CardHeader>
            <CardContent>
              {visita.acompanhantes && visita.acompanhantes.length > 0 ? (
                <ul className="divide-y">
                  {visita.acompanhantes.map((a: any, idx: number) => (
                    <li key={idx} className="py-2 flex flex-wrap gap-2 text-sm">
                      <span className="font-medium">{a.nome}</span>
                      {a.documento_tipo && <span className="text-muted-foreground">{a.documento_tipo}</span>}
                      {a.documento_numero && <span className="text-muted-foreground">({a.documento_numero})</span>}
                      {a.nacionalidade && <span className="text-muted-foreground">• {a.nacionalidade}</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-muted-foreground text-sm">Nenhum acompanhante.</span>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Viaturas</CardTitle>
            </CardHeader>
            <CardContent>
              {visita.viaturas && visita.viaturas.length > 0 ? (
                <ul className="divide-y">
                  {visita.viaturas.map((v: any, idx: number) => (
                    <li key={idx} className="py-2 flex flex-wrap gap-2 text-sm">
                      <span className="font-medium">{v.tipo}</span>
                      {v.marca && <span className="text-muted-foreground">{v.marca}</span>}
                      {v.cor && <span className="text-muted-foreground">• {v.cor}</span>}
                      {v.matricula && <span className="text-muted-foreground">({v.matricula})</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-muted-foreground text-sm">Nenhuma viatura.</span>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

// noop
