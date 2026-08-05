import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { CloudRain, Hash, Plus, Trash2, LayoutGrid, Youtube, Newspaper } from 'lucide-react';
import { format } from 'date-fns';

interface Totem {
  id: number;
  nome: string;
  device_id: string;
}

interface Playlist {
  id: number;
  totem_id: number | null;
  titulo: string;
  tipo_midia: 'video' | 'imagem' | 'noticia';
  tempo_exibicao: number;
  data_inicio: string;
  data_fim: string;
  arquivo_url: string;
  ativo: number;
}

export default function AgencyNews() {
  const [totems, setTotems] = useState<Totem[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Clima
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [estados, setEstados] = useState<any[]>([]);
  const [cidades, setCidades] = useState<any[]>([]);
  const [selectedTotemClima, setSelectedTotemClima] = useState('');

  const [tempoExibicaoClima, setTempoExibicaoClima] = useState(15);
  const [loadingClima, setLoadingClima] = useState(false);

  // Loteria
  const [tipoLoteria, setTipoLoteria] = useState('megasena');
  const [selectedTotemLoteria, setSelectedTotemLoteria] = useState('');
  const [tempoExibicaoLoteria, setTempoExibicaoLoteria] = useState(15);
  const [loadingLoteria, setLoadingLoteria] = useState(false);

  // YouTube
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedTotemYoutube, setSelectedTotemYoutube] = useState('');
  const [tempoExibicaoYoutube, setTempoExibicaoYoutube] = useState(60);
  const [youtubeLoop, setYoutubeLoop] = useState(true);
  const [youtubeMute, setYoutubeMute] = useState(true);
  const [loadingYoutube, setLoadingYoutube] = useState(false);

  // Noticias RSS
  const [rssFeed, setRssFeed] = useState('noticias');
  const [rssMode, setRssMode] = useState('random');
  const [selectedTotemNoticias, setSelectedTotemNoticias] = useState('');
  const [tempoExibicaoNoticias, setTempoExibicaoNoticias] = useState(15);
  const [loadingNoticias, setLoadingNoticias] = useState(false);

  const loadData = async () => {
    try {
      const [tData, pData] = await Promise.all([
        apiFetch('/api/totems'),
        apiFetch('/api/playlists')
      ]);
      setTotems(tData);
      setPlaylists(pData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(res => res.json())
      .then(data => setEstados(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (estado) {
      setCidade(''); // reset city when state changes
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado}/municipios?orderBy=nome`)
        .then(res => res.json())
        .then(data => setCidades(data))
        .catch(console.error);
    }
  }, [estado]);

  const handleAddClima = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingClima(true);
    try {
      const dataInicio = new Date().toISOString();
      const dataFim = new Date();
      dataFim.setFullYear(dataFim.getFullYear() + 1);

      const url = `/widget/clima?cidade=${encodeURIComponent(cidade)}&estado=${encodeURIComponent(estado)}`;
      
      const payload = {
        totem_id: selectedTotemClima || null,
        titulo: `Clima: ${cidade}-${estado}`,
        tipo_midia: 'noticia',
        tempo_exibicao: tempoExibicaoClima,
        data_inicio: dataInicio,
        data_fim: dataFim.toISOString(),
        url
      };

      await apiFetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      loadData();
      alert('Widget de Clima adicionado à playlist!');
    } catch (e) {
      console.error(e);
      alert('Erro ao adicionar clima');
    } finally {
      setLoadingClima(false);
    }
  };

  const handleAddLoteria = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingLoteria(true);
    try {
      const dataInicio = new Date().toISOString();
      const dataFim = new Date();
      dataFim.setFullYear(dataFim.getFullYear() + 1);

      const url = `/widget/loteria?tipo=${encodeURIComponent(tipoLoteria)}`;
      const nomeLoteria = tipoLoteria === 'megasena' ? 'Mega-Sena' : 'Mega da Virada';
      
      const payload = {
        totem_id: selectedTotemLoteria || null,
        titulo: `Loteria: ${nomeLoteria}`,
        tipo_midia: 'noticia',
        tempo_exibicao: tempoExibicaoLoteria,
        data_inicio: dataInicio,
        data_fim: dataFim.toISOString(),
        url
      };

      await apiFetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      loadData();
      alert('Widget de Loteria adicionado à playlist!');
    } catch (e) {
      console.error(e);
      alert('Erro ao adicionar loteria');
    } finally {
      setLoadingLoteria(false);
    }
  };

  const handleDelete = async (id: number) => {
     if (confirm('Excluir widget da playlist?')) {
       await apiFetch(`/api/playlists/${id}`, { method: 'DELETE' });
       loadData();
     }
  };

  const handleAddYoutube = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) return alert('Informe a URL do vídeo do YouTube.');
    setLoadingYoutube(true);
    try {
      const dataInicio = new Date().toISOString();
      const dataFim = new Date();
      dataFim.setFullYear(dataFim.getFullYear() + 1);

      const params = new URLSearchParams({
        url: youtubeUrl.trim(),
        loop: youtubeLoop ? '1' : '0',
        mute: youtubeMute ? '1' : '0',
        autoplay: '1',
        controls: '0',
      });
      const url = `/widget/youtube?${params.toString()}`;

      const payload = {
        totem_id: selectedTotemYoutube || null,
        titulo: `YouTube: ${youtubeUrl.trim().slice(0, 40)}`,
        tipo_midia: 'noticia',
        tempo_exibicao: tempoExibicaoYoutube,
        data_inicio: dataInicio,
        data_fim: dataFim.toISOString(),
        url,
      };

      await apiFetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      setYoutubeUrl('');
      loadData();
      alert('Widget YouTube adicionado à playlist!');
    } catch (err) {
      console.error(err);
      alert('Erro ao adicionar YouTube');
    } finally {
      setLoadingYoutube(false);
    }
  };

  const handleAddNoticias = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingNoticias(true);
    try {
      const dataInicio = new Date().toISOString();
      const dataFim = new Date();
      dataFim.setFullYear(dataFim.getFullYear() + 1);

      const url = `/widget/noticias?feed=${encodeURIComponent(rssFeed)}&mode=${encodeURIComponent(rssMode)}`;
      
      const payload = {
        totem_id: selectedTotemNoticias || null,
        titulo: `Notícias UOL: ${rssFeed}`,
        tipo_midia: 'noticia',
        tempo_exibicao: tempoExibicaoNoticias,
        data_inicio: dataInicio,
        data_fim: dataFim.toISOString(),
        url
      };

      await apiFetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      loadData();
      alert('Widget de Notícias adicionado à playlist!');
    } catch (e) {
      console.error(e);
      alert('Erro ao adicionar notícias');
    } finally {
      setLoadingNoticias(false);
    }
  };

  const newsPlaylists = playlists.filter(p => p.tipo_midia === 'noticia');

  return (
    <div className="space-y-6 flex flex-col lg:h-[calc(100vh-8rem)] h-auto">
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
         <div>
           <h2 className="text-2xl font-extrabold text-[#0b462c] tracking-tight">Utilizar Notícias & Widgets</h2>
           <p className="text-xs text-[#8b9aa5] font-medium mt-1">Configure o widget e selecione a tela de destino para adicioná-lo.</p>
         </div>
       </div>

       <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
             {/* Clima Widget Form */}
             <div className="bg-white border border-[#e8edf2] rounded-[28px] p-7 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col group">
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <CloudRain className="w-6 h-6 text-blue-500" />
                   </div>
                   <div>
                     <h3 className="text-base font-bold text-zinc-800">Clima Tempo</h3>
                     <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Previsão local</p>
                   </div>
                </div>
                
                <form onSubmit={handleAddClima} className="space-y-4 flex flex-col flex-1">
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Estado</label>
                         <select required value={estado} onChange={e=>setEstado(e.target.value)} className="w-full bg-[#f4f6f8] border border-zinc-200 rounded-xl px-3 py-2.5 text-zinc-800 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all uppercase">
                            <option value="">UF...</option>
                            {estados.map(uf => <option key={uf.sigla} value={uf.sigla}>{uf.nome}</option>)}
                         </select>
                      </div>
                      <div>
                         <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Cidade</label>
                         <select required disabled={!estado} value={cidade} onChange={e=>setCidade(e.target.value)} className="w-full bg-[#f4f6f8] border border-zinc-200 rounded-xl px-3 py-2.5 text-zinc-800 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all">
                            <option value="">Selecione...</option>
                            {cidades.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                         </select>
                      </div>
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Duração (s)</label>
                     <input type="number" min="1" required value={tempoExibicaoClima} onChange={e=>setTempoExibicaoClima(Number(e.target.value))} className="w-full bg-[#f4f6f8] border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                   </div>
                   
                   <div className="mt-auto pt-5 border-t border-zinc-100 flex flex-col gap-3">
                       <div>
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 group-hover:text-blue-500 transition-colors">TELA DE DESTINO</label>
                          <select 
                            value={selectedTotemClima} 
                            onChange={e => setSelectedTotemClima(e.target.value)} 
                            className="w-full bg-blue-50/50 border border-blue-100 rounded-xl px-3 py-2 text-blue-800 text-xs font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                          >
                             <option value="">Todas as Telas (Geral)</option>
                             {totems.map(t => <option key={t.id} value={t.id}>{t.nome} ({t.device_id})</option>)}
                          </select>
                       </div>
                       <button type="submit" disabled={loadingClima} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-[11px] font-extrabold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
                         <Plus className="w-4 h-4" />
                         {loadingClima ? 'Adicionando...' : 'Adicionar'}
                       </button>
                    </div>
                </form>
             </div>

             {/* Loteria Widget Form */}
             <div className="bg-white border border-[#e8edf2] rounded-[28px] p-7 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col group">
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Hash className="w-6 h-6 text-emerald-500" />
                   </div>
                   <div>
                     <h3 className="text-base font-bold text-zinc-800">Resultados de Loteria</h3>
                     <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Sorteios recentes</p>
                   </div>
                </div>
                
                <form onSubmit={handleAddLoteria} className="space-y-4 flex flex-col flex-1">
                   <div>
                     <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Tipo de Sorteio</label>
                     <select required value={tipoLoteria} onChange={e=>setTipoLoteria(e.target.value)} className="w-full bg-[#f4f6f8] border border-zinc-200 rounded-xl px-3 py-2.5 text-zinc-800 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all">
                        <option value="megasena">Mega-Sena</option>
                        <option value="megavirada">Mega da Virada</option>
                        <option value="lotofacil">Lotofácil</option>
                        <option value="quina">Quina</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Duração (s)</label>
                     <input type="number" min="1" required value={tempoExibicaoLoteria} onChange={e=>setTempoExibicaoLoteria(Number(e.target.value))} className="w-full bg-[#f4f6f8] border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all" />
                   </div>
                   
                   <div className="mt-auto pt-5 border-t border-zinc-100 flex flex-col gap-3">
                       <div>
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 group-hover:text-emerald-500 transition-colors">TELA DE DESTINO</label>
                          <select 
                            value={selectedTotemLoteria} 
                            onChange={e => setSelectedTotemLoteria(e.target.value)} 
                            className="w-full bg-emerald-50/50 border border-emerald-100 rounded-xl px-3 py-2 text-emerald-800 text-xs font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                          >
                             <option value="">Todas as Telas (Geral)</option>
                             {totems.map(t => <option key={t.id} value={t.id}>{t.nome} ({t.device_id})</option>)}
                          </select>
                       </div>
                       <button type="submit" disabled={loadingLoteria} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 text-[11px] font-extrabold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
                         <Plus className="w-4 h-4" />
                         {loadingLoteria ? 'Adicionando...' : 'Adicionar'}
                       </button>
                    </div>
                </form>
             </div>

             {/* YouTube Widget Form */}
             <div className="bg-white border border-[#e8edf2] rounded-[28px] p-7 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col group">
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Youtube className="w-6 h-6 text-red-500" />
                   </div>
                   <div>
                     <h3 className="text-base font-bold text-zinc-800">Vídeo do YouTube</h3>
                     <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Transmissão na tela</p>
                   </div>
                </div>

                <form onSubmit={handleAddYoutube} className="space-y-4 flex flex-col flex-1">
                   <div>
                     <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">URL ou ID do Vídeo</label>
                     <input
                       type="text"
                       required
                       placeholder="https://youtube.com/watch?v=..."
                       value={youtubeUrl}
                       onChange={e => setYoutubeUrl(e.target.value)}
                       className="w-full bg-[#f4f6f8] border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none transition-all"
                     />
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Duração (s)</label>
                     <input
                       type="number"
                       min="5"
                       required
                       value={tempoExibicaoYoutube}
                       onChange={e => setTempoExibicaoYoutube(Number(e.target.value))}
                       className="w-full bg-[#f4f6f8] border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none transition-all"
                     />
                   </div>
                   <div className="flex items-center justify-between gap-4 py-1">
                     <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-600 font-semibold">
                       <input
                         type="checkbox"
                         checked={youtubeLoop}
                         onChange={e => setYoutubeLoop(e.target.checked)}
                         className="w-4 h-4 rounded accent-red-500"
                       />
                       Loop infinito
                     </label>
                     <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-600 font-semibold">
                       <input
                         type="checkbox"
                         checked={youtubeMute}
                         onChange={e => setYoutubeMute(e.target.checked)}
                         className="w-4 h-4 rounded accent-red-500"
                       />
                       Silenciado
                     </label>
                   </div>
                   
                   <div className="mt-auto pt-5 border-t border-zinc-100 flex flex-col gap-3">
                       <div>
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 group-hover:text-red-500 transition-colors">TELA DE DESTINO</label>
                          <select 
                            value={selectedTotemYoutube} 
                            onChange={e => setSelectedTotemYoutube(e.target.value)} 
                            className="w-full bg-red-50/50 border border-red-100 rounded-xl px-3 py-2 text-red-800 text-xs font-semibold focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
                          >
                             <option value="">Todas as Telas (Geral)</option>
                             {totems.map(t => <option key={t.id} value={t.id}>{t.nome} ({t.device_id})</option>)}
                          </select>
                       </div>
                       <button
                         type="submit"
                         disabled={loadingYoutube}
                         className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl py-3 text-[11px] font-extrabold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                       >
                         <Plus className="w-4 h-4" />
                         {loadingYoutube ? 'Adicionando...' : 'Adicionar'}
                       </button>
                    </div>
                </form>
             </div>

             {/* Notícias Widget Form */}
             <div className="bg-white border border-[#e8edf2] rounded-[28px] p-7 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col group">
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Newspaper className="w-6 h-6 text-orange-500" />
                   </div>
                   <div>
                     <h3 className="text-base font-bold text-zinc-800">Notícias UOL</h3>
                     <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Últimas notícias (RSS)</p>
                   </div>
                </div>
                
                <form onSubmit={handleAddNoticias} className="space-y-4 flex flex-col flex-1">
                   <div>
                     <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Categoria</label>
                     <select required value={rssFeed} onChange={e=>setRssFeed(e.target.value)} className="w-full bg-[#f4f6f8] border border-zinc-200 rounded-xl px-3 py-2.5 text-zinc-800 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all">
                        <option value="noticias">Notícias Gerais</option>
                        <option value="esporte">Esportes</option>
                        <option value="economia">Economia</option>
                        <option value="entretenimento">Entretenimento</option>
                        <option value="tecnologia">Tecnologia</option>
                        <option value="jogos">Jogos</option>
                        <option value="carros">Carros</option>
                        <option value="educacao">Educação</option>
                        <option value="universa">Universa</option>
                        <option value="tilt">Tilt (Tech)</option>
                        <option value="vivabem">VivaBem (Saúde)</option>
                        <option value="ecoa">Ecoa (Sustentabilidade)</option>
                        <option value="nossauol">Nossa (Lifestyle)</option>
                     </select>
                   </div>
                   
                   <div>
                     <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Modo de Exibição</label>
                     <div className="flex gap-4">
                       <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-600 font-semibold">
                         <input type="radio" name="rssMode" value="random" checked={rssMode === 'random'} onChange={() => setRssMode('random')} className="w-4 h-4 accent-orange-500" />
                         Aleatória
                       </label>
                       <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-600 font-semibold">
                         <input type="radio" name="rssMode" value="latest3" checked={rssMode === 'latest3'} onChange={() => setRssMode('latest3')} className="w-4 h-4 accent-orange-500" />
                         As 3 últimas
                       </label>
                     </div>
                   </div>

                   <div>
                     <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Duração (s)</label>
                     <input type="number" min="1" required value={tempoExibicaoNoticias} onChange={e=>setTempoExibicaoNoticias(Number(e.target.value))} className="w-full bg-[#f4f6f8] border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all" />
                   </div>
                   
                   <div className="mt-auto pt-5 border-t border-zinc-100 flex flex-col gap-3">
                       <div>
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 group-hover:text-orange-500 transition-colors">TELA DE DESTINO</label>
                          <select 
                            value={selectedTotemNoticias} 
                            onChange={e => setSelectedTotemNoticias(e.target.value)} 
                            className="w-full bg-orange-50/50 border border-orange-100 rounded-xl px-3 py-2 text-orange-800 text-xs font-semibold focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                          >
                             <option value="">Todas as Telas (Geral)</option>
                             {totems.map(t => <option key={t.id} value={t.id}>{t.nome} ({t.device_id})</option>)}
                          </select>
                       </div>
                       <button type="submit" disabled={loadingNoticias} className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-xl py-3 text-[11px] font-extrabold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
                         <Plus className="w-4 h-4" />
                         {loadingNoticias ? 'Adicionando...' : 'Adicionar'}
                       </button>
                    </div>
                </form>
             </div>
          </div>

       </div>
    </div>
  );
}
