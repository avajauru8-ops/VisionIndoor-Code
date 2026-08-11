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

  return (
    <div className="w-screen h-screen bg-[#10131c] flex flex-col font-sans overflow-hidden">
      
      {/* Top Bar */}
      <div className="relative w-full h-[15vh] portrait:h-[9vh] bg-white flex shadow-md overflow-hidden shrink-0">
         {/* Dark section left */}
         <div className="absolute top-0 left-0 h-full w-[70vw] portrait:w-[75vw] bg-[#0c1017] z-10" style={{ clipPath: 'polygon(0 0, 100% 0, 93% 100%, 0 100%)' }}>
           <div className="flex flex-col h-full pl-[5vw] justify-center pt-[2vh] portrait:pt-[1vh]">
             <span className="text-white font-bold tracking-widest text-[4.5vh] portrait:text-[3.5vh]">FRASES E PENSAMENTOS</span>
             <div className="h-[0.2vh] w-[80%] bg-white/30 mt-[1vh] portrait:mt-[0.5vh]"></div>
           </div>
         </div>
         
         {/* Right section */}
         <div className="absolute right-[5vw] top-0 h-full flex items-center justify-end z-0">
             <div className="flex items-center gap-[1vw]">
                {/* Creative Commons text mock */}
                <span className="text-zinc-800 font-bold text-[3vh] portrait:text-[2vh] tracking-tighter">cc</span>
                <span className="text-zinc-800 font-bold text-[2.5vh] portrait:text-[1.5vh] leading-none">creative<br/>commons</span>
             </div>
         </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex items-center justify-center p-[8vw] portrait:p-[5vw]">
         <div className="relative w-full max-w-[85vw] portrait:max-w-[95vw] bg-[#f8fafc] rounded-2xl portrait:rounded-3xl shadow-2xl flex flex-col p-[6vw] portrait:p-[8vw]">
            
            {/* Aspas decorativas */}
            <div className="text-[#38bdf8] text-[15vh] portrait:text-[10vh] font-serif leading-none opacity-60 absolute top-[4vh] portrait:top-[2vh] left-[4vw] portrait:left-[5vw]">
               “
            </div>

            <div className="flex flex-col items-center justify-center flex-1 w-full z-10 mt-[6vh] portrait:mt-[4vh]">
               {/* Texto da Frase */}
               <h1 className="text-zinc-800 font-serif text-[6.5vh] portrait:text-[5vh] leading-[1.3] portrait:leading-[1.4] text-center font-medium drop-shadow-sm mb-[6vh] portrait:mb-[4vh]">
                  {quote.text}
               </h1>

               {/* Linha Divisória */}
               <div className="w-full h-[0.2vh] bg-zinc-300 mb-[4vh] portrait:mb-[3vh]"></div>

               {/* Autor */}
               <h2 className="text-zinc-500 font-serif text-[4.5vh] portrait:text-[3.5vh] text-center">
                  {quote.author}
               </h2>
            </div>
         </div>
      </div>

    </div>
  );
}
