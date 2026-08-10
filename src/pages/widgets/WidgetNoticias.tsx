import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function WidgetNoticias() {
  const [searchParams] = useSearchParams();
  const feed = searchParams.get('feed') || 'noticias';
  const mode = searchParams.get('mode') || 'random'; // 'random' or 'latest3'

  const [noticia, setNoticia] = useState<{
    title: string;
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
          const latest3 = items.slice(0, 3);
          selectedItem = latest3[Math.floor(Math.random() * latest3.length)];
        } else {
          selectedItem = items[Math.floor(Math.random() * items.length)];
        }

        const title = selectedItem.querySelector('title')?.textContent || '';
        
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

        setNoticia({ title, image });
      } catch (err) {
        console.error('Error parsing RSS:', err);
        setNoticia({
          title: 'Notícias Indisponíveis no momento',
          image: null
        });
      } finally {
        setLoading(false);
      }
    }

    fetchRSS();
    const interval = setInterval(fetchRSS, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [feed, mode]);

  if (loading) {
    return <div className="w-screen h-screen bg-black font-sans"></div>;
  }

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
    return map[f] || 'Cotidiano';
  };
  const categoryName = getCategoryName(feed);

  return (
    <div className="w-screen h-screen overflow-hidden relative bg-black font-sans">
      
      {/* Background Image filling the screen */}
      <div 
        className="absolute inset-0 w-full h-full object-cover z-0 bg-center bg-no-repeat bg-cover"
        style={{ backgroundImage: `url('${bgImage}')` }}
      />
      
      {/* Top Left: NOTÍCIA */}
      <div 
        className="absolute top-0 left-0 h-[12vh] w-[35vw] bg-[#8B0021] z-10 flex items-center justify-center shadow-2xl" 
        style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)' }}
      >
         <span className="text-white font-bold text-[5.5vh] tracking-widest ml-[-2vw]">NOTÍCIA</span>
      </div>

      {/* Top Right: UOL Logo */}
      <div 
        className="absolute top-0 right-0 h-[10vh] w-[25vw] bg-white z-10 flex items-center justify-center shadow-2xl" 
        style={{ clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0 100%)' }}
      >
         <div className="flex items-center gap-[1.5vw] ml-[3vw]">
            <div className="w-[6vh] h-[6vh] rounded-full bg-gradient-to-tr from-[#FF6600] to-[#FFCC00] shadow-inner relative flex items-center justify-center">
              <div className="w-[3.5vh] h-[3.5vh] rounded-full bg-gradient-to-tr from-[#990000] to-[#FF6600]"></div>
            </div>
            <span className="text-black font-black text-[6vh] tracking-tighter">UOL</span>
         </div>
      </div>

      {/* Bottom Area Overlay for readability */}
      <div className="absolute bottom-0 left-0 w-full h-[40vh] bg-gradient-to-t from-black/95 via-black/60 to-transparent z-10"></div>
      
      {/* Divider lines across the screen */}
      <div className="absolute bottom-[30vh] left-0 w-full z-20 flex flex-col">
         <div className="h-[0.3vh] w-full bg-[#8B0021]"></div>
         <div className="h-[0.3vh] w-full bg-white opacity-90"></div>
      </div>

      {/* Category Box */}
      <div 
        className="absolute bottom-[30.6vh] left-[6vw] h-[6vh] w-[22vw] bg-[#ad0029] z-30 flex items-center justify-center" 
        style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)' }}
      >
         <span className="text-white font-bold text-[3vh] tracking-widest italic ml-[-2vw]">{categoryName.toUpperCase()}</span>
      </div>

      {/* Title Text */}
      <div className="absolute bottom-[8vh] left-[6vw] right-[6vw] z-40">
         <h1 className="text-white font-bold text-[7vh] leading-[1.1] italic drop-shadow-2xl line-clamp-3">
             {noticia?.title || 'CARREGANDO NOTÍCIA...'}
         </h1>
      </div>

    </div>
  );
}
