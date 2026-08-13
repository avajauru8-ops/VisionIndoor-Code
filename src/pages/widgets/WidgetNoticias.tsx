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
        const link = selectedItem.querySelector('link')?.textContent || '';
        
        let itemCategory = getCategoryName(feed);
        // Tenta extrair a categoria exata da URL da notícia, ex: noticias.uol.com.br/politica/
        try {
           if (link) {
              const urlParts = link.split('/');
              if (urlParts.length > 3) {
                 const possibleCategory = urlParts[3];
                 if (possibleCategory && possibleCategory.length > 2 && !possibleCategory.includes('.')) {
                    itemCategory = possibleCategory.charAt(0).toUpperCase() + possibleCategory.slice(1);
                 }
              }
           }
        } catch(e) {}

        const categoryNodes = selectedItem.querySelectorAll('category');
        if (categoryNodes.length > 0 && categoryNodes[0].textContent) {
           itemCategory = categoryNodes[0].textContent.trim();
        }

        let image = null;
        const enclosure = selectedItem.querySelector('enclosure');
        if (enclosure && enclosure.getAttribute('type')?.startsWith('image/')) {
          image = enclosure.getAttribute('url');
        } else {
          // Fallback para procurar tag <img> dentro da description ou content:encoded (padrão UOL)
          const desc = selectedItem.querySelector('description')?.textContent || '';
          const contentEncoded = selectedItem.getElementsByTagNameNS('*', 'encoded')[0]?.textContent || '';
          const htmlContent = desc + ' ' + contentEncoded;
          
          const imgMatch = htmlContent.match(/<img[^>]+src=["']([^"']+)["']/i);
          if (imgMatch && imgMatch[1]) {
             image = imgMatch[1];
          } else {
             const content = selectedItem.getElementsByTagNameNS('*', 'content');
             for (let i = 0; i < content.length; i++) {
               if (content[i].getAttribute('type')?.startsWith('image/')) {
                 image = content[i].getAttribute('url');
                 break;
               }
             }
          }
        }

        // Tentar obter a imagem de alta resolução se for gerada pelo UOL (removendo formato miniatura)
        if (image) {
           image = image.replace(/_v\d+_\d+x\d+\./i, '_v2_1920x1080.');
           image = image.replace(/_\d+x\d+\./i, '_1920x1080.');
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
    return <div style={{ width: '100vw', height: '100vh', backgroundColor: 'black', fontFamily: 'sans-serif' }}></div>;
  }

  const bgImage = noticia?.image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80';

  let titleFontSize = '7vh';
  let titleFontSizePortrait = '5.5vh';
  if ((noticia?.title || '').length > 150) {
    titleFontSize = '4.5vh';
    titleFontSizePortrait = '3vh';
  } else if ((noticia?.title || '').length > 90) {
    titleFontSize = '5.5vh';
    titleFontSizePortrait = '4vh';
  }

  return (
    <div className="widget-noticias">
      <style dangerouslySetInnerHTML={{__html: `
        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          background-color: black;
          overflow: hidden;
        }
        .widget-noticias {
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          position: relative;
          background-color: black;
          font-family: sans-serif;
        }
        .wn-bg {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          z-index: 0;
          background-position: center;
          background-repeat: no-repeat;
          background-size: cover;
        }
        .wn-tag-top {
          position: absolute;
          top: 0; left: 0;
          height: 12vh; width: 35vw;
          background-color: #8B0021;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          -webkit-clip-path: polygon(0 0, 100% 0, 85% 100%, 0 100%);
          clip-path: polygon(0 0, 100% 0, 85% 100%, 0 100%);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .wn-tag-top-text {
          color: white;
          font-weight: bold;
          font-size: 5.5vh;
          letter-spacing: 0.1em;
          margin-left: -2vw;
        }
        .wn-logo-top {
          position: absolute;
          top: 0; right: 0;
          height: 10vh; width: 25vw;
          background-color: white;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          -webkit-clip-path: polygon(15% 0, 100% 0, 100% 100%, 0 100%);
          clip-path: polygon(15% 0, 100% 0, 100% 100%, 0 100%);
        }
        .wn-logo-container {
          display: flex;
          align-items: center;
          margin-left: 3vw;
        }
        .wn-logo-circle {
          width: 6vh; height: 6vh;
          border-radius: 50%;
          background: linear-gradient(to top right, #FF6600, #FFCC00);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 1.5vw;
        }
        .wn-logo-inner {
          width: 3.5vh; height: 3.5vh;
          border-radius: 50%;
          background: linear-gradient(to top right, #990000, #FF6600);
        }
        .wn-logo-text {
          color: black;
          font-weight: 900;
          font-size: 6vh;
          letter-spacing: -0.05em;
        }
        .wn-overlay {
          position: absolute;
          bottom: 0; left: 0;
          width: 100%; height: 50vh;
          background: linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.8), transparent);
          z-index: 10;
        }
        .wn-content {
          position: absolute;
          bottom: 0; left: 0;
          width: 100%;
          z-index: 40;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding-bottom: 8vh;
        }
        .wn-category-wrapper {
          display: flex;
          width: 100%;
          padding-left: 6vw;
          padding-right: 6vw;
        }
        .wn-category {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background-color: #ad0029;
          height: 6vh;
          padding-left: 3vw;
          padding-right: 5vw;
          -webkit-clip-path: polygon(0 0, 100% 0, 85% 100%, 0 100%);
          clip-path: polygon(0 0, 100% 0, 85% 100%, 0 100%);
        }
        .wn-category-text {
          color: white;
          font-weight: bold;
          font-size: 3vh;
          letter-spacing: 0.1em;
          font-style: italic;
        }
        .wn-lines {
          width: 100%;
          display: flex;
          flex-direction: column;
        }
        .wn-line-1 { height: 0.3vh; width: 100%; background-color: #8B0021; }
        .wn-line-2 { height: 0.3vh; width: 100%; background-color: rgba(255,255,255,0.9); }
        .wn-title-wrapper {
          padding-left: 6vw;
          padding-right: 6vw;
          margin-top: 3vh;
        }
        .wn-title {
          color: white;
          font-weight: bold;
          line-height: 1.1;
          font-style: italic;
          text-shadow: 0 25px 50px rgba(0,0,0,0.5);
          white-space: normal;
          word-break: break-word;
          font-size: ${titleFontSize};
          margin: 0;
        }

        /* Portrait overrides */
        @media (orientation: portrait) {
          .wn-bg { background-position: center; }
          .wn-tag-top { height: 9vh; width: 50vw; }
          .wn-tag-top-text { font-size: 4.5vh; margin-left: -4vw; }
          .wn-logo-top { height: 7vh; width: 40vw; }
          .wn-logo-circle { width: 4vh; height: 4vh; margin-right: 2vw; }
          .wn-logo-inner { width: 2.2vh; height: 2.2vh; }
          .wn-logo-text { font-size: 4vh; }
          .wn-overlay { height: 40vh; }
          .wn-content { padding-bottom: 6vh; }
          .wn-category-wrapper { padding-left: 5vw; padding-right: 5vw; }
          .wn-category { height: 5vh; padding-left: 5vw; padding-right: 8vw; }
          .wn-category-text { font-size: 2.5vh; }
          .wn-title-wrapper { padding-left: 5vw; padding-right: 5vw; margin-top: 2vh; }
          .wn-title { line-height: 1.2; font-size: ${titleFontSizePortrait}; }
        }
      `}} />

      <div className="wn-bg" style={{ backgroundImage: `url('${bgImage}')` }}></div>
      
      <div className="wn-tag-top">
         <span className="wn-tag-top-text">NOTÍCIA</span>
      </div>

      <div className="wn-logo-top">
         <div className="wn-logo-container">
            <div className="wn-logo-circle">
              <div className="wn-logo-inner"></div>
            </div>
            <span className="wn-logo-text">UOL</span>
         </div>
      </div>

      <div className="wn-overlay"></div>
      
      <div className="wn-content">
          <div className="wn-category-wrapper">
             <div className="wn-category">
                 <span className="wn-category-text">{noticia?.category.toUpperCase()}</span>
             </div>
          </div>
          
          <div className="wn-lines">
               <div className="wn-line-1"></div>
               <div className="wn-line-2"></div>
          </div>

          <div className="wn-title-wrapper">
               <h1 className="wn-title">
                   {noticia?.title || 'CARREGANDO NOTÍCIA...'}
               </h1>
          </div>
      </div>
    </div>
  );
}
