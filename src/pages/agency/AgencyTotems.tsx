import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import { Tv, Plus, Search, Trash2, Camera, Play, Tag, ChevronDown, CheckSquare, Square, X } from 'lucide-react';

interface Totem {
  id: number;
  nome: string;
  device_id: string;
  status: 'online' | 'offline';
  ultima_sincronizacao: string | null;
  auto_iniciar?: number | boolean;
  horario_liga?: string;
  horario_desliga?: string;
  horario_inicio?: string;
  horario_fim?: string;
}

export default function AgencyTotems() {
  const [totems, setTotems] = useState<Totem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  
  const [deviceId, setDeviceId] = useState('');
  const [error, setError] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await apiFetch('/api/totems', {
        method: 'POST',
        // The backend automatically generates a name if not provided
        body: JSON.stringify({ device_id: deviceId }),
      });
      setDeviceId('');
      setShowForm(false);
      loadTotems();
    } catch (err: any) {
      if (err.message === 'Limite de TVs atingindo' || err.code === 'LIMIT_REACHED') {
        setShowForm(false);
        setShowLimitModal(true);
      } else {
        setError(err.message);
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Deseja realmente excluir esta TV?')) {
      try {
        await apiFetch(`/api/totems/${id}`, { method: 'DELETE' });
        loadTotems();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const getTotemStatusColor = (totem: Totem) => {
    if (!totem.ultima_sincronizacao) return 'bg-[#e74c3c]'; // Sem Comunicação
    
    // Server sends UTC time, so we append Z to ensure the browser parses it correctly
    const lastSync = new Date(totem.ultima_sincronizacao.replace(' ', 'T') + 'Z');
    const now = new Date();
    
    const diffMinutes = (now.getTime() - lastSync.getTime()) / (1000 * 60);

    if (diffMinutes > 15 || diffMinutes < -15) {
      // Check if out of operating hours
      const hInicio = totem.horario_liga || totem.horario_inicio;
      const hFim = totem.horario_desliga || totem.horario_fim;
      
      if (hInicio && hFim) {
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const [startH, startM] = hInicio.split(':').map(Number);
        const [endH, endM] = hFim.split(':').map(Number);
        
        const startMinutes = startH * 60 + (startM || 0);
        const endMinutes = endH * 60 + (endM || 0);
        
        // Handle cases where end time is on the next day (e.g., 22:00 to 02:00)
        let isOut = false;
        if (startMinutes <= endMinutes) {
          isOut = currentMinutes < startMinutes || currentMinutes > endMinutes;
        } else {
          // Crosses midnight
          isOut = currentMinutes < startMinutes && currentMinutes > endMinutes;
        }

        if (isOut) {
          return 'bg-[#bdc3c7]'; // Sem comunicação (fora de horário)
        }
      }
      return 'bg-[#e74c3c]'; // Sem Comunicação
    } else if (diffMinutes > 5) {
      return 'bg-[#f1c40f]'; // Em Verificação
    } else {
      return 'bg-[#2ecc71]'; // Funcionando corretamente
    }
  };

  return (
    <div className="space-y-6 text-zinc-600 font-sans relative min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-[#104a9e] flex items-center gap-2 uppercase tracking-wide">
          <Tv className="w-6 h-6" />
          TVS
        </h2>
        <button 
          onClick={() => { setShowForm(true); setError(''); }}
          className="bg-[#0066ff] hover:bg-[#0052cc] text-white text-[11px] font-bold px-4 py-2.5 rounded transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          VINCULAR TV
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="relative w-full max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="w-4 h-4 text-[#104a9e]" />
          </span>
          <input 
            type="text" 
            placeholder="PESQUISAR" 
            className="w-full border-b border-zinc-200 bg-transparent py-2 pl-10 pr-4 text-xs font-bold text-[#104a9e] uppercase placeholder-[#104a9e] focus:outline-none focus:border-[#104a9e] transition-colors"
          />
        </div>
        
        <button className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase hover:text-zinc-800 transition-colors">
          <Tag className="w-4 h-4" />
          ETIQUETAS / PASTAS
        </button>
      </div>

      {/* Sorting / Pagination Info */}
      <div className="flex items-center justify-end gap-6 text-[10px] font-bold uppercase text-zinc-400">
        <div className="flex items-center gap-2">
          ORDENAR POR
          <button className="flex items-center gap-1 text-zinc-600 border-b border-zinc-300 pb-0.5">
            Data de Vínculo <ChevronDown className="w-3 h-3" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          TVS POR PÁGINA
          <button className="flex items-center gap-1 text-zinc-600 border border-zinc-300 rounded px-2 py-0.5">
            15 <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200">
              <tr>
                <th className="px-4 py-3 w-10 text-center"><Square className="w-4 h-4 inline-block text-zinc-300" /></th>
                <th className="px-4 py-3 font-semibold">Nome</th>
                <th className="px-4 py-3 font-semibold">Lista de Reprodução</th>
                <th className="px-4 py-3 font-semibold text-center">Captura de Tela</th>
              </tr>
            </thead>
            <tbody>
              {totems.length === 0 && !loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-400">Nenhuma TV cadastrada.</td>
                </tr>
              ) : (
                totems.map(totem => (
                  <tr key={totem.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors group">
                    <td className="px-4 py-4 text-center">
                      <Square className="w-4 h-4 inline-block text-zinc-300" />
                    </td>
                    <td className="px-4 py-4">
                      <Link to={`/agency/totems/${totem.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        {/* Play Icon Box */}
                        <div className={`w-8 h-8 rounded ${getTotemStatusColor(totem)} flex items-center justify-center shrink-0 shadow-sm transition-colors duration-300`}>
                          <Play className="w-4 h-4 text-white ml-0.5" />
                        </div>
                        <span className="font-semibold text-zinc-700 hover:text-[#104a9e] hover:underline">{totem.nome}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      {/* Link to Settings page */}
                      <Link to={`/agency/totems/${totem.id}`} className="inline-block bg-[#e74c3c] hover:bg-[#c0392b] text-white text-[10px] font-bold px-3 py-1.5 rounded transition-colors uppercase">
                        Selecione uma lista de reprodução para essa TV!
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-center relative">
                      <button className="w-8 h-8 rounded bg-[#9b59b6] flex items-center justify-center text-white mx-auto hover:bg-[#8e44ad] transition-colors">
                        <Camera className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(totem.id)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 text-zinc-400 hover:text-red-500 transition-all"
                        title="Excluir TV"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="text-[10px] text-zinc-500 uppercase tracking-wide">
        Mostrando de 1 a {totems.length} de {totems.length} TV{totems.length !== 1 ? 'S' : ''}
      </div>

      {/* Legends */}
      <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-zinc-500 uppercase">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-4 bg-[#2ecc71] rounded-sm"></div>
          Funcionando corretamente
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-4 bg-[#f1c40f] rounded-sm"></div>
          Em Verificação
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-4 bg-[#e74c3c] rounded-sm"></div>
          Sem Comunicação
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-4 bg-[#bdc3c7] rounded-sm"></div>
          Sem Comunicação fora do Horário de Funcionamento
        </div>
      </div>

      {/* Modal Vincular TV */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <h3 className="text-sm font-bold text-zinc-800">Vincular TV</h3>
              <button onClick={() => setShowForm(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              {error && <div className="mb-4 text-xs text-red-600 bg-red-50 p-3 rounded">{error}</div>}
              
              <div className="mb-6">
                <label className="block text-xs font-bold text-zinc-600 mb-2">Código da TV</label>
                <input
                  type="text"
                  required
                  className="w-full border border-zinc-300 rounded px-4 py-2.5 text-sm focus:border-[#104a9e] focus:outline-none transition-colors uppercase"
                  value={deviceId}
                  onChange={e => setDeviceId(e.target.value.toUpperCase())}
                  placeholder="Informe o código exibido na TV"
                />
                <p className="text-[10px] text-zinc-400 mt-2">O nome da TV será gerado automaticamente.</p>
              </div>
              
              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)} 
                  className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-700 transition-colors"
                >
                  CANCELAR
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-[#0066ff] hover:bg-[#0052cc] text-white rounded text-xs font-bold transition-colors"
                >
                  VINCULAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Limite de TVs Atingido */}
      {showLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <h3 className="text-sm font-bold text-zinc-800">Limite de TVs atingindo</h3>
              <button onClick={() => setShowLimitModal(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 text-center">
              <p className="text-sm text-zinc-600 mb-2">
                Você poderá vincular mais TVs ao realizar o upgrade de seu <a href="#" className="text-[#104a9e] hover:underline">plano</a>.
              </p>
              <p className="text-sm text-zinc-600 mb-8">
                <a href="#" className="text-[#104a9e] hover:underline">Contate o Suporte</a> caso tenha qualquer dúvida.
              </p>
              
              <button 
                onClick={() => setShowLimitModal(false)} 
                className="px-8 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded text-xs font-bold uppercase transition-colors"
              >
                FECHAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
