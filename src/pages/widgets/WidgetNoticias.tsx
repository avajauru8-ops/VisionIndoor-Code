import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function WidgetNoticias() {
  const [searchParams] = useSearchParams();
  const feed = searchParams.get('feed') || 'noticias';
  const mode = searchParams.get('mode') || 'random'; // 'random' or 'latest3'

  const [noticia, setNoticia] = useState<{
    title: string;
    description: string;
    image: string | null;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRSS() {
      try {
        const res = await fetch(`/api/rss-uol?feed=${encodeURIComponent(feed)}`);
        if (!res.ok) throw new Error('Failed to fetch RSS');
        
        const buffer = await res.arrayBuffer();
        const decoder = new TextDecoder('iso-8859-1');
        const xmlText = decoder.decode(buffer);
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlText, 'text/xml');
        const items = Array.from(xml.querySelectorAll('item'));

        if (items.length === 0) throw new Error('No items found');

        let selectedItem;
        if (mode === 'latest3') {
          // Picks a random one from the 3 most recent
          const latest3 = items.slice(0, 3);
          selectedItem = latest3[Math.floor(Math.random() * latest3.length)];
        } else {
          // Picks a random one from all available (usually ~30-50 in RSS)
          selectedItem = items[Math.floor(Math.random() * items.length)];
        }

        const title = selectedItem.querySelector('title')?.textContent || '';
        let description = selectedItem.querySelector('description')?.textContent || '';
        
        // Remove HTML tags from description
        const doc = new DOMParser().parseFromString(description, 'text/html');
        description = doc.body.textContent || '';
        if (description.length > 150) {
           description = description.substring(0, 150) + '...';
        }

        // Try to get image from <enclosure> or <media:content>
        let image = null;
        const enclosure = selectedItem.querySelector('enclosure');
        if (enclosure && enclosure.getAttribute('type')?.startsWith('image/')) {
          image = enclosure.getAttribute('url');
        } else {
          const content = selectedItem.getElementsByTagNameNS('*', 'content');
          for (let i = 0; i < content.length; i++) {
            if (content[i].getAttribute('type')?.startsWith('image/')) {
              image = content[i].getAttribute('url');
              break;
            }
          }
        }

        setNoticia({ title, description, image });
      } catch (err) {
        console.error('Error parsing RSS:', err);
        setNoticia({
          title: 'Notícias Indisponíveis no momento',
          description: 'Não foi possível carregar as notícias. Tente novamente mais tarde.',
          image: null
        });
      } finally {
        setLoading(false);
      }
    }

    fetchRSS();
  }, [feed, mode]);

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-slate-900 text-white">
         <div className="w-16 h-16 border-4 border-slate-700 border-t-red-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Layout inspired by the user's "Breaking News" image
  // Dark blue background for text side, red diagonal separator, image taking the right side.
  // Actually, full image background with dark/red overlays works better.

  const bgImage = noticia?.image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80';

  const getCategoryName = (f: string) => {
    const map: Record<string, string> = {
      noticias: 'Notícias',
      esporte: 'Esportes',
      economia: 'Economia',
      entretenimento: 'Entretenimento',
      tecnologia: 'Tecnologia',
      jogos: 'Jogos',
      carros: 'Carros',
      educacao: 'Educação',
      universa: 'Universa',
      tilt: 'Tilt',
      vivabem: 'Saúde',
      ecoa: 'Sustentabilidade',
      nossauol: 'Nossa'
    };
    return map[f] || 'Notícias';
  };
  const categoryName = getCategoryName(feed);

  return (
    <div className="w-screen h-screen overflow-hidden relative bg-zinc-900 font-sans">
      
      {/* Background Image filling the screen */}
      <div 
        className="absolute inset-0 w-full h-full object-cover opacity-60 z-0 bg-center bg-no-repeat bg-cover"
        style={{ backgroundImage: `url('${bgImage}')` }}
      />
      
      {/* Top Right Logo */}
      <div className="absolute top-[4vh] right-[4vh] w-[12vh] h-[12vh] bg-[#d11111] rounded-full flex items-center justify-center shadow-lg z-50">
         <span className="text-white font-black text-[3.5vh] tracking-tighter">UOL</span>
      </div>

      {/* White Box for Text (Description) */}
      <div className="absolute top-[6vh] left-[5vw] right-[5vw] h-[60vh] bg-white/90 backdrop-blur-md rounded-[3vh] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center p-[6vh] z-10 text-center border-[0.5vh] border-white/50">
         <div className="absolute top-[3vh] left-[4vh] bg-[#1a2b4c] text-white px-[2vh] py-[0.5vh] rounded-full text-[2.5vh] font-bold uppercase tracking-widest shadow-md">
            {categoryName}
         </div>
         <p className="text-[#1a2b4c] font-extrabold text-[4.5vh] leading-[1.4] line-clamp-5 mt-[2vh]">
             {noticia?.description || 'Carregando descrição da notícia...'}
         </p>
      </div>

      {/* Bottom Red Bar (Title) */}
      <div className="absolute bottom-0 left-0 w-full h-[30vh] bg-gradient-to-b from-[#8B0000] to-[#5a0000] z-20 flex flex-col justify-center items-center px-[5vw]">
         {/* Decorative curved gradient overlay at bottom like the image (simulated with CSS) */}
         <div className="absolute bottom-0 left-0 w-full h-full bg-red-500/20 mix-blend-overlay rounded-t-[100%] scale-150 translate-y-[50%]" />
         
         <h1 className="text-white font-black text-[6vh] text-center uppercase drop-shadow-xl z-30 line-clamp-2 leading-tight">
             {noticia?.title || 'CARREGANDO TÍTULO...'}
         </h1>
      </div>

      {/* Breaking News Ribbon */}
      <div className="absolute left-0 bottom-[24vh] z-40 flex items-end">
         
         {/* Dark blue slanted tab behind */}
         <div className="absolute left-0 bottom-[9vh] w-[25vw] h-[6vh] bg-[#1a2b4c] skew-x-[20deg] origin-bottom-left" />
         
         {/* Shadow element underneath the ribbon */}
         <div className="absolute left-[2vw] bottom-[-1vh] w-[30vw] h-[2vh] bg-black/30 blur-md" />

         {/* Main Red Ribbon */}
         <div className="relative bg-[#d11111] h-[11vh] flex items-center pl-[5vw] pr-[4vw] skew-x-[20deg] origin-bottom-left border-r-[1.5vh] border-[#e5e5e5] shadow-xl z-10">
             <div className="skew-x-[-20deg]">
                 <span className="text-white font-black text-[4.5vh] uppercase tracking-wider drop-shadow-md">
                     ÚLTIMAS NOTÍCIAS
                 </span>
             </div>
         </div>

         {/* Slanted lines decoration next to ribbon */}
         <div className="w-[2vh] h-[11vh] bg-[#d11111] skew-x-[20deg] ml-[1.5vh] shadow-lg z-10" />
         <div className="w-[2vh] h-[11vh] bg-[#d11111] skew-x-[20deg] ml-[1.5vh] shadow-lg z-10" />
         
         {/* White angled cut element underneath the red ribbon to match the overlapping style */}
         <div className="absolute left-[10vw] bottom-[-2vh] w-[25vw] h-[2vh] bg-[#e5e5e5] skew-x-[20deg] origin-bottom-left z-0" />
      </div>

    </div>
  );
}
