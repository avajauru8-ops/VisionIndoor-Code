import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, Plus, Search, Tag, Play, X, Trash2, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';

interface Media {
  id: string;
  titulo: string;
  tipo_midia: string;
  arquivo_url: string;
}

interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  previewUrl: string;
}

export default function AgencyMedia() {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);

  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [showUploader, setShowUploader] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selection State
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    try {
      const data = await apiFetch('/api/playlists');
      const filtered = (data || []).filter((item: Media) => 
        item.tipo_midia === 'imagem' || item.tipo_midia === 'video'
      );
      setMedia(filtered);
      setSelectedMedia([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteSelected = async () => {
    if (!confirm(`Deseja apagar os ${selectedMedia.length} arquivos selecionados?`)) return;
    
    setLoading(true);
    try {
      await Promise.all(selectedMedia.map(id => apiFetch(`/api/playlists/${id}`, { method: 'DELETE' })));
      setSelectedMedia([]);
      loadMedia();
    } catch (err: any) {
      alert(err.message);
      setLoading(false);
    }
  };



  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newItems: UploadItem[] = Array.from(e.target.files).map(file => ({
        id: Math.random().toString(36).substring(7),
        file,
        progress: 0,
        status: 'pending',
        previewUrl: URL.createObjectURL(file)
      }));
      setUploadQueue(prev => [...prev, ...newItems]);
      setShowUploader(true);
      
      // Limpa o input para poder selecionar os mesmos arquivos novamente
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeUploadItem = (id: string) => {
    setUploadQueue(prev => prev.filter(item => item.id !== id));
  };

  const clearUploader = () => {
    setUploadQueue([]);
    setShowUploader(false);
  };

  const finishUploader = () => {
    // Recarrega a tabela e fecha o modal
    setLoading(true);
    loadMedia();
    clearUploader();
  };

  // Efeito para processar a fila de upload
  useEffect(() => {
    const pendingItem = uploadQueue.find(item => item.status === 'pending');
    
    if (pendingItem) {
      // Iniciar o upload deste item
      setUploadQueue(prev => prev.map(item => 
        item.id === pendingItem.id ? { ...item, status: 'uploading' } : item
      ));

      uploadFile(pendingItem);
    }
  }, [uploadQueue]);

  const uploadFile = (item: UploadItem) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Token não encontrado!');
      setUploadQueue(prev => prev.map(q => 
        q.id === item.id ? { ...q, status: 'error' } : q
      ));
      return;
    }

    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    
    formData.append('arquivo', item.file);
    formData.append('titulo', item.file.name);
    // Identificar tipo de midia baseado no mime type
    const tipo = item.file.type.startsWith('video/') ? 'video' : 'imagem';
    formData.append('tipo_midia', tipo);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setUploadQueue(prev => prev.map(q => 
          q.id === item.id ? { ...q, progress: percent } : q
        ));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setUploadQueue(prev => prev.map(q => 
          q.id === item.id ? { ...q, status: 'done', progress: 100 } : q
        ));
      } else {
        setUploadQueue(prev => prev.map(q => 
          q.id === item.id ? { ...q, status: 'error' } : q
        ));
      }
    });

    xhr.addEventListener('error', () => {
      setUploadQueue(prev => prev.map(q => 
        q.id === item.id ? { ...q, status: 'error' } : q
      ));
    });

    xhr.open('POST', 'http://localhost:8080/api/playlists'); // Em dev. Em prod ele ajusta pelo baseURL configurado no axios, mas para xhr:
    // Melhor usar a URL correta baseada no ambiente:
    const baseUrl = import.meta.env.VITE_API_URL || '';
    xhr.open('POST', `${baseUrl}/api/playlists`);
    
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  };


  return (
    <div className="space-y-6 max-w-[1200px] mx-auto text-zinc-600 font-sans min-h-full pb-20 relative">
      {/* Header and Add Button */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-[#104a9e]" />
          <h2 className="text-sm font-bold text-[#104a9e] uppercase tracking-wide">
            ARQUIVOS
          </h2>
        </div>
        
        <div>
          <input 
            type="file" 
            multiple 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".jpg,.jpeg,.gif,.png,.mp4,.flv,.3gp,.avi,.m4v,.mkv,.mov,.mpg,.rm,.rmvb,.vob,.webm,.wmv"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-[#0066ff] hover:bg-[#0052cc] text-white text-[10px] font-bold px-4 py-2 rounded transition-colors uppercase flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            ADICIONAR ARQUIVOS
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-white border border-zinc-200 rounded-lg p-6">
        <ul className="list-disc pl-4 text-xs space-y-1.5 text-zinc-600">
          <li><strong>O tamanho máximo do arquivo é de 105.7 MB.</strong></li>
          <li>Tipos de arquivos aceitos: JPG, JPEG, GIF, PNG, MP4, FLV, 3GP, AVI, M4V, MKV, MOV, MPG, RM, RMVB, VOB, WEBM, WMV.</li>
        </ul>

        {/* Filters */}
        <div className="mt-8 flex flex-col items-center gap-4">
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
              <option>Data de Envio</option>
              <option>Nome</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span>ARQUIVOS POR PÁGINA</span>
            <select className="border border-zinc-200 rounded p-1 text-zinc-600 focus:outline-none">
              <option>15</option>
              <option>30</option>
              <option>50</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions Dropdown */}
        {selectedMedia.length > 0 && (
          <div className="mt-4 flex items-center">
            <select 
              value=""
              onChange={(e) => {
                if (e.target.value === 'delete') deleteSelected();
              }}
              className="border border-zinc-300 rounded px-3 py-1.5 text-sm font-medium text-zinc-700 bg-white focus:outline-none focus:border-[#104a9e] shadow-sm cursor-pointer"
            >
              <option value="" disabled hidden>{selectedMedia.length} selecionado...</option>
              <option value="delete">Apagar</option>
            </select>
          </div>
        )}

        {/* Table */}
        <div className="mt-4 border border-zinc-200 rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-xs text-zinc-500">
                  <th className="px-4 py-3 w-12 text-center">
                    <input 
                      type="checkbox" 
                      checked={media.length > 0 && selectedMedia.length === media.length}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedMedia(media.map(m => m.id));
                        else setSelectedMedia([]);
                      }}
                      className="rounded border-zinc-300 text-[#104a9e] focus:ring-[#104a9e]" 
                    />
                  </th>
                  <th className="px-4 py-3 font-semibold">Nome</th>
                  <th className="px-4 py-3 font-semibold w-48 text-center border-l border-zinc-200">
                    <div className="flex items-center justify-center gap-2">
                      <input type="checkbox" checked readOnly className="rounded border-zinc-300 text-[#104a9e] focus:ring-[#104a9e]" />
                      Preview
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-sm bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-zinc-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#104a9e] mx-auto"></div>
                    </td>
                  </tr>
                ) : media.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-zinc-500">
                      Nenhum arquivo encontrado.
                    </td>
                  </tr>
                ) : (
                  media.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedMedia.includes(item.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedMedia([...selectedMedia, item.id]);
                            else setSelectedMedia(selectedMedia.filter(id => id !== item.id));
                          }}
                          className="rounded border-zinc-300 text-[#104a9e] focus:ring-[#104a9e]" 
                        />
                      </td>
                      <td className="px-4 py-4">
                        <span className="bg-zinc-100 text-zinc-600 text-[11px] px-2 py-1 rounded border border-zinc-200">
                          {item.titulo || `Arquivo ${idx + 1}`}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center border-l border-zinc-200">
                        <div className="flex justify-center items-center h-16 w-full">
                          {item.tipo_midia === 'imagem' ? (
                            <img 
                              src={item.arquivo_url} 
                              alt={item.titulo} 
                              className="h-full object-contain max-w-[120px] rounded shadow-sm border border-zinc-200"
                            />
                          ) : (
                            <div className="w-12 h-10 rounded bg-[#0066ff] flex items-center justify-center shadow-sm cursor-pointer hover:bg-[#0052cc] transition-colors">
                              <Play className="w-5 h-5 text-white ml-1" />
                            </div>
                          )}
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
          Mostrando de 1 a {media.length} de {media.length} arquivos
        </div>

        {/* Storage Bar */}
        <div className="mt-6 flex flex-wrap items-center gap-6 text-[10px] font-bold">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-sm bg-[#27ae60]"></span>
            <span className="text-zinc-800">105.7 MB | <span className="text-zinc-400 font-normal">Disponível</span></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-sm bg-[#f39c12]"></span>
            <span className="text-zinc-800">19.3 MB | <span className="text-zinc-400 font-normal">Utilizado</span></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-sm bg-[#7f8c8d]"></span>
            <span className="text-zinc-800">125.0 MB | <span className="text-zinc-400 font-normal">Limite</span></span>
          </div>
        </div>
      </div>

      {/* Upload Popup (Flutuante no centro) */}
      {showUploader && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 bg-[#1f1f1f] text-zinc-200 rounded-xl shadow-2xl border border-zinc-800 z-50 overflow-hidden flex flex-col">
          {/* Header Popup */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-[#141414]">
            <h3 className="font-bold text-sm text-white">{uploadQueue.length} arquivo(s) carregado(s)</h3>
            <button onClick={finishUploader} className="text-zinc-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Lista de Arquivos */}
          <div className="flex-1 overflow-y-auto max-h-60 p-2 space-y-1 custom-scrollbar">
            {uploadQueue.map((item) => {
              const radius = 14;
              const circumference = radius * 2 * Math.PI;
              const offset = circumference - (item.progress / 100) * circumference;

              return (
                <div key={item.id} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded overflow-hidden bg-zinc-800 border border-zinc-700 shrink-0 flex items-center justify-center">
                      {item.file.type.startsWith('video/') ? (
                         <div className="w-full h-full bg-black flex items-center justify-center"><Play className="w-4 h-4 text-white"/></div>
                      ) : (
                         <img src={item.previewUrl} alt={item.file.name} className="w-full h-full object-cover" />
                      )}
                      
                      {/* Overlay para progresso e concluído */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        {item.status === 'done' ? (
                          <CheckCircle2 className="w-5 h-5 text-[#0066ff] bg-white rounded-full" />
                        ) : item.status === 'error' ? (
                          <X className="w-5 h-5 text-rose-500" />
                        ) : (
                          // Progress Bar Redonda (SVG)
                          <svg className="w-8 h-8 transform -rotate-90">
                            <circle 
                              cx="16" cy="16" r="14" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              fill="transparent"
                              className="text-white/20"
                            />
                            <circle 
                              cx="16" cy="16" r="14" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              fill="transparent"
                              strokeDasharray={circumference}
                              strokeDashoffset={offset}
                              className="text-[#0066ff] transition-all duration-300 ease-out"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-xs truncate max-w-[180px] font-medium text-zinc-300">
                      {item.file.name}
                    </span>
                  </div>
                  <button 
                    onClick={() => removeUploadItem(item.id)}
                    className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-400/10 rounded opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Footer Botoes Popup */}
          <div className="p-4 border-t border-zinc-800 bg-[#141414] flex items-center justify-between">
            <button 
              onClick={clearUploader}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Limpar
            </button>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Adicionar mais
              </button>
              <button 
                onClick={finishUploader}
                className="px-5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#0066ff] hover:bg-[#0052cc] transition-colors"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Style para Scrollbar do Popup */}
      <style dangerouslySetInnerHTML={{__html:`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3f3f46;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #52525b;
        }
      `}} />
    </div>
  );
}
