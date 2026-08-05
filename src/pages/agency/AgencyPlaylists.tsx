import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { MonitorPlay, UploadCloud, Film, Image as ImageIcon, Trash2, Edit2, X, Cloud, Hash, LayoutGrid } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useSearchParams } from 'react-router-dom';

interface Totem {
  id: string;
  nome: string;
  device_id: string;
}

interface Playlist {
  id: string;
  totem_id: string | null;
  titulo: string;
  tipo_midia: 'video' | 'imagem' | string;
  tempo_exibicao: number;
  data_inicio: string;
  data_fim: string;
  arquivo_url: string;
  ativo: number;
}

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) return <div className="p-8 bg-red-50 text-red-900 border border-red-200 rounded-xl"><h2>Frontend Crash</h2><pre>{this.state.error?.message}</pre><pre className="text-xs mt-2">{this.state.error?.stack}</pre></div>;
    return this.props.children;
  }
}

export default function AgencyPlaylists() {
  const [searchParams] = useSearchParams();
  const [totems, setTotems] = useState<Totem[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [useBlob, setUseBlob] = useState(false);
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State - Midia
  const [selectedTotem, setSelectedTotem] = useState(searchParams.get('totem_id') || '');
  const [formTotemId, setFormTotemId] = useState(searchParams.get('totem_id') || '');
  const [titulo, setTitulo] = useState('');
  const [tipoMidia, setTipoMidia] = useState<'video' | 'imagem'>('imagem');
  const [tempoExibicao, setTempoExibicao] = useState(15);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadData = async () => {
    try {
      const [tData, pData, configData] = await Promise.all([
        apiFetch('/api/totems'),
        apiFetch('/api/playlists'),
        apiFetch('/api/config').catch(() => ({ useBlob: false }))
      ]);
      setTotems(tData);
      setPlaylists(pData);
      setUseBlob(!!configData?.useBlob);
      if (tData.length > 0 && !selectedTotem) setSelectedTotem('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && playlists.length > 0) {
      const itemToEdit = playlists.find(p => p.id === editId || p.id === Number(editId) as any);
      if (itemToEdit && editingId !== itemToEdit.id) {
        handleEdit(itemToEdit);
      }
    }
  }, [searchParams, playlists]);

  // Sync selected screen filter with the new media form
  useEffect(() => {
    if (!editingId) {
      setFormTotemId(selectedTotem);
    }
  }, [selectedTotem, editingId]);

  const handleEdit = (item: Playlist) => {
    setEditingId(item.id);
    setFormTotemId(item.totem_id ? item.totem_id : '');
    setTempoExibicao(item.tempo_exibicao);
    
    // Format dates for datetime-local input
    const start = new Date(item.data_inicio);
    const end = new Date(item.data_fim);
    
    setTitulo(item.titulo);
    setTipoMidia(item.tipo_midia as any);
    setDataInicio(format(start, "yyyy-MM-dd'T'HH:mm"));
    setDataFim(format(end, "yyyy-MM-dd'T'HH:mm"));
    setFile(null); // File won't be prepopulated
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitulo('');
    setFile(null);
    setFormTotemId(selectedTotem); // Reset to current filter instead of empty
    setTipoMidia('imagem');
    setTempoExibicao(15);
    setDataInicio('');
    setDataFim('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId && !file) return alert('Selecione um arquivo');
    setUploading(true);

    try {
      let bodyData: any = {
        totem_id: formTotemId ? formTotemId : null,
        titulo,
        tipo_midia: tipoMidia,
        tempo_exibicao: Number(tempoExibicao),
        data_inicio: new Date(dataInicio).toISOString(),
        data_fim: new Date(dataFim).toISOString(),
      };

      if (file && useBlob) {
        // Direct Client-Side Upload to Vercel Blob to bypass 4.5MB server limit
        const { upload } = await import('@vercel/blob/client');
        const sanitizedOriginal = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueFilename = `uploads/${Date.now()}-${sanitizedOriginal}`;
        const blob = await upload(uniqueFilename, file, {
          access: 'public',
          handleUploadUrl: '/api/blob/upload'
        });
        bodyData.arquivo_url = uniqueFilename.replace('uploads/', '');
      }

      if (useBlob) {
        // Send JSON representation
        await apiFetch(editingId ? `/api/playlists/${editingId}` : '/api/playlists', {
          method: editingId ? 'PUT' : 'POST',
          body: JSON.stringify(bodyData),
        });
      } else {
        // Fallback to standard Multipart Form Data upload
        const formData = new FormData();
        formData.append('totem_id', formTotemId);
        formData.append('titulo', titulo);
        formData.append('tipo_midia', tipoMidia);
        formData.append('tempo_exibicao', tempoExibicao.toString());
        formData.append('data_inicio', new Date(dataInicio).toISOString());
        formData.append('data_fim', new Date(dataFim).toISOString());
        if (file) formData.append('arquivo', file);

        await apiFetch(editingId ? `/api/playlists/${editingId}` : '/api/playlists', {
          method: 'POST', // IMPORTANT: PHP cannot parse multipart/form-data on PUT requests. We must use POST.
          body: formData,
        });
      }

      cancelEdit();
      loadData();
    } catch (err: any) {
      console.error(err);
      alert('Erro ao enviar mídia: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setUploading(false);
    }
  };
  
  const handleDelete = async (id: string) => {
     if (confirm('Excluir mídia?')) {
       await apiFetch(`/api/playlists/${id}`, { method: 'DELETE' });
       if (editingId === id) cancelEdit();
       loadData();
     }
  };

  const filteredPlaylists = selectedTotem 
    ? playlists.filter(p => p.totem_id === selectedTotem || p.totem_id === null)
    : playlists;

  const now = new Date();

  return (
    <ErrorBoundary>
    <div className="space-y-6 flex flex-col h-full">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0b462c] tracking-tight">Cadastrar Mídias</h2>
          <p className="text-xs text-[#8b9aa5] font-medium mt-1">Envie mídias e widgets para suas telas de exibição.</p>
        </div>
        {/* Filtro de tela */}
        <div className="flex items-center gap-3 bg-white border border-[#e8edf2] rounded-2xl px-4 py-2.5 shadow-sm">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest shrink-0">Tela:</span>
          <select
            className="bg-transparent border-none outline-none text-zinc-700 text-sm font-medium cursor-pointer"
            value={selectedTotem}
            onChange={(e) => setSelectedTotem(e.target.value)}
          >
            <option value="">Todas (Global)</option>
            {Array.isArray(totems) && totems.map(t => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-5 gap-6 overflow-hidden">

        {/* ── Left: Form ── */}
        <div className="xl:col-span-2 bg-white border border-[#e8edf2] rounded-[24px] flex flex-col overflow-hidden shadow-sm">
          {/* Form header */}
          {editingId ? (
            <div className="bg-emerald-500/10 border-b border-emerald-100 px-6 py-3 flex items-center justify-between shrink-0">
              <span className="text-emerald-700 text-xs font-bold uppercase tracking-widest">✏️ Editando Mídia</span>
              <button onClick={cancelEdit} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="border-b border-[#e8edf2] px-6 py-4 bg-zinc-50/50 shrink-0">
              <h3 className="text-[#0b462c] text-sm font-bold">Adicionar Nova Mídia</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Preencha os campos abaixo para adicionar conteúdo</p>
            </div>
          )}

          <div className="p-6 overflow-y-auto flex-1">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Tela de Exibição */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                  📺 Tela de Exibição
                </label>
                <select
                  className="w-full bg-white border-2 border-zinc-200 rounded-xl px-4 py-3 text-zinc-800 text-sm focus:border-emerald-500 outline-none transition-all hover:border-zinc-300"
                  value={formTotemId}
                  onChange={(e) => setFormTotemId(e.target.value)}
                >
                  <option value="">🌐 Todas as Telas (Global)</option>
                  {Array.isArray(totems) && totems.map(t => (
                    <option key={t.id} value={t.id}>📺 {t.nome}</option>
                  ))}
                </select>
              </div>

              {/* Título */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                  🏷️ Título da Mídia
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Publicidade Verão 2026"
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  className="w-full bg-white border-2 border-zinc-200 rounded-xl px-4 py-3 text-zinc-800 text-sm placeholder:text-zinc-300 focus:border-emerald-500 outline-none transition-all hover:border-zinc-300"
                />
              </div>

              {/* Tipo + Duração */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                    🎞️ Tipo
                  </label>
                  <select
                    value={tipoMidia}
                    onChange={e => setTipoMidia(e.target.value as any)}
                    className="w-full bg-white border-2 border-zinc-200 rounded-xl px-4 py-3 text-zinc-800 text-sm focus:border-emerald-500 outline-none transition-all hover:border-zinc-300"
                  >
                    <option value="imagem">🖼️ Imagem</option>
                    <option value="video">🎥 Vídeo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                    ⏱️ Duração (seg)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={tempoExibicao}
                    onChange={e => setTempoExibicao(Number(e.target.value))}
                    className="w-full bg-white border-2 border-zinc-200 rounded-xl px-4 py-3 text-zinc-800 text-sm focus:border-emerald-500 outline-none transition-all hover:border-zinc-300"
                  />
                </div>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                    📅 Início
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={dataInicio}
                    onChange={e => setDataInicio(e.target.value)}
                    className="w-full bg-white border-2 border-zinc-200 rounded-xl px-3 py-3 text-zinc-800 text-sm focus:border-emerald-500 outline-none transition-all hover:border-zinc-300 [color-scheme:light]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                    📅 Fim
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={dataFim}
                    onChange={e => setDataFim(e.target.value)}
                    className="w-full bg-white border-2 border-zinc-200 rounded-xl px-3 py-3 text-zinc-800 text-sm focus:border-emerald-500 outline-none transition-all hover:border-zinc-300 [color-scheme:light]"
                  />
                </div>
              </div>

              {/* Upload */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                  📁 Arquivo {editingId && <span className="text-zinc-300 normal-case font-normal">(deixe vazio para manter o atual)</span>}
                </label>
                <div className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer
                  ${file ? 'border-emerald-400 bg-emerald-50/30' : 'border-zinc-200 hover:border-emerald-400 bg-zinc-50/50 hover:bg-emerald-50/20'}`}>
                  <input
                    type="file"
                    accept={tipoMidia === 'imagem' ? 'image/*' : 'video/*'}
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <UploadCloud className={`w-9 h-9 mx-auto mb-2 ${file ? 'text-emerald-500' : 'text-zinc-300'}`} />
                  {file ? (
                    <div>
                      <span className="text-sm font-bold text-emerald-700 block">{file.name}</span>
                      <span className="text-[11px] text-emerald-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-sm font-semibold text-zinc-400 block">Clique ou arraste o arquivo aqui</span>
                      <span className="text-[11px] text-zinc-300">{tipoMidia === 'imagem' ? 'PNG, JPG, WEBP, GIF' : 'MP4, WEBM, AVI'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-2">
                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex-1 border-2 border-zinc-200 hover:bg-zinc-50 text-zinc-600 font-bold text-sm py-3.5 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-[#0b462c] hover:bg-[#082a1b] disabled:bg-zinc-300 text-white font-bold text-sm py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Enviando...
                    </>
                  ) : editingId ? (
                    '✅ Salvar Alterações'
                  ) : (
                    '➕ Adicionar Mídia'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Right: Recent Media List ── */}
        <div className="xl:col-span-3 bg-white border border-[#e8edf2] rounded-[24px] flex flex-col overflow-hidden shadow-sm">
          <div className="border-b border-[#e8edf2] px-6 py-4 bg-zinc-50/50 flex justify-between items-center shrink-0">
            <div>
              <h3 className="text-[#0b462c] text-sm font-bold">Mídias Cadastradas</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {selectedTotem
                  ? `Exibindo mídias de: ${totems.find(t => t.id === selectedTotem)?.nome || 'Tela selecionada'}`
                  : 'Todas as mídias cadastradas'}
              </p>
            </div>
            <span className="text-xs font-bold text-zinc-500 bg-zinc-100 px-3 py-1.5 rounded-full">
              {filteredPlaylists.length} {filteredPlaylists.length === 1 ? 'item' : 'itens'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : filteredPlaylists.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 py-16">
                <MonitorPlay className="w-14 h-14 mb-4 opacity-20 text-[#8b9aa5]" />
                <p className="text-sm font-semibold text-zinc-500">Nenhuma mídia cadastrada</p>
                <p className="text-xs text-zinc-400 mt-1 text-center max-w-xs">
                  Preencha o formulário ao lado para adicionar sua primeira mídia.
                </p>
              </div>
            ) : (
              filteredPlaylists.map(item => {
                const isExpired = item.data_fim ? new Date(item.data_fim) < now : true;
                const isEditing = editingId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all
                      ${isEditing
                        ? 'border-emerald-300 bg-emerald-50/40 shadow-sm'
                        : 'border-[#e8edf2] hover:bg-zinc-50/50 hover:border-zinc-300'}`}
                  >
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-xl bg-zinc-100 overflow-hidden flex items-center justify-center shrink-0 border border-zinc-200">
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
                      ) : item.arquivo_url ? (
                        <img src={item.arquivo_url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as any).style.display='none'; }} />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-zinc-300" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-zinc-800 truncate">{item.titulo || 'Sem título'}</h4>
                        {!item.totem_id && (
                          <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider shrink-0">Global</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-semibold bg-zinc-100 text-zinc-600">
                          {item.tempo_exibicao || 0}s
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-semibold bg-zinc-100 text-zinc-500 uppercase">
                          {item.tipo_midia}
                        </span>
                        {isExpired ? (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-semibold bg-rose-50 text-rose-600 uppercase">Expirado</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-semibold bg-emerald-50 text-emerald-600 uppercase">Ativo</span>
                        )}
                      </div>
                      {item.data_fim && (
                        <p className="text-[10px] text-zinc-400 mt-1">
                          Até {(() => { try { const d = new Date(item.data_fim); return isNaN(d.getTime()) ? '—' : format(d, 'dd/MM/yyyy HH:mm'); } catch { return '—'; } })()}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleEdit(item)}
                        title="Editar"
                        className={`p-2 rounded-lg transition-all border
                          ${isEditing
                            ? 'text-emerald-600 bg-emerald-100 border-emerald-200'
                            : 'text-zinc-400 hover:text-[#0b462c] hover:bg-[#e8f5ed]/50 border-transparent hover:border-[#e8edf2]'}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        title="Excluir"
                        className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all border border-transparent hover:border-rose-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}

