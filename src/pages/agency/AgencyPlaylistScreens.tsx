import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { Tv, MonitorPlay, ChevronRight, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../components/layout/Layout';

interface Totem {
  id: number;
  nome: string;
  device_id: string;
  status: 'online' | 'offline';
  ultima_sincronizacao: string | null;
}

export default function AgencyPlaylistScreens() {
  const [totems, setTotems] = useState<Totem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTotems = async () => {
    try {
      const data = await apiFetch('/api/totems');
      setTotems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTotems();
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
          {totems.map((totem) => (
            <Link 
              key={totem.id} 
              to={`/agency/playlists/telas/${totem.id}`}
              className="bg-white border border-[#e8edf2] rounded-[24px] p-6 hover:shadow-md hover:border-emerald-200 transition-all group flex flex-col justify-between h-48"
            >
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MonitorPlay className="w-6 h-6" />
                </div>
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
              </div>
              
              <div className="mt-4">
                <h3 className="text-lg font-bold text-[#0b462c] truncate">{totem.nome}</h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500 font-medium">
                  <Activity className="w-3.5 h-3.5" />
                  <span>ID: {totem.device_id}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between text-emerald-600">
                <span className="text-[10px] font-bold uppercase tracking-widest">Ver Playlist</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
