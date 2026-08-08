import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Image as ImageIcon, Plus, Search, Tag, Play } from 'lucide-react';
import { apiFetch } from '../../lib/api';

interface Media {
  id: string;
  titulo: string;
  tipo_midia: string;
  arquivo_url: string;
}

export default function AgencyMedia() {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    try {
      const data = await apiFetch('/api/playlists');
      // For this page, we only care about unique media files (or all campaigns acting as media)
      setMedia(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto text-zinc-600 font-sans min-h-full pb-20">
      {/* Header and Add Button */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-[#104a9e]" />
          <h2 className="text-sm font-bold text-[#104a9e] uppercase tracking-wide">
            ARQUIVOS
          </h2>
        </div>
        <Link 
          to="/agency/playlists/cadastrar"
          className="bg-[#0066ff] hover:bg-[#0052cc] text-white text-[10px] font-bold px-4 py-2 rounded transition-colors uppercase flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          ADICIONAR ARQUIVOS
        </Link>
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
                        <input type="checkbox" className="rounded border-zinc-300 text-[#104a9e] focus:ring-[#104a9e]" />
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

        {/* Storage Bar (Mocked as per reference) */}
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
    </div>
  );
}
