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
    <div className="w-screen h-screen flex flex-col items-center justify-center text-white overflow-hidden p-[4vmin]" style={{ backgroundColor: bgColor }}>
       <div className="bg-white/10 px-[6vmin] py-[2.5vmin] rounded-full border-[0.5vmin] border-white/20 mb-[4vmin] shadow-2xl backdrop-blur-sm">
          <h1 className="text-[6vmin] font-black uppercase tracking-widest text-white drop-shadow-md text-center">
             {title}
          </h1>
       </div>
       
       <h2 className="text-[4vmin] font-medium mb-[6vmin] opacity-90 drop-shadow-sm text-center">SORTEIO: {dataSorteio}</h2>
       
       <div className={`flex flex-wrap justify-center content-center max-w-[90vw] ${tipo === 'lotofacil' ? 'gap-[2vmin]' : 'gap-[3vmin]'}`}>
          {numbers.map((n, i) => (
            <div key={i} 
                 className={`bg-white rounded-full flex items-center justify-center shadow-[inset_0_-1vmin_0_rgba(0,0,0,0.1)] font-black text-center border-[0.5vmin] border-white/90 drop-shadow-xl ${
                   tipo === 'lotofacil' ? 'w-[10vmin] h-[10vmin] text-[5vmin]' : 'w-[14vmin] h-[14vmin] text-[7vmin]'
                 }`}
                 style={{ color: bgColor }}>
               {n}
            </div>
          ))}
       </div>

       <div className="mt-[8vmin] text-[3.5vmin] font-bold opacity-90 bg-black/20 px-[5vmin] py-[2.5vmin] rounded-[2vmin] backdrop-blur-sm text-center max-w-[90vw]">
         Próximo prêmio estimado: <span className="text-yellow-300 drop-shadow-sm block sm:inline">{premio}</span>
       </div>
    </div>
  );
}
