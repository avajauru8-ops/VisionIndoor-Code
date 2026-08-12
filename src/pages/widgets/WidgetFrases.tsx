import React, { useState, useEffect } from 'react';

const fallbackQuotes = [
    { text: "A imaginação é mais importante que o conhecimento.", author: "Albert Einstein" },
    { text: "O sucesso é ir de fracasso em fracasso sem perder o entusiasmo.", author: "Winston Churchill" },
    { text: "A vida é aquilo que acontece enquanto você está fazendo outros planos.", author: "John Lennon" },
    { text: "O único lugar onde o sucesso vem antes do trabalho é no dicionário.", author: "Albert Einstein" },
    { text: "Tudo o que um sonho precisa para ser realizado é alguém que acredite que ele possa ser realizado.", author: "Roberto Shinyashiki" },
    { text: "Não sabendo que era impossível, foi lá e fez.", author: "Jean Cocteau" },
    { text: "A verdadeira medida de um homem não se vê na forma como se comporta em momentos de conforto, mas em como se mantém em tempos de controvérsia.", author: "Martin Luther King Jr." },
    { text: "Dê a uma garota os sapatos certos e ela poderá conquistar o mundo.", author: "Bette Midler" }
];

export default function WidgetFrases() {
  const [quote, setQuote] = useState({ text: '', author: '' });

  useEffect(() => {
    // Escolhe uma frase aleatória no carregamento da tela
    const randomIndex = Math.floor(Math.random() * fallbackQuotes.length);
    const selected = fallbackQuotes[randomIndex];
    setQuote(selected);

    // Envia a frase exata para o backend se o device_id estiver presente
    const params = new URLSearchParams(window.location.search);
    const deviceId = params.get('device_id');
    if (deviceId) {
      fetch('/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: deviceId,
          widget_status: `Reproduzindo Widget: Frases - "${selected.text}" - ${selected.author}`
        })
      }).catch(err => console.error('Erro ao atualizar status do widget:', err));
    }
  }, []);

  let titleFontSize = '6.5vh';
  let titleFontSizePortrait = '5vh';
  if (quote.text.length > 200) {
    titleFontSize = '3.5vh';
    titleFontSizePortrait = '2.5vh';
  } else if (quote.text.length > 120) {
    titleFontSize = '4.5vh';
    titleFontSizePortrait = '3.5vh';
  } else if (quote.text.length > 70) {
    titleFontSize = '5.5vh';
    titleFontSizePortrait = '4vh';
  }

  return (
    <div className="widget-frases">
      <style dangerouslySetInnerHTML={{__html: `
        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          background-color: #10131c;
          overflow: hidden;
        }
        .widget-frases {
          width: 100vw;
          height: 100vh;
          background-color: #10131c;
          display: flex;
          flex-direction: column;
          font-family: sans-serif;
          overflow: hidden;
        }
        .wf-topbar {
          position: relative;
          width: 100%;
          height: 15vh;
          background-color: white;
          display: flex;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          flex-shrink: 0;
        }
        .wf-topbar-dark {
          position: absolute;
          top: 0; left: 0;
          height: 100%;
          width: 70vw;
          background-color: #0c1017;
          z-index: 10;
          -webkit-clip-path: polygon(0 0, 100% 0, 93% 100%, 0 100%);
          clip-path: polygon(0 0, 100% 0, 93% 100%, 0 100%);
        }
        .wf-topbar-inner {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding-left: 5vw;
          justify-content: center;
          padding-top: 2vh;
        }
        .wf-topbar-title {
          color: white;
          font-weight: bold;
          letter-spacing: 0.1em;
          font-size: 4.5vh;
        }
        .wf-topbar-line {
          height: 0.2vh;
          width: 80%;
          background-color: rgba(255,255,255,0.3);
          margin-top: 1vh;
        }
        .wf-topbar-right {
          position: absolute;
          right: 5vw; top: 0;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          z-index: 0;
        }
        .wf-cc-wrapper {
          display: flex;
          align-items: center;
          gap: 1vw;
        }
        .wf-cc-icon {
          color: #27272a;
          font-weight: bold;
          font-size: 3vh;
          letter-spacing: -0.05em;
        }
        .wf-cc-text {
          color: #27272a;
          font-weight: bold;
          font-size: 2.5vh;
          line-height: 1;
        }
        
        .wf-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8vw;
        }
        .wf-card {
          position: relative;
          width: 100%;
          max-width: 85vw;
          background-color: #f8fafc;
          border-radius: 1rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          padding: 6vw;
        }
        .wf-quote-mark {
          color: #38bdf8;
          font-size: 15vh;
          font-family: serif;
          line-height: 1;
          opacity: 0.6;
          position: absolute;
          top: 4vh; left: 4vw;
        }
        .wf-card-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          width: 100%;
          z-index: 10;
          margin-top: 6vh;
        }
        .wf-quote-text {
          color: #27272a;
          font-family: serif;
          line-height: 1.3;
          text-align: center;
          font-weight: 500;
          text-shadow: 0 1px 2px rgba(0,0,0,0.05);
          margin-bottom: 6vh;
          font-size: ${titleFontSize};
          margin-top: 0;
        }
        .wf-card-line {
          width: 100%;
          height: 0.2vh;
          background-color: #d4d4d8;
          margin-bottom: 4vh;
        }
        .wf-author {
          color: #71717a;
          font-family: serif;
          font-size: 4.5vh;
          text-align: center;
          margin: 0;
        }

        /* Portrait overrides */
        @media (orientation: portrait) {
          .wf-topbar { height: 9vh; }
          .wf-topbar-dark { width: 75vw; }
          .wf-topbar-inner { padding-top: 1vh; }
          .wf-topbar-title { font-size: 3.5vh; }
          .wf-topbar-line { margin-top: 0.5vh; }
          .wf-cc-icon { font-size: 2vh; }
          .wf-cc-text { font-size: 1.5vh; }
          
          .wf-content { padding: 5vw; }
          .wf-card { max-width: 95vw; border-radius: 1.5rem; padding: 8vw; }
          .wf-quote-mark { font-size: 10vh; top: 2vh; left: 5vw; }
          .wf-card-inner { margin-top: 4vh; }
          .wf-quote-text { line-height: 1.4; margin-bottom: 4vh; font-size: ${titleFontSizePortrait}; }
          .wf-card-line { margin-bottom: 3vh; }
          .wf-author { font-size: 3.5vh; }
        }
      `}} />

      <div className="wf-topbar">
         <div className="wf-topbar-dark">
           <div className="wf-topbar-inner">
             <span className="wf-topbar-title">FRASES E PENSAMENTOS</span>
             <div className="wf-topbar-line"></div>
           </div>
         </div>
         
         <div className="wf-topbar-right">
             <div className="wf-cc-wrapper">
                <span className="wf-cc-icon">cc</span>
                <span className="wf-cc-text">creative<br/>commons</span>
             </div>
         </div>
      </div>

      <div className="wf-content">
         <div className="wf-card">
            
            <div className="wf-quote-mark">“</div>

            <div className="wf-card-inner">
               <h1 className="wf-quote-text">
                  {quote.text}
               </h1>

               <div className="wf-card-line"></div>

               <h2 className="wf-author">
                  {quote.author}
               </h2>
            </div>
         </div>
      </div>
    </div>
  );
}
