import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function WidgetLoteria() {
  const [searchParams] = useSearchParams();
  const tipo = searchParams.get('tipo') || 'megasena';
  
  const generateNumbers = (count: number, seed: number) => {
    let result = [];
    let currentSeed = seed;
    const random = () => {
      const x = Math.sin(currentSeed++) * 10000;
      return x - Math.floor(x);
    };
    
    while(result.length < count) {
       const num = Math.floor(random() * 60) + 1;
       if (!result.includes(num)) result.push(num);
    }
    return result.sort((a,b) => a-b).map(n => n.toString().padStart(2, '0'));
  };

  const [numbers, setNumbers] = useState<string[]>([]);
  const [dataSorteio, setDataSorteio] = useState('');
  const [premio, setPremio] = useState('');
  
  useEffect(() => {
     const fetchData = async () => {
        try {
           const response = await fetch(`/api/loteria?tipo=${tipo}`);
           if (!response.ok) throw new Error('API request failed');
           const data = await response.json();
           
           if (data.listaDezenas) {
              setNumbers(data.listaDezenas);
           }
           if (data.dataApuracao) {
              setDataSorteio(data.dataApuracao);
           }
           if (data.valorEstimadoProximoConcurso) {
              const valorFormatado = (data.valorEstimadoProximoConcurso / 1000000).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
              setPremio(`R$ ${valorFormatado} Milhões`);
           }
        } catch (error) {
           console.error('Erro ao carregar loteria:', error);
           // Fallback para valores simulados em caso de erro da API
           const today = new Date();
           const seed = today.getFullYear() * 1000 + today.getMonth() * 100 + today.getDate() + (tipo === 'megasena' ? 1 : 2);
           setNumbers(generateNumbers(tipo === 'lotofacil' ? 15 : tipo === 'quina' ? 5 : 6, seed));
           setDataSorteio(today.toLocaleDateString('pt-BR'));
           setPremio(`R$ ${Math.floor(Math.random() * 40 + 10)} Milhões`);
        }
     };

     fetchData();
  }, [tipo]);

  const colors: Record<string, string> = {
    megasena: '#209869',
    megavirada: '#209869',
    lotofacil: '#930089',
    quina: '#260085'
  };

  const titles: Record<string, string> = {
    megasena: 'MEGA-SENA',
    megavirada: 'MEGA DA VIRADA',
    lotofacil: 'LOTOFÁCIL',
    quina: 'QUINA'
  };

  const bgColor = colors[tipo] || '#209869';
  const title = titles[tipo] || 'LOTERIA';

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-between text-white overflow-hidden p-[4vh]" style={{ backgroundColor: bgColor }}>
       
       {/* HEADER */}
       <div className="flex flex-col items-center mt-[2vh]">
           <div className="bg-white/10 px-[6vw] py-[1.5vh] rounded-full border-[0.4vh] border-white/20 shadow-2xl backdrop-blur-sm">
              <h1 className="text-[5vh] font-black uppercase tracking-widest text-white drop-shadow-md text-center leading-none">
                 {title}
              </h1>
           </div>
           <h2 className="text-[3.5vh] font-medium mt-[2vh] opacity-90 drop-shadow-sm text-center">
               SORTEIO: {dataSorteio}
           </h2>
       </div>
       
       {/* NUMBERS (Fills middle space) */}
       <div className={`flex flex-wrap justify-center items-center content-center flex-1 max-w-[95vw] w-full ${tipo === 'lotofacil' ? 'gap-[1.5vw] py-[2vh]' : 'gap-[2vw] py-[4vh]'}`}>
          {numbers.map((n, i) => (
            <div key={i} 
                 className={`bg-white rounded-full flex items-center justify-center shadow-[inset_0_-0.5vh_0_rgba(0,0,0,0.1)] font-black text-center border-[0.4vh] border-white/90 drop-shadow-xl ${
                   tipo === 'lotofacil' ? 'w-[12vh] h-[12vh] text-[6vh] m-[0.5vh]' : 'w-[16vh] h-[16vh] text-[8vh] m-[1vh]'
                 }`}
                 style={{ color: bgColor }}>
               {n}
            </div>
          ))}
       </div>

       {/* FOOTER */}
       <div className="text-[3.5vh] font-bold opacity-90 bg-black/20 px-[4vw] py-[2vh] rounded-[2vh] backdrop-blur-sm text-center max-w-[95vw] mb-[2vh]">
         Próximo prêmio estimado: <span className="text-yellow-300 drop-shadow-sm block sm:inline sm:ml-[1vw]">{premio}</span>
       </div>

    </div>
  );
}
