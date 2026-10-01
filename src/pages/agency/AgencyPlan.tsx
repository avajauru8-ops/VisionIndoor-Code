import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  CreditCard,
  Monitor,
  CheckCircle2,
  CalendarDays,
  Shield,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface Plano {
  id: string;
  nome: string;
  descricao: string;
  preco: number | null;
  moeda: string;
  periodo: string | null;
  limite_telas: number | null;
}

interface Feedback {
  tipo: 'info' | 'erro';
  texto: string;
}

export default function AgencyPlan() {
  const { user } = useAuth();
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [assinandoId, setAssinandoId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const loadDados = async () => {
    try {
      const [catalogo, st] = await Promise.all([
        apiFetch('/api/planos'),
        apiFetch('/api/assinaturas/status'),
      ]);
      setPlanos(catalogo?.planos ?? []);
      setStatus(st ?? null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDados();
  }, []);

  const planoAtual = status?.plano ?? user?.plano ?? 'gratis';

  const handleAssinar = async (planoId: string) => {
    setAssinandoId(planoId);
    setFeedback(null);
    try {
      const res = await apiFetch('/api/assinaturas/checkout', {
        method: 'POST',
        body: JSON.stringify({ plano: planoId }),
      });
      if (res?.url) {
        window.location.href = res.url;
        return;
      }
      setFeedback({
        tipo: 'info',
        texto: res?.mensagem || 'Pagamentos online em breve. Entre em contato com o suporte para assinar.',
      });
    } catch (err: any) {
      setFeedback({
        tipo: 'erro',
        texto: err?.message || 'Não foi possível iniciar a assinatura.',
      });
    } finally {
      setAssinandoId(null);
    }
  };

  const formataPreco = (p: Plano) => {
    if (p.preco === null || p.preco === undefined) return 'Em breve';
    if (Number(p.preco) === 0) return 'Grátis';
    return Number(p.preco).toLocaleString('pt-BR', {
      style: 'currency',
      currency: p.moeda || 'BRL',
    });
  };

  const formataPeriodo = (p: Plano) =>
    p.periodo ? `/ ${p.periodo}` : '';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-zinc-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-zinc-600 font-sans w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-[#104a9e] flex items-center gap-2 uppercase tracking-wide">
          <CreditCard className="w-6 h-6" />
          MEU PLANO
        </h2>
        <Link
          to="/agency"
          className="text-[11px] font-bold text-zinc-500 hover:text-[#104a9e] uppercase tracking-wide"
        >
          VOLTAR AO INÍCIO
        </Link>
      </div>

      {/* Plano atual */}
      <div className="bg-gradient-to-br from-[#0b462c] to-[#082a1b] text-white rounded-[24px] p-6 shadow-md">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h4 className="text-sm font-extrabold uppercase tracking-widest text-emerald-200">Plano Atual</h4>
            <p className="text-[10px] text-emerald-300 mt-1">Informações da sua assinatura</p>
          </div>
          <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-emerald-200" />
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <p className="text-[10px] text-emerald-300 uppercase tracking-wider font-bold">Plano</p>
              <p className="text-lg font-extrabold text-white capitalize">
                {planoAtual === 'pago' ? 'Pago' : 'Gratuito'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <p className="text-[10px] text-emerald-300 uppercase tracking-wider font-bold">Telas</p>
              <p className="text-lg font-extrabold text-white">
                {status?.telas_usadas ?? 0}{' '}
                <span className="text-emerald-300/70 font-bold">/ {status?.limite_telas ?? 1}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <p className="text-[10px] text-emerald-300 uppercase tracking-wider font-bold">Vencimento</p>
              <p className="text-lg font-extrabold text-white">
                {status?.validade_licenca
                  ? new Date(status.validade_licenca).toLocaleDateString('pt-BR')
                  : 'Sem prazo'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-5">
          <span className={`w-2.5 h-2.5 rounded-full ${status?.status_licenca === 'ativa' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
          <span className={`text-[11px] font-bold uppercase tracking-wider ${status?.status_licenca === 'ativa' ? 'text-emerald-300' : 'text-rose-300'}`}>
            {status?.status_licenca === 'ativa' ? 'Licença Ativa' : 'Licença Expirada'}
          </span>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`flex items-start gap-3 text-xs font-medium p-4 rounded-lg border ${
            feedback.tipo === 'erro'
              ? 'bg-red-50 border-red-100 text-red-600'
              : 'bg-blue-50 border-blue-100 text-[#104a9e]'
          }`}
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{feedback.texto}</p>
        </div>
      )}

      {/* Catálogo de planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {planos.map((plano) => {
          const ehAtual = plano.id === planoAtual;
          const ehGratuito = plano.id === 'gratuito';

          return (
            <div
              key={plano.id}
              className={`bg-white border rounded-[24px] p-6 shadow-sm flex flex-col justify-between ${
                ehAtual ? 'border-[#0b462c]' : 'border-[#e8edf2]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold uppercase tracking-widest text-[#104a9e]">
                    {plano.nome}
                  </h4>
                  {ehAtual && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full">
                      Plano atual
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-zinc-800">
                    {formataPreco(plano)}
                  </span>
                  <span className="text-xs font-bold text-zinc-400 uppercase">
                    {formataPeriodo(plano)}
                  </span>
                </div>

                <p className="text-xs text-zinc-500 mt-3 leading-relaxed">{plano.descricao}</p>

                <ul className="mt-5 space-y-2 text-xs text-zinc-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    {plano.limite_telas
                      ? `${plano.limite_telas} tela${plano.limite_telas > 1 ? 's' : ''}`
                      : 'Limite de telas definido no contrato'}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    Acesso completo ao painel de conteúdo
                  </li>
                </ul>
              </div>

              <div className="mt-6">
                {!ehAtual && ehGratuito && (
                  <p className="text-[11px] text-zinc-400 text-center font-medium">
                    Disponível para todos os usuários
                  </p>
                )}

                {!ehAtual && !ehGratuito && (
                  <button
                    onClick={() => handleAssinar(plano.id)}
                    disabled={assinandoId === plano.id}
                    className="w-full px-6 py-3 bg-[#0066ff] hover:bg-[#0052cc] disabled:opacity-60 text-white rounded-lg text-xs font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-2"
                  >
                    {assinandoId === plano.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        INICIANDO...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        ASSINAR PLANO PAGO
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Histórico de assinaturas */}
      {Array.isArray(status?.assinaturas) && status.assinaturas.length > 0 && (
        <div className="bg-white border border-[#e8edf2] rounded-[24px] p-6 shadow-sm">
          <h4 className="text-sm font-extrabold uppercase tracking-widest text-[#104a9e] mb-4">
            Histórico de Assinaturas
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-zinc-400 border-b border-zinc-100">
                  <th className="pb-2 pr-4 font-bold">Plano</th>
                  <th className="pb-2 pr-4 font-bold">Valor</th>
                  <th className="pb-2 pr-4 font-bold">Status</th>
                  <th className="pb-2 font-bold">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {status.assinaturas.map((a: any) => (
                  <tr key={a.id} className="border-b border-zinc-50">
                    <td className="py-2.5 pr-4 capitalize font-semibold text-zinc-700">{a.plano}</td>
                    <td className="py-2.5 pr-4">
                      {Number(a.valor) > 0
                        ? Number(a.valor).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: a.moeda || 'BRL',
                          })
                        : 'Grátis'}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          a.status === 'ativa'
                            ? 'bg-emerald-50 text-emerald-600'
                            : a.status === 'pendente'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-zinc-100 text-zinc-500'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-zinc-500">
                      {a.criado_em ? new Date(a.criado_em).toLocaleDateString('pt-BR') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
