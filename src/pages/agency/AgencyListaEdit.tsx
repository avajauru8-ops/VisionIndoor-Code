import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { List, Settings, Save, X, Search, FileText, Play, DownloadCloud, GripVertical, Plus, Copy, MinusCircle } from 'lucide-react';

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

const WIDGETS_BASE: Media[] = [
  { id: 'w-clima', titulo: 'Widget de Clima', tipo_midia: 'widget', arquivo_url: 'clima?cidade=São Paulo&estado=SP' },
  { id: 'w-loteria', titulo: 'Widget de Loteria', tipo_midia: 'widget', arquivo_url: 'loteria?tipo=megasena' },
  { id: 'w-noticias', titulo: 'Widget de Notícias (RSS)', tipo_midia: 'widget', arquivo_url: 'noticias?feed=noticias' },
  { id: 'w-youtube', titulo: 'Widget do YouTube', tipo_midia: 'widget', arquivo_url: 'youtube?url=&loop=1&mute=1' },
];

const WidgetSettings = ({ item, onUpdate }: { item: PlaylistItem, onUpdate: (key: string, value: string) => void }) => {
  const parsedUrl = new URL(item.widget_nome || '', 'http://localhost');
  const params = parsedUrl.searchParams;
  const widgetType = parsedUrl.pathname.replace('/', '');

  const handleParamChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(parsedUrl.search);
    newParams.set(key, value);
    const newWidgetNome = `${widgetType}?${newParams.toString()}`;
    onUpdate('widget_nome', newWidgetNome);
  };

  if (widgetType === 'clima') {
    return (
      <>
        <div className="flex items-center justify-end gap-4">
          <label className="text-xs font-bold text-zinc-500 w-48 text-right">Cidade:</label>
          <div className="w-40">
            <input type="text" value={params.get('cidade') || ''} onChange={e => handleParamChange('cidade', e.target.value)} className="w-full h-8 border border-zinc-200 rounded px-2 text-xs focus:outline-none bg-white" placeholder="Ex: São Paulo" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-4">
          <label className="text-xs font-bold text-zinc-500 w-48 text-right">Estado (Sigla):</label>
          <div className="w-40">
            <input type="text" value={params.get('estado') || ''} onChange={e => handleParamChange('estado', e.target.value)} className="w-full h-8 border border-zinc-200 rounded px-2 text-xs focus:outline-none bg-white" placeholder="Ex: SP" maxLength={2} />
          </div>
        </div>
      </>
    );
  }

  if (widgetType === 'loteria') {
    return (
      <div className="flex items-center justify-end gap-4">
        <label className="text-xs font-bold text-zinc-500 w-48 text-right">Tipo de Sorteio:</label>
        <div className="w-40">
          <select value={params.get('tipo') || 'megasena'} onChange={e => handleParamChange('tipo', e.target.value)} className="w-full h-8 border border-zinc-200 rounded px-2 text-xs focus:outline-none bg-white">
            <option value="megasena">Mega-Sena</option>
            <option value="virada">Mega da Virada</option>
          </select>
        </div>
      </div>
    );
  }

  if (widgetType === 'youtube') {
    return (
      <>
        <div className="flex items-center justify-end gap-4">
          <label className="text-xs font-bold text-zinc-500 w-48 text-right">URL do Vídeo:</label>
          <div className="w-40">
            <input type="text" value={params.get('url') || ''} onChange={e => handleParamChange('url', e.target.value)} className="w-full h-8 border border-zinc-200 rounded px-2 text-xs focus:outline-none bg-white" placeholder="https://youtube.com/..." />
          </div>
        </div>
        <div className="flex items-center justify-end gap-4">
          <label className="text-xs font-bold text-zinc-500 w-48 text-right">Repetir em Loop:</label>
          <div className="w-40">
            <select value={params.get('loop') || '1'} onChange={e => handleParamChange('loop', e.target.value)} className="w-full h-8 border border-zinc-200 rounded px-2 text-xs focus:outline-none bg-white">
              <option value="1">Sim</option>
              <option value="0">Não</option>
            </select>
          </div>
        </div>
      </>
    );
  }

  if (widgetType === 'noticias' || widgetType === 'rss') {
    return (
      <div className="flex items-center justify-end gap-4">
        <label className="text-xs font-bold text-zinc-500 w-48 text-right">Fonte de Notícias:</label>
        <div className="w-40">
          <select value={params.get('feed') || 'noticias'} onChange={e => handleParamChange('feed', e.target.value)} className="w-full h-8 border border-zinc-200 rounded px-2 text-xs focus:outline-none bg-white">
            <option value="noticias">UOL Notícias</option>
            <option value="esporte">UOL Esporte</option>
            <option value="economia">UOL Economia</option>
            <option value="fofocas">UOL Splash (Fofocas)</option>
            <option value="tecnologia">UOL Tilt (Tecnologia)</option>
          </select>
        </div>
      </div>
    );
  }

  return null;
}

const SortableItem = ({ id, item, onRemove, onDuplicate, onTimeChange, onUpdateField }: { id: string, item: PlaylistItem, onRemove: () => void, onDuplicate: () => void, onTimeChange: (val: number) => void, onUpdateField: (key: string, value: string) => void }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, data: { type: 'playlist_item', item } });
  
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
        
        <div className="flex items-center gap-3">
          <button onClick={onDuplicate} className="text-[#2ecc71] hover:text-[#27ae60] transition-colors">
            <Copy className="w-5 h-5" />
          </button>
          <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="text-black hover:text-zinc-700 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          <button onClick={onRemove} className="text-[#e74c3c] hover:text-[#c0392b] transition-colors ml-1">
            <MinusCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Body / Settings */}
      {isSettingsOpen && (
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
        ) : item.tipo_midia === 'widget' ? (
          <WidgetSettings item={item} onUpdate={onUpdateField} />
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
      )}
    </div>
  );
};

const DraggableLibraryItem = ({ media, onAdd }: { media: Media, onAdd: () => void }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `lib-${media.id}`,
    data: { type: 'library_item', media }
  });

  return (
    <div 
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`flex items-center justify-between p-2 border-b border-zinc-100 bg-white transition-colors cursor-grab ${isDragging ? 'opacity-50' : 'hover:bg-zinc-50 group'}`}
    >
      <div className="flex items-center gap-3 pointer-events-none">
        <div className="w-12 h-10 bg-zinc-100 flex items-center justify-center rounded overflow-hidden shadow-sm">
          {media.tipo_midia === 'imagem' ? (
             <img src={media.arquivo_url} alt="" className="w-full h-full object-cover" />
          ) : media.tipo_midia === 'video' ? (
             <div className="w-full h-full bg-[#0066ff] flex items-center justify-center"><Play className="w-5 h-5 text-white" /></div>
          ) : (
             <div className="w-full h-full bg-amber-500 flex items-center justify-center"><FileText className="w-5 h-5 text-white" /></div>
          )}
        </div>
        <span className="text-xs font-medium text-zinc-700">{media.titulo || 'Mídia'}</span>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onAdd(); }} className="opacity-0 group-hover:opacity-100 p-1.5 bg-[#2ecc71] hover:bg-[#27ae60] text-white rounded transition-all z-10 relative">
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};

const DroppablePlaylistContainer = ({ items, children }: { items: PlaylistItem[], children: React.ReactNode }) => {
  const { setNodeRef } = useDroppable({ id: 'playlist-droppable', data: { type: 'playlist_container' } });
  
  return (
    <div ref={setNodeRef} className="flex-1 overflow-y-auto p-3 relative">
      {children}
    </div>
  );
};


export default function AgencyListaEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [lista, setLista] = useState<{nome: string, id: string}>({ nome: '', id: '' });
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [library, setLibrary] = useState<Media[]>([]);
  const [libraryTab, setLibraryTab] = useState<'arquivos' | 'entretenimentos' | 'ferramentas'>('arquivos');
  
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
      
      setLibrary(libraryData || []);
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

    if (active.data.current?.type === 'library_item') {
      const media = active.data.current.media;
      const newItem: PlaylistItem = {
        id: '',
        unique_id: `new-${Math.random().toString(36).substr(2, 9)}`,
        campanha_id: media.tipo_midia === 'widget' ? undefined : media.id,
        widget_nome: media.tipo_midia === 'widget' ? media.arquivo_url : undefined,
        arquivo_titulo: media.titulo,
        tipo_midia: media.tipo_midia,
        arquivo_url: media.arquivo_url,
        tempo_exibicao: 15,
        ordem: items.length + 1
      };
      
      if (over.data.current?.type === 'playlist_item') {
        const overIndex = items.findIndex(it => it.unique_id === over.id);
        const newItems = [...items];
        newItems.splice(overIndex, 0, newItem);
        setItems(newItems);
      } else {
        setItems([...items, newItem]);
      }
      return;
    }

    if (active.data.current?.type === 'playlist_item' && over.data.current?.type === 'playlist_item' && active.id !== over.id) {
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
      campanha_id: media.tipo_midia === 'widget' ? undefined : media.id,
      widget_nome: media.tipo_midia === 'widget' ? media.arquivo_url : undefined,
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

  const handleDuplicateItem = (item: PlaylistItem) => {
    const newItem = { ...item, unique_id: `dup-${Math.random().toString(36).substr(2, 9)}`, id: '' };
    const index = items.findIndex(it => it.unique_id === item.unique_id);
    const newItems = [...items];
    newItems.splice(index + 1, 0, newItem);
    setItems(newItems);
  };

  const handleChangeTime = (unique_id: string, time: number) => {
    setItems(items.map(it => it.unique_id === unique_id ? { ...it, tempo_exibicao: time } : it));
  };

  const handleUpdateField = (unique_id: string, key: string, value: string) => {
    setItems(items.map(it => it.unique_id === unique_id ? { ...it, [key]: value } : it));
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

          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Library Panel (Left) */}
              <div className="border border-zinc-200 rounded flex flex-col h-[500px]">
                <div className="flex items-center border-b border-zinc-200 bg-zinc-50">
                  <button 
                    onClick={() => setLibraryTab('arquivos')}
                    className={`flex-1 py-3 text-xs font-bold ${libraryTab === 'arquivos' ? 'text-zinc-700 bg-white border-t-2 border-t-[#2ecc71]' : 'text-zinc-400'} border-r border-zinc-200 transition-colors`}
                  >Arquivos</button>
                  <button 
                    onClick={() => setLibraryTab('entretenimentos')}
                    className={`flex-1 py-3 text-xs font-bold ${libraryTab === 'entretenimentos' ? 'text-zinc-700 bg-white border-t-2 border-t-[#2ecc71]' : 'text-zinc-400'} border-r border-zinc-200 transition-colors`}
                  >Entretenimentos</button>
                  <button 
                    onClick={() => setLibraryTab('ferramentas')}
                    className={`flex-1 py-3 text-xs font-bold ${libraryTab === 'ferramentas' ? 'text-zinc-700 bg-white border-t-2 border-t-[#2ecc71]' : 'text-zinc-400'} transition-colors`}
                  >Ferramentas</button>
                </div>
                <div className="p-3 border-b border-zinc-200 bg-zinc-50">
                   <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input type="text" placeholder="Procurar item" className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded text-xs focus:outline-none focus:border-[#0066ff]" />
                   </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                   {libraryTab === 'entretenimentos' ? (
                      WIDGETS_BASE.map(media => (
                        <DraggableLibraryItem key={media.id} media={media} onAdd={() => handleAddItem(media)} />
                      ))
                   ) : libraryTab === 'arquivos' ? (
                     library
                       .filter(media => media.tipo_midia === 'imagem' || media.tipo_midia === 'video')
                       .map(media => (
                        <DraggableLibraryItem key={media.id} media={media} onAdd={() => handleAddItem(media)} />
                     ))
                   ) : (
                     <div className="text-center text-xs text-zinc-400 mt-4">Nenhuma ferramenta disponível.</div>
                   )}
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
                
                <DroppablePlaylistContainer items={items}>
                   {items.length === 0 ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-[#2ecc71] pointer-events-none">
                         <DownloadCloud className="w-8 h-8 mb-2" />
                         <span className="text-xs font-bold tracking-widest uppercase">ARRASTE ITEMS PARA CÁ</span>
                      </div>
                   ) : (
                        <SortableContext items={items.map(i => i.unique_id!)} strategy={verticalListSortingStrategy}>
                          {items.map(item => (
                            <SortableItem 
                              key={item.unique_id} 
                              id={item.unique_id!} 
                              item={item} 
                              onRemove={() => handleRemoveItem(item.unique_id!)}
                              onDuplicate={() => handleDuplicateItem(item)}
                              onTimeChange={(val) => handleChangeTime(item.unique_id!, val)}
                              onUpdateField={(key, val) => handleUpdateField(item.unique_id!, key, val)}
                            />
                          ))}
                        </SortableContext>
                   )}
                </DroppablePlaylistContainer>
              </div>
              
              <DragOverlay>
                {activeId ? (
                   <div className="opacity-90 bg-white p-3 border border-[#0066ff] shadow-xl rounded flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#0066ff] animate-pulse"></div>
                      <span className="text-xs font-bold text-[#0066ff]">Movendo item...</span>
                   </div>
                ) : null}
              </DragOverlay>
            </div>
          </DndContext>
        </div>

      </div>
    </div>
  );
}
