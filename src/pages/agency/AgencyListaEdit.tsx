import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { List, Settings, Save, X, Search, FileText, Play, DownloadCloud, GripVertical, Plus } from 'lucide-react';

interface Media {
  id: string;
  titulo: string;
  tipo_midia: string;
  arquivo_url: string;
}

interface PlaylistItem {
  id: string;
  unique_id?: string;
  campanha_id?: string;
  widget_nome?: string;
  tempo_exibicao: number;
  ordem: number;
  arquivo_titulo?: string;
  tipo_midia?: string;
  arquivo_url?: string;
}

const SortableItem = ({ id, item, onRemove, onTimeChange }: { id: string, item: PlaylistItem, onRemove: () => void, onTimeChange: (val: number) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  const isVideo = item.tipo_midia === 'video';

  return (
    <div ref={setNodeRef} style={style} className={`mb-3 bg-white border border-zinc-200 rounded-lg shadow-sm ${isDragging ? 'shadow-md ring-1 ring-[#2ecc71]' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <div {...attributes} {...listeners} className="cursor-grab hover:text-[#2ecc71] text-zinc-400 p-1">
            <GripVertical className="w-4 h-4" />
          </div>
          <div className="w-12 h-8 bg-zinc-100 flex items-center justify-center rounded overflow-hidden">
             {item.tipo_midia === 'imagem' ? (
                <img src={item.arquivo_url} alt="" className="w-full h-full object-cover" />
             ) : item.tipo_midia === 'video' ? (
                <div className="w-full h-full bg-[#0066ff] flex items-center justify-center"><Play className="w-4 h-4 text-white" /></div>
             ) : (
                <Settings className="w-4 h-4 text-zinc-400" />
             )}
          </div>
          <span className="text-xs font-bold text-zinc-700 truncate max-w-[200px]">
            {item.arquivo_titulo || item.widget_nome || 'Mídia'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#2ecc71]"></div>
          <div className="w-3 h-3 rounded-full bg-[#3498db]"></div>
          <button onClick={onRemove} className="text-rose-500 hover:text-rose-600 transition-colors ml-2">
            <X className="w-4 h-4 border-2 border-current rounded-full p-0.5" />
          </button>
        </div>
      </div>

      {/* Body / Settings */}
      <div className="p-4 bg-zinc-50/50 space-y-4">
        
        {!isVideo && (
          <div className="flex items-center justify-end gap-4">
            <label className="text-xs font-bold text-zinc-500 w-48 text-right">Tempo (em segundos) por exibição:</label>
            <div className="flex items-center w-40">
              <button 
                onClick={() => onTimeChange(Math.max(1, item.tempo_exibicao - 1))}
                className="w-8 h-8 flex items-center justify-center bg-[#00bcd4] text-white font-bold"
              >
                -
              </button>
              <input 
                type="number" 
                value={item.tempo_exibicao}
                onChange={(e) => onTimeChange(Number(e.target.value))}
                className="flex-1 h-8 text-center text-xs border-y border-zinc-200 focus:outline-none"
              />
              <button 
                onClick={() => onTimeChange(item.tempo_exibicao + 1)}
                className="w-8 h-8 flex items-center justify-center bg-[#00bcd4] text-white font-bold"
              >
                +
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-4">
          <label className="text-xs font-bold text-zinc-500 w-48 text-right">Exibições seguidas:</label>
          <div className="flex items-center w-40">
            <button className="w-8 h-8 flex items-center justify-center bg-[#00bcd4] text-white font-bold">-</button>
            <input type="number" value="1" readOnly className="flex-1 h-8 text-center text-xs border-y border-zinc-200 focus:outline-none bg-white" />
            <button className="w-8 h-8 flex items-center justify-center bg-[#00bcd4] text-white font-bold">+</button>
          </div>
        </div>

        {isVideo ? (
          <div className="flex items-center justify-end gap-4">
            <label className="text-xs font-bold text-zinc-500 w-48 text-right">Áudio do Vídeo:</label>
            <div className="w-40">
              <select className="w-full h-8 border border-zinc-200 rounded px-2 text-xs focus:outline-none bg-white">
                <option>Sim</option>
                <option>Não</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-4">
            <label className="text-xs font-bold text-zinc-500 w-48 text-right">Preenchimento:</label>
            <div className="w-40">
              <select className="w-full h-8 border border-zinc-200 rounded px-2 text-xs focus:outline-none bg-white">
                <option>Mostrar imagem toda</option>
                <option>Preencher tela</option>
              </select>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};


export default function AgencyListaEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [lista, setLista] = useState<{nome: string, id: string}>({ nome: '', id: '' });
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [library, setLibrary] = useState<Media[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [listaData, libraryData] = await Promise.all([
        apiFetch(`/api/listas/${id}`),
        apiFetch('/api/playlists')
      ]);
      
      setLista({ nome: listaData.nome, id: listaData.id });
      
      // Inject unique_id for dnd to work properly with duplicate items
      const formattedItems = (listaData.itens || []).map((it: any) => ({
        ...it,
        unique_id: `item-${it.id || Math.random().toString(36).substr(2, 9)}`
      }));
      setItems(formattedItems);
      
      setLibrary((libraryData || []).filter((m: Media) => m.tipo_midia === 'imagem' || m.tipo_midia === 'video'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch(`/api/listas/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          nome: lista.nome,
          itens: items.map(it => ({
            campanha_id: it.campanha_id,
            widget_nome: it.widget_nome,
            tempo_exibicao: it.tempo_exibicao
          }))
        })
      });
      navigate('/agency/listas');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    setActiveId(null);
    const { active, over } = event;
    
    if (!over) return;

    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex(it => it.unique_id === active.id);
        const newIndex = items.findIndex(it => it.unique_id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAddItem = (media: Media) => {
    const newItem: PlaylistItem = {
      id: '',
      unique_id: `new-${Math.random().toString(36).substr(2, 9)}`,
      campanha_id: media.id,
      arquivo_titulo: media.titulo,
      tipo_midia: media.tipo_midia,
      arquivo_url: media.arquivo_url,
      tempo_exibicao: 15,
      ordem: items.length + 1
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (unique_id: string) => {
    setItems(items.filter(it => it.unique_id !== unique_id));
  };

  const handleChangeTime = (unique_id: string, time: number) => {
    setItems(items.map(it => it.unique_id === unique_id ? { ...it, tempo_exibicao: time } : it));
  };

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">Carregando editor...</div>;
  }

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto text-zinc-600 font-sans min-h-full pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <List className="w-5 h-5 text-[#104a9e]" />
          <h2 className="text-sm font-bold text-[#104a9e] uppercase tracking-wide">
            LISTA DE REPRODUÇÃO <span className="text-zinc-400 font-normal">/ {lista.nome.toUpperCase()}</span>
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/agency/listas')}
            className="bg-zinc-200 hover:bg-zinc-300 text-zinc-700 text-[10px] font-bold px-4 py-2 rounded transition-colors uppercase flex items-center gap-1.5 shadow-sm"
          >
            <X className="w-3.5 h-3.5" />
            CANCELAR EDIÇÃO
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-[#0066ff] hover:bg-[#0052cc] text-white text-[10px] font-bold px-6 py-2 rounded transition-colors uppercase flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'SALVANDO...' : 'SALVAR'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg p-6">
        
        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-zinc-200 mb-8">
          <button className="pb-3 border-b-2 border-[#104a9e] text-[#104a9e] text-sm font-bold">Informações Gerais</button>
          <button className="pb-3 border-b-2 border-transparent text-zinc-400 text-sm font-bold">Avançado</button>
        </div>

        {/* Basic Config */}
        <div className="mb-10">
          <h3 className="flex items-center gap-2 text-[#104a9e] text-sm font-bold mb-4">
            <Settings className="w-4 h-4" /> Configurações básicas
          </h3>
          <div className="flex items-center gap-4 pl-6">
            <label className="text-xs font-bold text-[#e74c3c] w-32 text-right">Nome da Lista: *</label>
            <input 
              type="text" 
              value={lista.nome}
              onChange={e => setLista({...lista, nome: e.target.value})}
              className="flex-1 max-w-lg border border-dashed border-[#0066ff] rounded px-3 py-2 text-sm text-[#0066ff] font-bold focus:outline-none focus:ring-1 focus:ring-[#0066ff]"
            />
          </div>
        </div>

        {/* List Items Editor */}
        <div>
          <div className="flex items-center justify-between mb-4">
             <h3 className="flex items-center gap-2 text-[#e74c3c] text-sm font-bold">
               <List className="w-4 h-4" /> Itens da Lista
             </h3>
             <div className="flex items-center gap-2">
                <button className="text-xs font-bold text-zinc-500 hover:text-zinc-800 transition-colors uppercase">
                   Pré-Visualização
                </button>
                <button className="bg-[#104a9e] text-white text-[10px] font-bold px-3 py-1.5 rounded uppercase flex items-center gap-1">
                   ABRIR EM TELA CHEIA
                </button>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Library Panel (Left) */}
            <div className="border border-zinc-200 rounded flex flex-col h-[500px]">
              <div className="flex items-center border-b border-zinc-200 bg-zinc-50">
                <button className="flex-1 py-3 text-xs font-bold text-zinc-700 bg-white border-r border-zinc-200 border-t-2 border-t-[#2ecc71]">Arquivos</button>
                <button className="flex-1 py-3 text-xs font-bold text-zinc-400 border-r border-zinc-200">Entretenimentos</button>
                <button className="flex-1 py-3 text-xs font-bold text-zinc-400">Ferramentas</button>
              </div>
              <div className="p-3 border-b border-zinc-200 bg-zinc-50">
                 <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input type="text" placeholder="Procurar arquivo" className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded text-xs focus:outline-none focus:border-[#0066ff]" />
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                 {library.map(media => (
                    <div key={media.id} className="flex items-center justify-between p-2 hover:bg-zinc-50 border-b border-zinc-100 last:border-0 transition-colors group">
                       <div className="flex items-center gap-3">
                          <div className="w-12 h-10 bg-zinc-100 flex items-center justify-center rounded overflow-hidden shadow-sm">
                             {media.tipo_midia === 'imagem' ? (
                                <img src={media.arquivo_url} alt="" className="w-full h-full object-cover" />
                             ) : (
                                <div className="w-full h-full bg-[#0066ff] flex items-center justify-center"><Play className="w-5 h-5 text-white" /></div>
                             )}
                          </div>
                          <span className="text-xs font-medium text-zinc-700">{media.titulo || 'Mídia'}</span>
                       </div>
                       <button onClick={() => handleAddItem(media)} className="opacity-0 group-hover:opacity-100 p-1.5 bg-[#2ecc71] hover:bg-[#27ae60] text-white rounded transition-all">
                          <Plus className="w-4 h-4" />
                       </button>
                    </div>
                 ))}
              </div>
            </div>

            {/* Playlist Panel (Right) */}
            <div className="border-2 border-dashed border-[#2ecc71] bg-emerald-50/10 rounded flex flex-col h-[500px]">
              <div className="py-2 text-center text-xs font-bold text-[#2ecc71] border-b-2 border-dashed border-[#2ecc71]">
                Lista Final que será exibida na TVs
              </div>
              <div className="p-3 border-b border-dashed border-[#2ecc71] bg-emerald-50/20">
                 <div className="relative flex items-center gap-2">
                    <input type="text" placeholder="Procurar item" className="w-full pl-3 pr-3 py-2 bg-white border border-dashed border-[#2ecc71] rounded text-xs text-[#2ecc71] placeholder-[#2ecc71]/50 focus:outline-none" />
                    <Settings className="w-5 h-5 text-[#2ecc71]" />
                 </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 relative">
                 {items.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-[#2ecc71]">
                       <DownloadCloud className="w-8 h-8 mb-2" />
                       <span className="text-xs font-bold tracking-widest uppercase">ARRASTE ITEMS PARA CÁ</span>
                    </div>
                 ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                      <SortableContext items={items.map(i => i.unique_id!)} strategy={verticalListSortingStrategy}>
                        {items.map(item => (
                          <SortableItem 
                            key={item.unique_id} 
                            id={item.unique_id!} 
                            item={item} 
                            onRemove={() => handleRemoveItem(item.unique_id!)}
                            onTimeChange={(val) => handleChangeTime(item.unique_id!, val)}
                          />
                        ))}
                      </SortableContext>
                      <DragOverlay>
                        {activeId ? (
                           <div className="opacity-80 bg-white p-2 border border-[#0066ff] shadow-xl rounded">
                              <span className="text-xs font-bold text-[#0066ff]">Movendo item...</span>
                           </div>
                        ) : null}
                      </DragOverlay>
                    </DndContext>
                 )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
