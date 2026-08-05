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
        
        const xmlText = await res.text();
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

  return (
    <div className="w-screen h-screen overflow-hidden relative bg-[#0b1f3b] text-white flex font-sans">
      
      {/* Background Image filling the screen */}
      <div 
        className="absolute inset-0 w-full h-full object-cover opacity-40 z-0 bg-center bg-no-repeat bg-cover"
        style={{ backgroundImage: `url('${bgImage}')` }}
      />
      
      {/* Red diagonal accent on the right */}
      <div className="absolute top-0 right-0 h-full w-[40%] bg-red-600 skew-x-[-15deg] origin-bottom -mr-[10%] z-0" />
      
      {/* Foreground Right (Image unmasked) */}
      <div className="absolute top-0 right-0 h-full w-[35%] overflow-hidden z-10 border-l-[1.5vh] border-red-600 skew-x-[-15deg] origin-bottom shadow-[-20px_0_40px_rgba(0,0,0,0.5)]">
         <div 
           className="absolute inset-0 w-[150%] h-full bg-center bg-no-repeat bg-cover skew-x-[15deg] -ml-[25%]"
           style={{ backgroundImage: `url('${bgImage}')` }}
         />
      </div>

      {/* Brand logo top right (over image) */}
      <div className="absolute top-[4vh] right-[4vh] z-30 flex items-center gap-3">
         <div className="w-[8vh] h-[8vh] bg-white rounded-full flex items-center justify-center shadow-lg">
            <span className="text-red-600 font-black text-[4vh] tracking-tighter">UOL</span>
         </div>
      </div>

      {/* Main Content Area (Left side) */}
      <div className="relative z-20 flex-1 flex flex-col justify-center px-[8vw] w-[65%]">
         
         {/* "Breaking News" / "Últimas Notícias" Tag */}
         <div className="inline-block bg-red-600 text-white font-black text-[4vh] tracking-widest px-[4vh] py-[1vh] self-start uppercase shadow-lg">
           {feed === 'noticias' ? 'Últimas Notícias' : feed.toUpperCase()}
         </div>

         {/* Headline Box */}
         <div className="bg-[#0b1f3b] text-white font-black text-[8vh] leading-[1.1] p-[3vh] pl-[4vh] mt-[-1vh] w-max max-w-[55vw] shadow-2xl relative z-10 break-words line-clamp-3">
            {noticia?.title}
         </div>

         {/* Subtitle / Description */}
         <div className="bg-white text-[#0b1f3b] font-bold text-[3.5vh] leading-snug p-[3vh] pl-[4vh] mt-[-1vh] max-w-[50vw] shadow-xl relative z-0 border-l-[1vh] border-red-600">
            {noticia?.description}
         </div>

      </div>

    </div>
  );
}
