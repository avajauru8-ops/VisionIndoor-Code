import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function WidgetNoticias() {
  const [searchParams] = useSearchParams();
  const feed = searchParams.get('feed') || 'noticias';
  const mode = searchParams.get('mode') || 'random'; // 'random' or 'latest3'

  const [noticia, setNoticia] = useState<{
    title: string;
    image: string | null;
    category: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);

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
        
        let itemCategory = getCategoryName(feed);
        const categoryNodes = selectedItem.querySelectorAll('category');
        if (categoryNodes.length > 0 && categoryNodes[0].textContent) {
           itemCategory = categoryNodes[0].textContent.trim();
        }

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

        setNoticia({ title, image, category: itemCategory });
        localStorage.setItem(`noticias_${feed}_${mode}`, JSON.stringify({ title, image, category: itemCategory }));
      } catch (err) {
        console.error('Error parsing RSS:', err);
        const cached = localStorage.getItem(`noticias_${feed}_${mode}`);
        if (cached) {
          try {
            setNoticia(JSON.parse(cached));
          } catch(e) {}
        } else {
          setNoticia({
            title: 'Notícias Indisponíveis no momento',
            image: null,
            category: 'Aviso'
          });
        }
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

  return (
    <div className="w-screen h-screen overflow-hidden relative bg-black font-sans">
      
      {/* Background Image filling the screen */}
      <div 
        className="absolute inset-0 w-full h-full object-cover portrait:object-center z-0 bg-center bg-no-repeat bg-cover"
        style={{ backgroundImage: `url('${bgImage}')` }}
      />
      
      {/* Top Left: NOTÍCIA */}
      <div 
        className="absolute top-0 left-0 h-[12vh] portrait:h-[9vh] w-[35vw] portrait:w-[50vw] bg-[#8B0021] z-10 flex items-center justify-center shadow-2xl" 
        style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)' }}
      >
         <span className="text-white font-bold text-[5.5vh] portrait:text-[4.5vh] tracking-widest ml-[-2vw] portrait:ml-[-4vw]">NOTÍCIA</span>
      </div>

      {/* Top Right: UOL Logo */}
      <div 
        className="absolute top-0 right-0 h-[10vh] portrait:h-[7vh] w-[25vw] portrait:w-[40vw] bg-white z-10 flex items-center justify-center shadow-2xl" 
        style={{ clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0 100%)' }}
      >
         <div className="flex items-center gap-[1.5vw] portrait:gap-[2vw] ml-[3vw]">
            <div className="w-[6vh] h-[6vh] portrait:w-[4vh] portrait:h-[4vh] rounded-full bg-gradient-to-tr from-[#FF6600] to-[#FFCC00] shadow-inner relative flex items-center justify-center">
              <div className="w-[3.5vh] h-[3.5vh] portrait:w-[2.2vh] portrait:h-[2.2vh] rounded-full bg-gradient-to-tr from-[#990000] to-[#FF6600]"></div>
            </div>
            <span className="text-black font-black text-[6vh] portrait:text-[4vh] tracking-tighter">UOL</span>
         </div>
      </div>

      {/* Bottom Area Overlay for readability */}
      <div className="absolute bottom-0 left-0 w-full h-[50vh] portrait:h-[40vh] bg-gradient-to-t from-black/95 via-black/80 to-transparent z-10"></div>
      
      {/* Bottom Flex Container for Category, Lines, and Title */}
      <div className="absolute bottom-0 left-0 w-full z-40 flex flex-col justify-end pb-[8vh] portrait:pb-[6vh]">
          {/* Category Box */}
          <div className="flex w-full px-[6vw] portrait:px-[5vw]">
             <div className="inline-flex items-center justify-center bg-[#ad0029] h-[6vh] portrait:h-[5vh] px-[3vw] portrait:px-[5vw] pr-[5vw] portrait:pr-[8vw]" style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)' }}>
                 <span className="text-white font-bold text-[3vh] portrait:text-[2.5vh] tracking-widest italic">{noticia?.category.toUpperCase()}</span>
             </div>
          </div>
          
          {/* Divider lines directly below Category Box */}
          <div className="w-full flex flex-col">
               <div className="h-[0.3vh] w-full bg-[#8B0021]"></div>
               <div className="h-[0.3vh] w-full bg-white opacity-90"></div>
          </div>

          {/* Title Text */}
          <div className="px-[6vw] portrait:px-[5vw] mt-[3vh] portrait:mt-[2vh]">
               <h1 className={`text-white font-bold leading-[1.1] portrait:leading-[1.2] italic drop-shadow-2xl whitespace-normal break-words ${
                   (noticia?.title || '').length > 150 ? 'text-[4.5vh] portrait:text-[3vh]' :
                   (noticia?.title || '').length > 90 ? 'text-[5.5vh] portrait:text-[4vh]' :
                   'text-[7vh] portrait:text-[5.5vh]'
               }`}>
                   {noticia?.title || 'CARREGANDO NOTÍCIA...'}
               </h1>
          </div>
      </div>

    </div>
  );
}
