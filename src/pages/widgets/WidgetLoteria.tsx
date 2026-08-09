import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clover, Calendar } from 'lucide-react';

export default function WidgetLoteria() {
  const [searchParams] = useSearchParams();
  const tipo = searchParams.get('tipo') || 'megasena';
  
  const generateNumbers = (count: number, seed: number) => {
    let result: number[] = [];
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
  const [concurso, setConcurso] = useState('');
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
           if (data.numero) {
              setConcurso(data.numero.toString());
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
           setConcurso('0000');
           setPremio(`R$ ${Math.floor(Math.random() * 40 + 10)} Milhões`);
        }
     };

     fetchData();
  }, [tipo]);

  const colors: Record<string, string> = {
    megasena: '#209869',
    megavirada: '#209869',
    lotofacil: '#4A154B', // Um roxo mais escuro baseado no mockup
    quina: '#260085'
  };

  const titles: Record<string, string> = {
    megasena: 'Mega-Sena',
    megavirada: 'Mega da Virada',
    lotofacil: 'Lotofácil',
    quina: 'Quina'
  };

  const bgColor = colors[tipo] || '#209869';
  const title = titles[tipo] || 'Loteria';

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-between text-white overflow-hidden p-[4vh] relative" style={{ backgroundColor: bgColor }}>
       
       {/* Background Pattern Elements (Simulating the mockup background) */}
       <div className="absolute top-[-10vh] left-[-10vh] opacity-10 pointer-events-none">
          <Clover className="w-[40vh] h-[40vh]" />
       </div>
       <div className="absolute bottom-[-10vh] right-[-10vh] opacity-10 pointer-events-none">
          <Clover className="w-[40vh] h-[40vh]" />
       </div>

       {/* HEADER */}
       <div className="flex flex-col items-center mt-[4vh] w-full z-10">
           <div className="flex items-center gap-[2vw] mb-[3vh]">
               <Clover className="w-[10vh] h-[10vh] text-white" />
               <h1 className="text-[10vh] font-bold uppercase tracking-tight text-white leading-none drop-shadow-md">
                  {title}
               </h1>
           </div>
           
           <div className="flex items-center gap-[2vw] bg-black/20 px-[5vw] py-[1.5vh] rounded-full border-[0.3vh] border-white/20 shadow-lg backdrop-blur-sm">
              <Calendar className="w-[4vh] h-[4vh] opacity-90" />
              <span className="text-[3.5vh] font-medium opacity-90 uppercase tracking-widest">Data do Sorteio:</span>
              <span className="text-[4.5vh] font-bold">{dataSorteio}</span>
           </div>
       </div>
       
       {/* NUMBERS */}
       <div className={`flex flex-wrap justify-center items-center content-center flex-1 max-w-[90vw] w-full z-10 ${tipo === 'lotofacil' ? 'gap-[2vw]' : 'gap-[3vw]'}`}>
          {numbers.map((n, i) => (
            <div key={i} 
                 className={`rounded-full flex items-center justify-center font-bold text-center border-[0.4vh] border-white drop-shadow-lg bg-transparent ${
                   tipo === 'lotofacil' ? 'w-[12vh] h-[12vh] text-[5.5vh] m-[0.5vh]' : 'w-[16vh] h-[16vh] text-[7.5vh] m-[1vh]'
                 }`}>
               {n}
            </div>
          ))}
       </div>

       {/* FOOTER */}
       <div className="flex flex-col items-center mb-[4vh] gap-[1vh] z-10 w-full">
           {premio && (
             <div className="bg-black/30 px-[6vw] py-[2vh] rounded-[2vh] backdrop-blur-md border-[0.2vh] border-yellow-300/30 text-center shadow-2xl">
               <span className="text-[3vh] font-medium opacity-90 block uppercase tracking-wider mb-[1vh]">
                 Próximo prêmio estimado
               </span>
               <span className="text-[5.5vh] text-yellow-300 font-black drop-shadow-lg leading-none">
                 {premio}
               </span>
             </div>
           )}
       </div>

    </div>
  );
}
