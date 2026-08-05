import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MonitorPlay, Film, Cloud, Hash, LayoutGrid, Trash2, Edit2, Activity, Plus, Play, Pause } from 'lucide-react';
import { format } from 'date-fns';

interface Totem {
  id: string;
  nome: string;
  device_id: string;
  status: 'online' | 'offline';
  ultima_sincronizacao: string | null;
}

interface Playlist {
  id: string;
  totem_id: string | null;
  titulo: string;
  tipo_midia: string;
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
  const [notFound, setNotFound] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const [tData, pData] = await Promise.all([
        apiFetch('/api/totems'),
        apiFetch('/api/playlists')
      ]);

      // Backend retorna id como string — comparamos tudo como string
      const totemId = String(id);
      const foundTotem = Array.isArray(tData)
        ? tData.find((t: Totem) => String(t.id) === totemId)
        : null;

      if (!foundTotem) {
        setNotFound(true);
        setTotem(null);
      } else {
        setTotem(foundTotem);
      }

      // Mídias daquela tela OU globais (totem_id === null)
      if (Array.isArray(pData)) {
        const filtered = pData.filter((p: Playlist) => {
          const pTotemId = p.totem_id !== null && p.totem_id !== undefined ? String(p.totem_id) : null;
          return pTotemId === null || pTotemId === totemId;
        });
        setPlaylists(filtered);
      } else {
        setPlaylists([]);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const handleDelete = async (deleteId: string) => {
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

  const handleToggleActive = async (item: Playlist) => {
    try {
      const newStatus = item.ativo === 1 ? 0 : 1;
      await apiFetch(`/api/playlists/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: newStatus })
      });
      loadData();
    } catch (err) {
      console.error(err);
      alert('Erro ao alterar status da mídia.');
    }
  };

  const now = new Date();

  const formatDate = (dateStr: string) => {
    try {
      if (!dateStr) return 'Sem data';
      const d = new Date(dateStr.replace(' ', 'T'));
      return isNaN(d.getTime()) ? 'Data inválida' : format(d, 'dd/MM/yyyy HH:mm');
    } catch {
      return 'Data inválida';
    }
  };

  const isExpired = (dateStr: string) => {
    try {
      const d = new Date(dateStr.replace(' ', 'T'));
      return isNaN(d.getTime()) || d < now;
    } catch {
      return true;
    }
  };

  const getIcon = (item: Playlist) => {
    if (item.tipo_midia === 'video') return <Film className="w-6 h-6 text-zinc-400" />;
    if (item.tipo_midia === 'noticia') {
      if (item.titulo?.toLowerCase().includes('clima')) return <Cloud className="w-6 h-6 text-indigo-500" />;
      if (item.titulo?.toLowerCase().includes('loteria')) return <Hash className="w-6 h-6 text-emerald-500" />;
      return <LayoutGrid className="w-6 h-6 text-zinc-500" />;
    }
    // imagem
    if (item.arquivo_url) {
      return <img src={item.arquivo_url} alt={item.titulo || ''} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />;
    }
    return <MonitorPlay className="w-6 h-6 text-zinc-300" />;
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 shrink-0">
        <Link
          to="/agency/playlists/telas"
          className="p-2 bg-white border border-[#e8edf2] rounded-xl hover:bg-zinc-50 hover:border-zinc-300 transition-all text-zinc-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-extrabold text-[#0b462c] tracking-tight truncate">
            {loading ? 'Carregando...' : notFound ? 'Tela não encontrada' : totem?.nome}
          </h2>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {totem && (
              <>
                <span className="text-xs text-[#8b9aa5] font-medium flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" /> ID: {totem.device_id}
                </span>
                {totem.status === 'online' ? (
                  <span className="flex items-center gap-1 bg-[#e8f5ed] text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100 text-[9px] uppercase font-bold tracking-wider">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>Online
                  </span>
                ) : (
                  <span className="flex items-center gap-1 bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full border border-rose-100 text-[9px] uppercase font-bold tracking-wider">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>Offline
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        {/* Botão Adicionar Mídia */}
        <Link
          to={`/agency/playlists/cadastrar?totem_id=${id}`}
          className="flex items-center gap-2 bg-[#0b462c] hover:bg-[#082a1b] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md shrink-0"
        >
          <Plus className="w-4 h-4" />
          Adicionar Mídia
        </Link>
      </div>

      {/* Lista */}
      <div className="flex-1 bg-white border border-[#e8edf2] rounded-[24px] flex flex-col overflow-hidden shadow-sm">
        <div className="border-b border-[#e8edf2] p-4 bg-zinc-50/50 flex justify-between items-center shrink-0">
          <h3 className="text-[#0b462c] text-xs font-bold uppercase tracking-wider">Mídias e Widgets Ativos</h3>
          <span className="text-xs font-bold text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full">{playlists.length} {playlists.length === 1 ? 'item' : 'itens'}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : playlists.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 py-16">
              <MonitorPlay className="w-14 h-14 mb-4 opacity-20 text-[#8b9aa5]" />
              <p className="text-sm font-semibold text-zinc-500">Nenhuma mídia ativa para esta tela.</p>
              <p className="text-xs text-zinc-400 mt-1 text-center max-w-xs">
                Clique em "Adicionar Mídia" para cadastrar conteúdo para esta tela.
              </p>
              <Link
                to={`/agency/playlists/cadastrar?totem_id=${id}`}
                className="mt-5 px-5 py-2.5 bg-emerald-50 text-emerald-700 font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-emerald-100 transition-colors border border-emerald-100"
              >
                Adicionar Mídia
              </Link>
            </div>
          ) : (
            playlists.map(item => {
              const expired = isExpired(item.data_fim);
              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-[#e8edf2] hover:bg-zinc-50/50 transition-all gap-4"
                >
                  {/* Thumbnail + Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-16 h-16 rounded-xl bg-zinc-100 overflow-hidden flex items-center justify-center shrink-0 border border-zinc-200">
                      {getIcon(item)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-extrabold text-zinc-800 leading-tight">{item.titulo || 'Sem título'}</h4>
                        {!item.totem_id && (
                          <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider shrink-0">Global</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-semibold bg-zinc-100 text-zinc-600">
                          {item.tempo_exibicao || 0}s
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-semibold bg-zinc-100 text-zinc-600 uppercase">
                          {item.tipo_midia || 'imagem'}
                        </span>
                        {expired ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-semibold bg-rose-50 text-rose-600 uppercase">Expirado</span>
                        ) : item.ativo === 1 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-semibold bg-emerald-50 text-emerald-600 uppercase">Ativo</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-semibold bg-amber-50 text-amber-600 uppercase">Pausado</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Validade + Ações */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-100">
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider leading-none">Validade</p>
                      <p className="text-xs text-zinc-600 font-medium mt-1">Até {formatDate(item.data_fim)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleActive(item)}
                        className={`p-2 rounded-lg transition-all border border-transparent ${item.ativo === 1 ? 'text-zinc-400 hover:text-amber-500 hover:bg-amber-50 hover:border-amber-100' : 'text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 hover:border-emerald-100'}`}
                        title={item.ativo === 1 ? "Pausar Mídia" : "Tocar Mídia"}
                      >
                        {item.ativo === 1 ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <Link
                        to={`/agency/playlists/cadastrar?edit=${item.id}&totem_id=${id}`}
                        className="p-2 text-zinc-400 hover:text-[#0b462c] hover:bg-[#e8f5ed]/50 rounded-lg transition-all border border-transparent hover:border-[#e8edf2]"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all border border-transparent hover:border-rose-100"
                        title="Excluir"
                      >
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
