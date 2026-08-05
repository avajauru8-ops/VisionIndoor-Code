import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MonitorPlay, Film, Cloud, Hash, LayoutGrid, Trash2, Edit2, Activity } from 'lucide-react';
import { format } from 'date-fns';

interface Totem {
  id: number;
  nome: string;
  device_id: string;
  status: 'online' | 'offline';
  ultima_sincronizacao: string | null;
}

interface Playlist {
  id: number;
  totem_id: number | null;
  titulo: string;
  tipo_midia: 'video' | 'imagem' | 'noticia';
  arquivo_url: string;
  tempo_exibicao: number;
  data_inicio: string;
  data_fim: string;
  ativo: number;
}

export default function AgencyPlaylistView() {
  const { id } = useParams<{ id: string }>();
  const [totem, setTotem] = useState<Totem | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [tData, pData] = await Promise.all([
        apiFetch('/api/totems'),
        apiFetch('/api/playlists')
      ]);
      
      const foundTotem = tData.find((t: Totem) => t.id === Number(id));
      setTotem(foundTotem || null);

      // Filter playlists for this totem or global (totem_id === null)
      const filtered = pData.filter((p: Playlist) => !p.totem_id || p.totem_id === Number(id));
      setPlaylists(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleDelete = async (deleteId: number) => {
    if (confirm('Deseja realmente excluir esta mídia?')) {
      try {
        await apiFetch(`/api/playlists/${deleteId}`, { method: 'DELETE' });
        loadData();
      } catch (err) {
        console.error(err);
        alert('Erro ao excluir.');
      }
    }
  };

  const now = new Date();

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 shrink-0">
        <Link to="/agency/playlists/telas" className="p-2 bg-white border border-[#e8edf2] rounded-xl hover:bg-zinc-50 hover:border-zinc-300 transition-all text-zinc-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-extrabold text-[#0b462c] tracking-tight">
            {loading ? 'Carregando...' : totem ? totem.nome : 'Tela não encontrada'}
          </h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-[#8b9aa5] font-medium flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> ID: {totem?.device_id || 'N/A'}
            </span>
            {totem && (
              totem.status === 'online' ? (
                <span className="flex items-center gap-1 bg-[#e8f5ed] text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100 text-[9px] uppercase font-bold tracking-wider">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Online
                </span>
              ) : (
                <span className="flex items-center gap-1 bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full border border-rose-100 text-[9px] uppercase font-bold tracking-wider">
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                  Offline
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* Playlist Grid */}
      <div className="flex-1 bg-white border border-[#e8edf2] rounded-[24px] flex flex-col overflow-hidden shadow-sm">
        <div className="border-b border-[#e8edf2] p-4 bg-zinc-50/50 flex justify-between items-center shrink-0">
          <h3 className="text-[#0b462c] text-xs font-bold uppercase tracking-wider">Mídias e Widgets Ativos</h3>
          <span className="text-xs font-bold text-zinc-500">{playlists.length} itens</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : playlists.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 py-12">
              <MonitorPlay className="w-12 h-12 mb-3 opacity-30 text-[#8b9aa5]" />
              <p className="text-sm font-semibold">Nenhuma mídia ativa para esta tela.</p>
              <Link to={`/agency/playlists/cadastrar?totem_id=${id}`} className="mt-4 px-4 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-xs uppercase tracking-wider hover:bg-emerald-100 transition-colors">
                Adicionar Mídia
              </Link>
            </div>
          ) : (
            playlists.map(item => {
              const isExpired = item.data_fim ? new Date(item.data_fim) < now : true;
              return (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-[#e8edf2] hover:bg-zinc-50/50 transition-all gap-4">
                  <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-zinc-100 overflow-hidden flex items-center justify-center shrink-0 border border-zinc-200">
                        {item.tipo_midia === 'video' ? (
                          <Film className="w-6 h-6 text-zinc-400" />
                        ) : item.tipo_midia === 'noticia' ? (
                          item.titulo?.toLowerCase().includes('clima') ? (
                            <Cloud className="w-6 h-6 text-indigo-500" />
                          ) : item.titulo?.toLowerCase().includes('loteria') ? (
                            <Hash className="w-6 h-6 text-emerald-500" />
                          ) : (
                            <LayoutGrid className="w-6 h-6 text-zinc-500" />
                          )
                        ) : (
                          <img src={item.arquivo_url || ''} alt={item.titulo || ''} className="w-full h-full object-cover bg-zinc-200" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-zinc-800 leading-tight">{item.titulo || 'Sem título'}</h4>
                          {!item.totem_id && (
                            <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">Global</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-semibold bg-zinc-100 text-zinc-600">
                            {item.tempo_exibicao || 0}s
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-semibold bg-zinc-100 text-zinc-600 uppercase">
                            {item.tipo_midia || 'imagem'}
                          </span>
                          {isExpired ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-semibold bg-rose-50 text-rose-600 uppercase">
                              Expirado
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-semibold bg-emerald-50 text-emerald-600 uppercase">
                              Ativo
                            </span>
                          )}
                        </div>
                      </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-100">
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider leading-none">Validade</p>
                        <p className="text-xs text-zinc-500 font-medium font-sans mt-1">
                          Até {(() => {
                            try {
                              if (!item.data_fim) return 'Data Inválida';
                              const dStr = typeof item.data_fim === 'string' ? item.data_fim.replace(' ', 'T') : String(item.data_fim);
                              const d = new Date(dStr);
                              return isNaN(d.getTime()) ? 'Data Inválida' : format(d, 'dd/MM/yyyy HH:mm');
                            } catch (e) {
                              return 'Data Inválida';
                            }
                          })()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link to={`/agency/playlists/cadastrar?edit=${item.id}&totem_id=${id}`} className="p-2 text-zinc-400 hover:text-[#0b462c] hover:bg-[#e8f5ed]/30 rounded-lg transition-all border border-transparent hover:border-[#e8edf2]">
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all border border-transparent hover:border-rose-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
