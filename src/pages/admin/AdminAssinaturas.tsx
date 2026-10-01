import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { CreditCard, CheckCircle2, XCircle, Loader2, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface Plano {
  id: string;
  nome: string;
  descricao: string;
  preco: number | null;
  moeda: string;
  periodo: string | null;
  limite_telas: number | null;
}

interface Assinatura {
  id: number;
  usuario_id: number;
  usuario_nome: string | null;
  usuario_email: string | null;
  usuario_plano: string | null;
  usuario_limite_tvs: number | null;
  plano: string;
  valor: number;
  moeda: string;
  periodo: string | null;
  limite_telas: number | null;
  status: string;
  gateway: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  criado_em: string;
}

type Filtro = 'todas' | 'pendente' | 'ativa' | 'rejeitada';

export default function AdminAssinaturas() {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [resumo, setResumo] = useState<Record<string, number>>({ pendente: 0, ativa: 0, rejeitada: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [aprovando, setAprovando] = useState<Assinatura | null>(null);
  const [limiteInput, setLimiteInput] = useState(1);
  const [processando, setProcessando] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  const loadData = async () => {
    try {
      const [lista, catalogo] = await Promise.all([
        apiFetch('/api/admin/assinaturas'),
        apiFetch('/api/planos'),
      ]);
      setAssinaturas(lista?.assinaturas ?? []);
      setResumo(lista?.resumo ?? {});
      setPlanos(catalogo?.planos ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const abrirAprovacao = (a: Assinatura) => {
    setFeedback(null);
    setLimiteInput(a.limite_telas ?? a.usuario_limite_tvs ?? 1);
    setAprovando(a);
  };

  const confirmarAprovacao = async () => {
    if (!aprovando) return;
    setProcessando(true);
    setFeedback(null);
    try {
      const res = await apiFetch(`/api/admin/assinaturas/${aprovando.id}/aprovar`, {
        method: 'POST',
        body: JSON.stringify({ limite_telas: limiteInput }),
      });
      setAprovando(null);
      setFeedback({ tipo: 'ok', texto: res?.mensagem || 'Assinatura aprovada.' });
      await loadData();
    } catch (err: any) {
      setFeedback({ tipo: 'erro', texto: err?.message || 'Erro ao aprovar assinatura.' });
    } finally {
      setProcessando(false);
    }
  };

  const handleReprovar = async (a: Assinatura) => {
    if (!confirm(`Reprovar a assinatura #${a.id} de ${a.usuario_email || 'usuário desconhecido'}?`)) return;
    setProcessando(true);
    setFeedback(null);
    try {
      const res = await apiFetch(`/api/admin/assinaturas/${a.id}/reprovar`, { method: 'POST' });
      setFeedback({ tipo: 'ok', texto: res?.mensagem || 'Assinatura reprovada.' });
      await loadData();
    } catch (err: any) {
      setFeedback({ tipo: 'erro', texto: err?.message || 'Erro ao reprovar assinatura.' });
    } finally {
      setProcessando(false);
    }
  };

  const formataPreco = (p: Plano) => {
    if (p.preco === null || p.preco === undefined) return 'Em breve';
    if (Number(p.preco) === 0) return 'Grátis';
    return Number(p.preco).toLocaleString('pt-BR', { style: 'currency', currency: p.moeda || 'BRL' });
  };

  const filtradas = filtro === 'todas' ? assinaturas : assinaturas.filter(a => a.status === filtro);

  const badgeStatus = (status: string) => {
    if (status === 'ativa') return <span className="bg-[#e8f5ed] text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-100 text-[9px] uppercase font-bold tracking-wider">ATIVA</span>;
    if (status === 'pendente') return <span className="bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full border border-amber-100 text-[9px] uppercase font-bold tracking-wider">PENDENTE</span>;
    return <span className="bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full border border-rose-100 text-[9px] uppercase font-bold tracking-wider">REPROVADA</span>;
  };

  const filtros: { id: Filtro; label: string }[] = [
    { id: 'todas', label: `Todas (${resumo.total ?? 0})` },
    { id: 'pendente', label: `Pendentes (${resumo.pendente ?? 0})` },
    { id: 'ativa', label: `Ativas (${resumo.ativa ?? 0})` },
    { id: 'rejeitada', label: `Reprovadas (${resumo.rejeitada ?? 0})` },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-zinc-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0b462c] tracking-tight">Planos & Assinaturas</h2>
          <p className="text-xs text-[#8b9aa5] font-medium mt-1">Acompanhe os planos disponíveis e aprove ou reprove as assinaturas solicitadas pelos clientes.</p>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`flex items-start gap-3 text-xs font-medium p-4 rounded-2xl border ${feedback.tipo === 'ok' ? 'bg-[#e8f5ed] border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{feedback.texto}</p>
        </div>
      )}

      {/* Planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {planos.map(p => {
          const ativas = assinaturas.filter(a => a.plano === p.id && a.status === 'ativa').length;
          const pendentes = assinaturas.filter(a => a.plano === p.id && a.status === 'pendente').length;
          return (
            <div key={p.id} className="bg-white border border-[#e8edf2] rounded-[24px] p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-extrabold uppercase tracking-widest text-[#104a9e]">{p.nome}</h4>
                  <p className="text-[11px] text-zinc-400 mt-1 font-medium">{p.descricao}</p>
                </div>
                <CreditCard className="w-5 h-5 text-zinc-300" />
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-zinc-800">{formataPreco(p)}</span>
                <span className="text-[10px] font-bold text-zinc-400 uppercase">{p.periodo ? `/ ${p.periodo}` : 'sem recorrência'}</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                <span className="bg-[#f4f6f8] text-zinc-600 px-2.5 py-1 rounded-full border border-zinc-200">
                  {p.limite_telas ? `${p.limite_telas} tela${p.limite_telas > 1 ? 's' : ''}` : 'Limite sob contrato'}
                </span>
                <span className="bg-[#e8f5ed] text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-100">
                  {ativas} ativa{ativas === 1 ? '' : 's'}
                </span>
                {pendentes > 0 && (
                  <span className="bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full border border-amber-100">
                    {pendentes} pendente{pendentes === 1 ? '' : 's'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lista de assinaturas */}
      <div className="flex-1 bg-white border border-[#e8edf2] rounded-[24px] flex flex-col overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-[#e8edf2] flex flex-wrap justify-between items-center gap-3 bg-zinc-50/50">
          <h2 className="text-sm font-extrabold text-[#0b462c] uppercase tracking-wider">Assinaturas</h2>
          <div className="flex flex-wrap gap-2">
            {filtros.map(f => (
              <button
                key={f.id}
                onClick={() => setFiltro(f.id)}
                className={`text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-full transition-colors border ${
                  filtro === f.id
                    ? 'bg-[#0b462c] text-white border-[#0b462c]'
                    : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 border-b border-[#e8edf2] bg-zinc-50/50">
              <tr>
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">Plano</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4">Vigência</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-xs font-mono text-zinc-600">
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center font-sans text-zinc-400 text-xs">
                    Nenhuma assinatura {filtro !== 'todas' ? `com status "${filtro}"` : ''}.
                  </td>
                </tr>
              )}
              {filtradas.map(a => (
                <tr key={a.id} className="border-b border-[#e8edf2] hover:bg-zinc-50/50 transition-colors">
                  <td className="px-6 py-4 text-zinc-400">{a.id}</td>
                  <td className="px-6 py-4 font-sans">
                    <div className="text-zinc-800 font-bold text-sm leading-none">{a.usuario_nome || '—'}</div>
                    <div className="text-[10px] text-zinc-400 font-mono mt-1.5 leading-none">{a.usuario_email || '—'}</div>
                  </td>
                  <td className="px-6 py-4 font-sans text-[10px] uppercase font-bold tracking-widest text-zinc-600 capitalize">
                    {a.plano}
                    {a.limite_telas ? <span className="text-zinc-400 normal-case font-medium"> · {a.limite_telas} tela{a.limite_telas > 1 ? 's' : ''}</span> : null}
                  </td>
                  <td className="px-6 py-4">
                    {Number(a.valor) > 0
                      ? Number(a.valor).toLocaleString('pt-BR', { style: 'currency', currency: a.moeda || 'BRL' })
                      : 'Grátis'}
                    {a.periodo ? <div className="text-[10px] text-zinc-400 font-sans normal-case">{a.periodo}</div> : null}
                  </td>
                  <td className="px-6 py-4 text-zinc-500 font-sans">
                    {a.status === 'ativa' && a.data_fim
                      ? `até ${format(new Date(a.data_fim), 'dd/MM/yyyy')}`
                      : format(new Date(a.criado_em), 'dd/MM/yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4">{badgeStatus(a.status)}</td>
                  <td className="px-6 py-4 text-right font-sans">
                    <div className="inline-flex gap-2">
                      {(a.status === 'pendente' || a.status === 'rejeitada') && (
                        <button
                          onClick={() => abrirAprovacao(a)}
                          disabled={processando}
                          className="text-[9px] font-extrabold tracking-widest uppercase border border-emerald-200 rounded-full px-4 py-2 bg-[#e8f5ed] text-emerald-700 hover:bg-emerald-100 transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Aprovar
                        </button>
                      )}
                      {a.status === 'pendente' && (
                        <button
                          onClick={() => handleReprovar(a)}
                          disabled={processando}
                          className="text-[9px] font-extrabold tracking-widest uppercase border border-rose-200 rounded-full px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <XCircle className="w-3 h-3" />
                          Reprovar
                        </button>
                      )}
                      {a.status === 'ativa' && (
                        <span className="text-[9px] font-extrabold tracking-widest uppercase text-zinc-400 flex items-center gap-1.5 py-2">
                          <Clock className="w-3 h-3" />
                          Em curso
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Aprovar */}
      {aprovando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white border border-[#e8edf2] rounded-[24px] p-8 w-full max-w-md shadow-lg animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-[#0b462c] text-sm font-extrabold uppercase tracking-wider mb-6">Aprovar Assinatura #{aprovando.id}</h3>

            <div className="space-y-3 mb-6 text-xs">
              <div className="flex justify-between gap-4 bg-[#f4f6f8] rounded-xl px-4 py-3">
                <span className="font-bold text-zinc-500 uppercase tracking-widest text-[10px]">Usuário</span>
                <span className="text-zinc-800 font-semibold text-right">{aprovando.usuario_email || '—'}</span>
              </div>
              <div className="flex justify-between gap-4 bg-[#f4f6f8] rounded-xl px-4 py-3">
                <span className="font-bold text-zinc-500 uppercase tracking-widest text-[10px]">Plano</span>
                <span className="text-zinc-800 font-semibold capitalize">{aprovando.plano}</span>
              </div>
              <div className="flex justify-between gap-4 bg-[#f4f6f8] rounded-xl px-4 py-3">
                <span className="font-bold text-zinc-500 uppercase tracking-widest text-[10px]">Valor</span>
                <span className="text-zinc-800 font-semibold">
                  {Number(aprovando.valor) > 0
                    ? Number(aprovando.valor).toLocaleString('pt-BR', { style: 'currency', currency: aprovando.moeda || 'BRL' })
                    : 'Grátis'}
                </span>
              </div>
              <div className="flex justify-between gap-4 bg-[#f4f6f8] rounded-xl px-4 py-3">
                <span className="font-bold text-zinc-500 uppercase tracking-widest text-[10px]">Vigência</span>
                <span className="text-zinc-800 font-semibold capitalize">{aprovando.periodo || 'mensal'}</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                Limite de Telas liberado ao usuário
              </label>
              <input
                type="number"
                min={1}
                value={limiteInput}
                onChange={e => setLimiteInput(Math.max(1, Number(e.target.value)))}
                className="w-full bg-[#f4f6f8] border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm font-mono focus:border-emerald-500 outline-none transition-all"
              />
              <p className="text-[10px] text-zinc-400 mt-2">
                Ao aprovar, o usuário passa para o plano pago com licença ativa (validade calculada pela vigência).
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setAprovando(null)}
                className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-800 border border-zinc-200 hover:border-zinc-300 rounded-full transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarAprovacao}
                disabled={processando}
                className="px-5 py-2.5 bg-[#0b462c] hover:bg-[#082a1b] text-white rounded-full text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm disabled:opacity-60 flex items-center gap-2"
              >
                {processando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirmar Aprovação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
