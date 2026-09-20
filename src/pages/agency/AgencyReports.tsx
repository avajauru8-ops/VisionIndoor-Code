import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { BarChart3, MonitorPlay, Tv, Image, Music, Film, Calendar, Download, TrendingUp, Clock, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface RelatorioData {
  resumo: {
    total_telas: number;
    telas_online: number;
    telas_offline: number;
    total_exibicoes: number;
    periodo_inicio: string;
    periodo_fim: string;
  };
  top_midias: any[];
  por_tela: any[];
  por_tipo: any[];
  por_dia: any[];
  top_playlists: any[];
  logs: any[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

function getMediaIcon(tipo: string) {
  if (!tipo) return <Image className="w-4 h-4" />;
  const t = tipo.toLowerCase();
  if (t.includes('video') || t.includes('mp4') || t.includes('webm')) return <Film className="w-4 h-4" />;
  if (t.includes('audio') || t.includes('mp3')) return <Music className="w-4 h-4" />;
  return <Image className="w-4 h-4" />;
}

export default function AgencyReports() {
  const [data, setData] = useState<RelatorioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [dataFim, setDataFim] = useState(() => new Date().toISOString().split('T')[0]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const result = await apiFetch(`/api/relatorios?data_inicio=${dataInicio}&data_fim=${dataFim}`);
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-zinc-400">
          <div className="w-5 h-5 border-2 border-zinc-300 border-t-[#0b462c] rounded-full animate-spin" />
          Carregando relatórios...
        </div>
      </div>
    );
  }

  const resumo = data?.resumo;
  const chartData = (data?.por_dia || []).map(d => ({
    name: new Date(d.data_exibicao).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    exibicoes: d.exibicoes
  }));
  const tipoData = (data?.por_tipo || []).map(d => ({
    name: d.tipo_midia || 'Não definido',
    value: d.exibicoes
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0b462c] tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            Relatórios
          </h2>
          <p className="text-xs text-[#8b9aa5] font-medium mt-1">
            Análise de exibição de mídias e desempenho das telas.
          </p>
        </div>
      </div>

      {/* Filtro de período */}
      <div className="bg-white border border-[#e8edf2] rounded-[24px] p-4 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
          <Filter className="w-4 h-4" />
          PERÍODO
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold text-zinc-400 uppercase">De</label>
          <input
            type="date"
            value={dataInicio}
            onChange={e => setDataInicio(e.target.value)}
            className="border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-700 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold text-zinc-400 uppercase">Até</label>
          <input
            type="date"
            value={dataFim}
            onChange={e => setDataFim(e.target.value)}
            className="border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-700 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <button
          onClick={loadReport}
          disabled={loading}
          className="px-4 py-1.5 bg-[#0b462c] hover:bg-[#082a1b] text-white text-[11px] font-bold rounded-lg transition-all disabled:opacity-50"
        >
          {loading ? 'Carregando...' : 'Filtrar'}
        </button>
      </div>

      {data && (
        <>
          {/* Cards de Resumo */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0b462c] text-white p-5 rounded-[20px] shadow-md">
              <div className="flex items-center gap-2 mb-3">
                <Tv className="w-4 h-4 text-emerald-300" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">Total Telas</span>
              </div>
              <h3 className="text-3xl font-extrabold">{resumo?.total_telas || 0}</h3>
              <p className="text-[10px] text-emerald-200/70 mt-1">{resumo?.telas_online || 0} online · {resumo?.telas_offline || 0} offline</p>
            </div>
            <div className="bg-white border border-[#e8edf2] p-5 rounded-[20px] shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <MonitorPlay className="w-4 h-4 text-blue-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Exibições</span>
              </div>
              <h3 className="text-3xl font-extrabold text-zinc-800">{resumo?.total_exibicoes || 0}</h3>
              <p className="text-[10px] text-zinc-400 mt-1">No período selecionado</p>
            </div>
            <div className="bg-white border border-[#e8edf2] p-5 rounded-[20px] shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Média Diária</span>
              </div>
              <h3 className="text-3xl font-extrabold text-zinc-800">
                {resumo && chartData.length > 0 ? Math.round((resumo.total_exibicoes || 0) / chartData.length) : 0}
              </h3>
              <p className="text-[10px] text-zinc-400 mt-1">Exibições por dia</p>
            </div>
            <div className="bg-white border border-[#e8edf2] p-5 rounded-[20px] shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Image className="w-4 h-4 text-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Tipos de Mídia</span>
              </div>
              <h3 className="text-3xl font-extrabold text-zinc-800">{tipoData.length}</h3>
              <p className="text-[10px] text-zinc-400 mt-1">Formatos distintos</p>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Exibições por dia */}
            <div className="lg:col-span-2 bg-white border border-[#e8edf2] rounded-[24px] p-6 shadow-sm">
              <h4 className="text-sm font-extrabold text-[#0b462c] uppercase tracking-wider mb-4">Exibições por Dia</h4>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8b9aa5' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#8b9aa5' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: '1px solid #e8edf2', fontSize: 11 }}
                      formatter={(value: number) => [`${value} exibições`, 'Total']}
                    />
                    <Bar dataKey="exibicoes" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-zinc-400 text-xs">
                  Nenhum dado de exibição no período
                </div>
              )}
            </div>

            {/* Por tipo de mídia */}
            <div className="bg-white border border-[#e8edf2] rounded-[24px] p-6 shadow-sm">
              <h4 className="text-sm font-extrabold text-[#0b462c] uppercase tracking-wider mb-4">Por Tipo de Mídia</h4>
              {tipoData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={tipoData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {tipoData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: '1px solid #e8edf2', fontSize: 11 }}
                      formatter={(value: number) => [`${value} exibições`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-zinc-400 text-xs">
                  Sem dados
                </div>
              )}
            </div>
          </div>

          {/* Tabelas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Mídias */}
            <div className="bg-white border border-[#e8edf2] rounded-[24px] p-6 shadow-sm">
              <h4 className="text-sm font-extrabold text-[#0b462c] uppercase tracking-wider mb-4">Top Mídias Mais Exibidas</h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {data?.top_midias?.length > 0 ? data.top_midias.map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-zinc-400 w-5">#{i + 1}</span>
                      <span className="text-zinc-400">{getMediaIcon(m.tipo_midia)}</span>
                      <span className="text-xs font-semibold text-zinc-700 truncate max-w-[180px]">{m.titulo || 'Sem título'}</span>
                    </div>
                    <span className="text-xs font-bold text-[#0b462c] bg-emerald-50 px-2.5 py-1 rounded-full">{m.exibicoes}</span>
                  </div>
                )) : (
                  <p className="text-xs text-zinc-400 text-center py-8">Nenhuma exibição registrada</p>
                )}
              </div>
            </div>

            {/* Exibições por Tela */}
            <div className="bg-white border border-[#e8edf2] rounded-[24px] p-6 shadow-sm">
              <h4 className="text-sm font-extrabold text-[#0b462c] uppercase tracking-wider mb-4">Exibições por Tela</h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {data?.por_tela?.length > 0 ? data.por_tela.map((t, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                    <div className="flex items-center gap-3">
                      <Tv className="w-4 h-4 text-zinc-400" />
                      <span className="text-xs font-semibold text-zinc-700">{t.totem_nome || 'Tela #' + (i + 1)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min((t.exibicoes / (data?.por_tela?.[0]?.exibicoes || 1)) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-[#0b462c] min-w-[40px] text-right">{t.exibicoes}</span>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-zinc-400 text-center py-8">Nenhuma exibição registrada</p>
                )}
              </div>
            </div>
          </div>

          {/* Top Playlists */}
          {data?.top_playlists && data.top_playlists.length > 0 && (
            <div className="bg-white border border-[#e8edf2] rounded-[24px] p-6 shadow-sm">
              <h4 className="text-sm font-extrabold text-[#0b462c] uppercase tracking-wider mb-4">Top Playlists</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.top_playlists.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-zinc-400">#{i + 1}</span>
                      <span className="text-xs font-semibold text-zinc-700 truncate max-w-[150px]">{p.playlist_nome}</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">{p.exibicoes}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Log Detalhado */}
          <div className="bg-white border border-[#e8edf2] rounded-[24px] p-6 shadow-sm">
            <h4 className="text-sm font-extrabold text-[#0b462c] uppercase tracking-wider mb-4">Log de Exibições</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 border-b border-[#e8edf2] bg-zinc-50/50">
                  <tr>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Hora</th>
                    <th className="px-4 py-3">Tela</th>
                    <th className="px-4 py-3">Mídia</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Playlist</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8edf2]">
                  {data?.logs?.length > 0 ? data.logs.slice(0, 50).map((log, i) => (
                    <tr key={i} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-4 py-3 text-zinc-600">{log.data_exibicao ? new Date(log.data_exibicao).toLocaleDateString('pt-BR') : '-'}</td>
                      <td className="px-4 py-3 text-zinc-500 font-mono">{log.hora_exibicao || '-'}</td>
                      <td className="px-4 py-3 font-semibold text-zinc-700">{log.totem_nome || '-'}</td>
                      <td className="px-4 py-3 text-zinc-600 truncate max-w-[200px]">{log.titulo || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-zinc-500">
                          {getMediaIcon(log.tipo_midia)}
                          {log.tipo_midia || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500">{log.playlist_nome || '-'}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">Nenhum registro encontrado</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
