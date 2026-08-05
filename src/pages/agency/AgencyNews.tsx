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
  const [selectedTotem, setSelectedTotem] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Clima
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [estados, setEstados] = useState<any[]>([]);
  const [cidades, setCidades] = useState<any[]>([]);

  const [tempoExibicaoClima, setTempoExibicaoClima] = useState(15);
  const [loadingClima, setLoadingClima] = useState(false);

  // Loteria
  const [tipoLoteria, setTipoLoteria] = useState('megasena');
  const [tempoExibicaoLoteria, setTempoExibicaoLoteria] = useState(15);
  const [loadingLoteria, setLoadingLoteria] = useState(false);

  // YouTube
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [tempoExibicaoYoutube, setTempoExibicaoYoutube] = useState(60);
  const [youtubeLoop, setYoutubeLoop] = useState(true);
  const [youtubeMute, setYoutubeMute] = useState(true);
  const [loadingYoutube, setLoadingYoutube] = useState(false);

  // Noticias RSS
  const [rssFeed, setRssFeed] = useState('noticias');
  const [rssMode, setRssMode] = useState('random');
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
      if (tData.length > 0 && !selectedTotem) setSelectedTotem(tData[0].id.toString());
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
        totem_id: selectedTotem,
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
        totem_id: selectedTotem,
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
        totem_id: selectedTotem || null,
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
        totem_id: selectedTotem || null,
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


  const newsPlaylists = playlists.filter(p => p.tipo_midia === 'noticia' && (selectedTotem ? p.totem_id === Number(selectedTotem) || p.totem_id === null : true));

  return (
    <div className="space-y-6 flex flex-col lg:h-[calc(100vh-8rem)] h-auto">
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
         <div>
           <h2 className="text-2xl font-extrabold text-[#0b462c] tracking-tight">Utilizar Notícias & Widgets</h2>
           <p className="text-xs text-[#8b9aa5] font-medium mt-1">Adicione widgets dinâmicos de clima e utilidade à sua playlist.</p>
         </div>
         <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Filtrar Tela:</span>
            <select 
              className="bg-[#f4f6f8] border border-zinc-200 rounded-xl text-xs px-3 py-2 outline-none text-zinc-700 font-sans focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              value={selectedTotem}
              onChange={(e) => setSelectedTotem(e.target.value)}
            >
               <option value="">Todas as Telas (Global)</option>
               {totems.map(t => (
                 <option key={t.id} value={t.id}>{t.nome} ({t.device_id})</option>
               ))}
            </select>
         </div>
       </div>

       <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
             {/* Clima Widget Form */}
             <div className="bg-white border border-[#e8edf2] rounded-[24px] p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <CloudRain className="w-5 h-5 text-blue-500" />
                   </div>
                   <div>
                     <h3 className="text-sm font-bold text-zinc-800">Clima Tempo</h3>
                     <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Previsão do tempo local</p>
                   </div>
                </div>
                
                <form onSubmit={handleAddClima} className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Estado (UF)</label>
                         <select required value={estado} onChange={e=>setEstado(e.target.value)} className="w-full bg-[#f4f6f8] border border-zinc-200 rounded-xl px-3 py-2.5 text-zinc-800 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all uppercase">
                            <option value="">Selecione...</option>
                            {estados.map(uf => <option key={uf.sigla} value={uf.sigla}>{uf.nome}</option>)}
                         </select>
                      </div>
                      <div>
                         <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Cidade</label>
                         <select required disabled={!estado} value={cidade} onChange={e=>setCidade(e.target.value)} className="w-full bg-[#f4f6f8] border border-zinc-200 rounded-xl px-3 py-2.5 text-zinc-800 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all">
                            <option value="">Selecione...</option>
                            {cidades.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                         </select>
                      </div>
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Duração (s)</label>
                     <input type="number" min="1" required value={tempoExibicaoClima} onChange={e=>setTempoExibicaoClima(Number(e.target.value))} className="w-full bg-[#f4f6f8] border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all" />
                   </div>
                   <button type="submit" disabled={loadingClima} className="w-full bg-[#0b462c] hover:bg-[#082a1b] text-white rounded-full py-3 text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2 shadow-sm">
                     <Plus className="w-4 h-4" />
                     {loadingClima ? 'Adicionando...' : 'Adicionar à Playlist'}
                   </button>
                </form>
             </div>

             {/* Loteria Widget Form */}
             <div className="bg-white border border-[#e8edf2] rounded-[24px] p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <Hash className="w-5 h-5 text-emerald-500" />
                   </div>
                   <div>
                     <h3 className="text-sm font-bold text-zinc-800">Resultados de Loteria</h3>
                     <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Sorteios recentes</p>
                   </div>
                </div>
                
                <form onSubmit={handleAddLoteria} className="space-y-4">
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
                   <button type="submit" disabled={loadingLoteria} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-full py-3 text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2 shadow-sm">
                     <Plus className="w-4 h-4" />
                     {loadingLoteria ? 'Adicionando...' : 'Adicionar à Playlist'}
                   </button>
                </form>
             </div>

             {/* YouTube Widget Form */}
             <div className="bg-white border border-[#e8edf2] rounded-[24px] p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                      <Youtube className="w-5 h-5 text-red-500" />
                   </div>
                   <div>
                     <h3 className="text-sm font-bold text-zinc-800">Vídeo do YouTube</h3>
                     <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Transmita vídeos na tela</p>
                   </div>
                </div>

                <form onSubmit={handleAddYoutube} className="space-y-4">
                   <div>
                     <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">URL ou ID do Vídeo</label>
                     <input
                       type="text"
                       required
                       placeholder="https://youtube.com/watch?v=... ou ID"
                       value={youtubeUrl}
                       onChange={e => setYoutubeUrl(e.target.value)}
                       className="w-full bg-[#f4f6f8] border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none transition-all"
                     />
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Duração na Tela (s)</label>
                     <input
                       type="number"
                       min="5"
                       required
                       value={tempoExibicaoYoutube}
                       onChange={e => setTempoExibicaoYoutube(Number(e.target.value))}
                       className="w-full bg-[#f4f6f8] border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none transition-all"
                     />
                   </div>
                   <div className="flex items-center justify-between gap-4">
                     <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-600 font-semibold">
                       <input
                         type="checkbox"
                         checked={youtubeLoop}
                         onChange={e => setYoutubeLoop(e.target.checked)}
                         className="w-4 h-4 rounded accent-red-500"
                       />
                       Repetir (Loop)
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
                   <button
                     type="submit"
                     disabled={loadingYoutube}
                     className="w-full bg-red-600 hover:bg-red-500 text-white rounded-full py-3 text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2 shadow-sm"
                   >
                     <Plus className="w-4 h-4" />
                     {loadingYoutube ? 'Adicionando...' : 'Adicionar à Playlist'}
                    </button>
                </form>
             </div>

             {/* Notícias Widget Form */}
             <div className="bg-white border border-[#e8edf2] rounded-[24px] p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                      <Newspaper className="w-5 h-5 text-orange-500" />
                   </div>
                   <div>
                     <h3 className="text-sm font-bold text-zinc-800">Notícias UOL</h3>
                     <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Últimas notícias (RSS)</p>
                   </div>
                </div>
                
                <form onSubmit={handleAddNoticias} className="space-y-4">
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
                   
                   <button type="submit" disabled={loadingNoticias} className="w-full bg-orange-600 hover:bg-orange-500 text-white rounded-full py-3 text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2 shadow-sm">
                     <Plus className="w-4 h-4" />
                     {loadingNoticias ? 'Adicionando...' : 'Adicionar à Playlist'}
                   </button>
                </form>
             </div>
          </div>

       </div>
    </div>
  );
}
