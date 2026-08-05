import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { Tv, MonitorPlay, ChevronRight, Activity, ListVideo, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Totem {
  id: string;
  nome: string;
  device_id: string;
  status: 'online' | 'offline';
  ultima_sincronizacao: string | null;
}

interface PlaylistCount {
  [key: string]: number;
}

function formatUptime(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    const since = new Date(dateStr.replace(' ', 'T'));
    if (isNaN(since.getTime())) return '';
    const diffMs = Date.now() - since.getTime();
    if (diffMs < 0) return '';
    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  } catch {
    return '';
  }
}

export default function AgencyPlaylistScreens() {
  const [totems, setTotems] = useState<Totem[]>([]);
  const [playlistCounts, setPlaylistCounts] = useState<PlaylistCount>({});
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  const loadData = async () => {
    try {
      const [tData, pData] = await Promise.all([
        apiFetch('/api/totems'),
        apiFetch('/api/playlists')
      ]);
      
      setTotems(Array.isArray(tData) ? tData : []);

      // Count playlists per totem
      const counts: PlaylistCount = {};
      if (Array.isArray(pData)) {
        pData.forEach((p: any) => {
          if (p.totem_id) {
            const key = String(p.totem_id);
            counts[key] = (counts[key] || 0) + 1;
          }
        });
      }
      setPlaylistCounts(counts);
    } catch (err) {
      console.error('Erro ao carregar telas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Re-render every 60s to keep uptime fresh
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);


  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0b462c] tracking-tight">Telas em Exibição</h2>
          <p className="text-xs text-[#8b9aa5] font-medium mt-1">
            Selecione uma tela para visualizar ou gerenciar a playlist ativa nela.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : totems.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white border border-[#e8edf2] rounded-[24px] shadow-sm">
          <Tv className="w-12 h-12 text-zinc-300 mb-4" />
          <h3 className="text-zinc-500 font-bold">Nenhuma tela encontrada</h3>
          <p className="text-zinc-400 text-xs text-center max-w-sm mt-2">
            Você ainda não possui telas cadastradas. Vá em "Minhas Telas" para adicionar um novo Totem.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {totems.map((totem) => {
            const count = playlistCounts[String(totem.id)] || 0;
            return (
              <Link
                key={totem.id}
                to={`/agency/playlists/telas/${totem.id}`}
                className="bg-white border border-[#e8edf2] rounded-[24px] p-6 hover:shadow-md hover:border-emerald-200 transition-all group flex flex-col justify-between h-52"
              >
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MonitorPlay className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {totem.status === 'online' ? (
                      <span className="flex items-center gap-1.5 bg-[#e8f5ed] text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-100 text-[9px] uppercase font-bold tracking-wider">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        Online
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full border border-rose-100 text-[9px] uppercase font-bold tracking-wider">
                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                        Offline
                      </span>
                    )}
                    {totem.status === 'online' && formatUptime(totem.ultima_sincronizacao) && (
                      <span className="flex items-center gap-1 text-[9px] text-emerald-600 font-semibold bg-emerald-50/60 px-2 py-0.5 rounded-full border border-emerald-100">
                        <Clock className="w-2.5 h-2.5 shrink-0" />
                        {formatUptime(totem.ultima_sincronizacao)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <h3 className="text-lg font-bold text-[#0b462c] truncate">{totem.nome}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500 font-medium">
                    <Activity className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">ID: {totem.device_id}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-400">
                    <ListVideo className="w-3.5 h-3.5" />
                    <span>{count} {count === 1 ? 'mídia' : 'mídias'} cadastrada{count === 1 ? '' : 's'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between text-emerald-600">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Ver Playlist</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
