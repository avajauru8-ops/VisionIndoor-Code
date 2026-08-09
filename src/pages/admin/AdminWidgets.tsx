import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { LayoutTemplate, Edit, CheckCircle, XCircle, Search, Save, X, AlertTriangle } from 'lucide-react';

export default function AdminWidgets() {
  const [widgets, setWidgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Edit State
  const [editingWidget, setEditingWidget] = useState<any | null>(null);
  const [editApiUrl, setEditApiUrl] = useState('');
  const [editApiKey, setEditApiKey] = useState('');
  const [editAtivo, setEditAtivo] = useState(true);
  const [editManutencao, setEditManutencao] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadWidgets = async () => {
    try {
      const data = await apiFetch('/api/admin/widgets');
      setWidgets(data || []);
    } catch (err) {
      console.error('Erro ao carregar widgets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWidgets();
  }, []);

  const handleEdit = (widget: any) => {
    setEditingWidget(widget);
    setEditApiUrl(widget.api_url || '');
    setEditApiKey(widget.api_key || '');
    setEditAtivo(widget.ativo);
    setEditManutencao(widget.em_manutencao);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWidget) return;
    setSaving(true);
    try {
      await apiFetch(`/api/admin/widgets/${editingWidget.id}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          api_url: editApiUrl, 
          api_key: editApiKey,
          ativo: editAtivo,
          em_manutencao: editManutencao
        }),
      });
      alert('Widget atualizado com sucesso!');
      setEditingWidget(null);
      loadWidgets();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar widget.');
    } finally {
      setSaving(false);
    }
  };

  const filteredWidgets = widgets.filter(w => 
    w.nome.toLowerCase().includes(search.toLowerCase()) ||
    w.identificador.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0b462c] tracking-tight flex items-center gap-2">
            <LayoutTemplate className="w-6 h-6 text-emerald-600" />
            Gestão de Widgets
          </h2>
          <p className="text-xs text-[#8b9aa5] font-medium mt-1">
            Configure as APIs, ative/desative ou coloque widgets em manutenção.
          </p>
        </div>
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-zinc-400" />
          </span>
          <input 
            type="text" 
            placeholder="Buscar widget..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-full pl-9 pr-4 py-2 text-xs text-[#0b462c] placeholder-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" 
          />
        </div>
      </div>

      <div className="bg-white border border-[#e8edf2] rounded-[24px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-sm text-zinc-400">Carregando widgets...</div>
          ) : filteredWidgets.length === 0 ? (
            <div className="p-12 text-center text-sm text-zinc-400">Nenhum widget encontrado. (Execute a migração primeiro).</div>
          ) : (
            <table className="w-full text-left text-xs font-sans text-zinc-600">
              <thead className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 border-b border-[#e8edf2] bg-zinc-50/50">
                <tr>
                  <th className="px-6 py-4">Nome do Widget</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">URL da API</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8edf2]">
                {filteredWidgets.map((widget) => (
                  <tr key={widget.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-zinc-800 flex items-center gap-2">
                      <LayoutTemplate className="w-4 h-4 text-zinc-400" />
                      {widget.nome}
                      <span className="ml-2 font-mono text-[9px] bg-zinc-100 text-zinc-400 px-1.5 py-0.5 rounded">
                        {widget.identificador}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {widget.em_manutencao ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-100">
                          <AlertTriangle className="w-3 h-3" /> Manutenção
                        </span>
                      ) : widget.ativo ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                          <CheckCircle className="w-3 h-3" /> Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-100">
                          <XCircle className="w-3 h-3" /> Desativado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-zinc-500 truncate max-w-xs" title={widget.api_url}>
                      {widget.api_url || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleEdit(widget)}
                        className="p-1.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Configurar Widget"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingWidget && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-[24px] border border-[#e8edf2] max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#e8edf2] pb-4 mb-4">
              <h3 className="text-sm font-extrabold text-[#0b462c] uppercase tracking-wider flex items-center gap-2">
                <Edit className="w-4 h-4 text-emerald-600" />
                Configurar {editingWidget.nome}
              </h3>
              <button 
                onClick={() => setEditingWidget(null)}
                className="p-1 text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">URL da API Base</label>
                <input 
                  type="text" 
                  value={editApiUrl}
                  onChange={e => setEditApiUrl(e.target.value)}
                  placeholder="Ex: https://api.exemplo.com/v1"
                  className="w-full bg-[#f4f6f8] border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:border-emerald-500 outline-none transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Chave da API (API Key) - Opcional</label>
                <input 
                  type="text" 
                  value={editApiKey}
                  onChange={e => setEditApiKey(e.target.value)}
                  placeholder="Sua chave secreta se necessário"
                  className="w-full bg-[#f4f6f8] border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:border-emerald-500 outline-none transition-all font-mono"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={editAtivo} 
                    onChange={e => setEditAtivo(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-zinc-300"
                  />
                  <span className="text-sm font-bold text-zinc-700">Ativo</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={editManutencao} 
                    onChange={e => setEditManutencao(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-zinc-300"
                  />
                  <span className="text-sm font-bold text-zinc-700">Em Manutenção</span>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#e8edf2]">
                <button 
                  type="button" 
                  onClick={() => setEditingWidget(null)}
                  className="px-4 py-2 text-xs font-bold text-zinc-500 hover:bg-zinc-100 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="px-5 py-2 bg-[#0b462c] hover:bg-[#082a1b] text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
