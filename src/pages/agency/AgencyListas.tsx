import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { List, Plus, Search, Tag, X, Edit2, Trash2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';

interface Playlist {
  id: string;
  nome: string;
  totens_vinculados: number;
  totens_nomes?: string;
  tempo_total: number;
  criado_em: string;
}

export default function AgencyListas() {
  const [listas, setListas] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [nomeLista, setNomeLista] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadListas();
  }, []);

  const loadListas = async () => {
    try {
      const data = await apiFetch('/api/listas');
      setListas(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeLista.trim()) return;
    
    setCreating(true);
    try {
      const res = await apiFetch('/api/listas', {
        method: 'POST',
        body: JSON.stringify({ nome: nomeLista })
      });
      setShowModal(false);
      navigate(`/agency/listas/${res.id}`);
    } catch (err) {
      console.error(err);
      alert('Erro ao criar lista.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir a lista "${nome}"? Esta ação removerá a lista de todos os totens vinculados.`)) {
      return;
    }
    try {
      await apiFetch(`/api/listas/${id}`, { method: 'DELETE' });
      setListas(listas.filter(l => l.id !== id));
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir lista.');
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto text-zinc-600 font-sans min-h-full pb-20 relative">
      {/* Header and Add Button */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <List className="w-5 h-5 text-[#104a9e]" />
          <h2 className="text-sm font-bold text-[#104a9e] uppercase tracking-wide">
            LISTAS DE REPRODUÇÃO
          </h2>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="bg-[#0066ff] hover:bg-[#0052cc] text-white text-[10px] font-bold px-4 py-2 rounded transition-colors uppercase flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          CRIAR LISTA
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-white border border-zinc-200 rounded-lg p-6">
        
        {/* Filters */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-full max-w-sm">
            <span className="absolute inset-y-0 left-3 flex items-center text-[#104a9e]">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text" 
              placeholder="PESQUISAR" 
              className="w-full border-b border-zinc-300 pl-9 pr-4 py-2 text-xs font-bold text-center text-[#104a9e] placeholder-[#104a9e] focus:outline-none focus:border-[#104a9e] bg-transparent uppercase" 
            />
          </div>
          
          <button className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-600 transition-colors uppercase">
            <Tag className="w-4 h-4" />
            ETIQUETAS / PASTAS
          </button>
        </div>

        {/* Sort and Pagination controls */}
        <div className="mt-6 flex flex-col md:flex-row justify-end items-center gap-4 text-[10px] font-bold text-zinc-400 uppercase">
          <div className="flex items-center gap-2">
            <span>ORDENAR POR</span>
            <select className="border border-zinc-200 rounded p-1 text-zinc-600 focus:outline-none">
              <option>Data de Criação</option>
              <option>Nome</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span>LISTAS POR PÁGINA</span>
            <select className="border border-zinc-200 rounded p-1 text-zinc-600 focus:outline-none">
              <option>15</option>
              <option>30</option>
              <option>50</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="mt-4 border border-zinc-200 rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-xs text-zinc-500">
                  <th className="px-4 py-3 w-12 text-center">
                    <input type="checkbox" className="rounded border-zinc-300 text-[#104a9e] focus:ring-[#104a9e]" />
                  </th>
                  <th className="px-4 py-3 font-semibold">Nome</th>
                  <th className="px-4 py-3 font-semibold text-center border-l border-zinc-200">
                    TVs que veiculam esta lista de reprodução
                  </th>
                  <th className="px-4 py-3 font-semibold text-center w-40 border-l border-zinc-200">
                    Tempo de duração
                  </th>
                  <th className="px-4 py-3 font-semibold text-right border-l border-zinc-200">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-sm bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#104a9e] mx-auto"></div>
                    </td>
                  </tr>
                ) : listas.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                      Nenhuma lista encontrada.
                    </td>
                  </tr>
                ) : (
                  listas.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-4 text-center">
                        <input type="checkbox" className="rounded border-zinc-300 text-[#104a9e] focus:ring-[#104a9e]" />
                      </td>
                      <td className="px-4 py-4">
                        <Link 
                          to={`/agency/listas/${item.id}`}
                          className="bg-zinc-100 text-zinc-600 hover:bg-zinc-200 text-[11px] px-3 py-1.5 rounded border border-zinc-200 transition-colors cursor-pointer block w-max font-medium"
                        >
                          {item.nome}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-center border-l border-zinc-200 text-zinc-500 font-medium">
                        {item.totens_nomes ? (
                          <div className="flex flex-wrap justify-center gap-2">
                            {item.totens_nomes.split('||').map((tvInfo, i) => {
                              const [id, nome] = tvInfo.split('::');
                              return (
                                <Link 
                                  key={i} 
                                  to={`/agency/totems/${id}`}
                                  className="bg-[#eaf2f8] text-[#3498db] hover:bg-[#d6eaf8] px-2.5 py-1 rounded text-[10px] font-bold shadow-sm whitespace-nowrap transition-colors"
                                >
                                  {nome}
                                </Link>
                              );
                            })}
                          </div>
                        ) : (
                          "0"
                        )}
                      </td>
                      <td className="px-4 py-4 text-center border-l border-zinc-200">
                        <span className="text-[#e67e22] text-xs font-mono font-bold px-2 py-1 border border-[#e67e22]/30 rounded">
                          {formatTime(item.tempo_total)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right border-l border-zinc-200">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/agency/listas/${item.id}`)}
                            className="p-1.5 text-zinc-400 hover:text-[#0066ff] hover:bg-blue-50 rounded transition-colors"
                            title="Editar Lista"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.nome)}
                            className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Excluir Lista"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 text-[10px] text-zinc-500">
          Mostrando de 1 a {listas.length} de {listas.length} lista
        </div>

      </div>

      {/* Modal Criar Lista */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-zinc-100">
              <h3 className="font-medium text-sm text-zinc-800">Digite o nome da Lista de Reprodução</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6">
              <input
                type="text"
                autoFocus
                placeholder="Nome da Lista de Reprodução"
                value={nomeLista}
                onChange={e => setNomeLista(e.target.value)}
                className="w-full border border-zinc-300 rounded p-3 text-sm text-zinc-700 focus:outline-none focus:border-[#0066ff] focus:ring-1 focus:ring-[#0066ff] text-center"
              />
              
              <div className="flex items-center justify-center gap-3 mt-8">
                <button
                  type="submit"
                  disabled={creating || !nomeLista.trim()}
                  className="bg-[#0066ff] hover:bg-[#0052cc] disabled:opacity-50 text-white text-xs font-bold px-6 py-2 rounded transition-colors uppercase"
                >
                  {creating ? 'Criando...' : 'Criar Lista'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-zinc-200 hover:bg-zinc-300 text-zinc-600 text-xs font-bold px-6 py-2 rounded transition-colors uppercase"
                >
                  Fechar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
