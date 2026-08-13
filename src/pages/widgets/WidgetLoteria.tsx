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
  const [acumulado, setAcumulado] = useState(false);
  const [dataProximoConcurso, setDataProximoConcurso] = useState('');
  
  useEffect(() => {
     const fetchData = async () => {
        try {
           const response = await fetch(`/api/loteria?tipo=${tipo}`);
           if (!response.ok) throw new Error('API request failed');
           const data = await response.json();
           
           if (data.dezenasSorteadasOrdemSorteio && data.dezenasSorteadasOrdemSorteio.length > 0) {
              setNumbers(data.dezenasSorteadasOrdemSorteio);
           } else if (data.listaDezenas) {
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
           if (typeof data.acumulado !== 'undefined') setAcumulado(data.acumulado);
           if (data.dataProximoConcurso) setDataProximoConcurso(data.dataProximoConcurso);
           
           localStorage.setItem(`loteria_${tipo}`, JSON.stringify(data));
        } catch (error) {
           console.error('Erro ao carregar loteria:', error);
           
           const cached = localStorage.getItem(`loteria_${tipo}`);
           if (cached) {
              try {
                 const data = JSON.parse(cached);
                 if (data.dezenasSorteadasOrdemSorteio && data.dezenasSorteadasOrdemSorteio.length > 0) {
                    setNumbers(data.dezenasSorteadasOrdemSorteio);
                 } else if (data.listaDezenas) setNumbers(data.listaDezenas);
                 
                 if (data.dataApuracao) setDataSorteio(data.dataApuracao);
                 if (data.numero) setConcurso(data.numero.toString());
                 if (data.valorEstimadoProximoConcurso) {
                    const valorFormatado = (data.valorEstimadoProximoConcurso / 1000000).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
                    setPremio(`R$ ${valorFormatado} Milhões`);
                 }
                 if (typeof data.acumulado !== 'undefined') setAcumulado(data.acumulado);
                 if (data.dataProximoConcurso) setDataProximoConcurso(data.dataProximoConcurso);
                 return;
              } catch (e) {
                 console.error('Erro parse cache loteria', e);
              }
           }
           
           // Fallback para valores simulados em caso de erro da API e sem cache
           const today = new Date();
           const seed = today.getFullYear() * 1000 + today.getMonth() * 100 + today.getDate() + (tipo === 'megasena' ? 1 : 2);
           setNumbers(generateNumbers(tipo === 'lotofacil' ? 15 : tipo === 'quina' ? 5 : 6, seed));
           setDataSorteio(today.toLocaleDateString('pt-BR'));
           setConcurso('0000');
           setPremio(`R$ ${Math.floor(Math.random() * 40 + 10)} Milhões`);
           setAcumulado(true);
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

  const isLotofacil = tipo === 'lotofacil';

  return (
    <div className="wl-container" style={{ backgroundColor: bgColor }}>
       <style dangerouslySetInnerHTML={{__html: `
         * {
           box-sizing: border-box;
           margin: 0;
           padding: 0;
         }
         html, body, #root {
           width: 100%; height: 100%;
           background-color: ${bgColor};
           overflow: hidden;
         }
         .wl-container {
           position: absolute;
           top: 0; left: 0;
           width: 100%; height: 100%;
           display: flex; flex-direction: column;
           align-items: center; justify-content: space-between;
           color: white; overflow: hidden;
           padding: 4vh;
         }
         .wl-bg-top { position: absolute; top: -10vh; left: -10vh; opacity: 0.1; pointer-events: none; }
         .wl-bg-bottom { position: absolute; bottom: -10vh; right: -10vh; opacity: 0.1; pointer-events: none; }
         .wl-bg-icon { width: 40vh; height: 40vh; }
         
         .wl-header { display: flex; flex-direction: column; align-items: center; margin-top: 4vh; width: 100%; z-index: 10; }
         .wl-header-title-container { display: flex; align-items: center; gap: 2vw; margin-bottom: 3vh; }
         .wl-header-icon { width: 10vh; height: 10vh; color: white; }
         .wl-header-title { font-size: 10vh; font-weight: bold; text-transform: uppercase; letter-spacing: -0.025em; color: white; line-height: 1; text-shadow: 0 4px 6px rgba(0,0,0,0.3); margin: 0; text-align: center; }
         
         .wl-date-container { display: flex; align-items: center; gap: 2vw; background-color: rgba(0,0,0,0.2); padding: 1.5vh 5vw; border-radius: 9999px; border: 0.3vh solid rgba(255,255,255,0.2); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); }
         .wl-date-icon { width: 4vh; height: 4vh; opacity: 0.9; }
         .wl-date-label { font-size: 3.5vh; font-weight: 500; opacity: 0.9; text-transform: uppercase; letter-spacing: 0.1em; }
         .wl-date-value { font-size: 4.5vh; font-weight: bold; }
         
         .wl-numbers-container { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; align-content: center; flex: 1; max-width: 90vw; width: 100%; z-index: 10; }
         .wl-numbers-container.lotofacil { gap: 2vw; }
         .wl-numbers-container.default { gap: 3vw; }
         
         .wl-number-ball { border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; text-align: center; border: 0.4vh solid white; filter: drop-shadow(0 10px 8px rgba(0,0,0,0.2)); background-color: transparent; }
         .wl-number-ball.lotofacil { width: 12vh; height: 12vh; font-size: 5.5vh; margin: 0.5vh; }
         .wl-number-ball.default { width: 16vh; height: 16vh; font-size: 7.5vh; margin: 1vh; }
         
         .wl-footer { display: flex; flex-direction: column; align-items: center; margin-bottom: 4vh; gap: 1vh; z-index: 10; width: 100%; }
         .wl-prize-container { background-color: rgba(0,0,0,0.3); padding: 2vh 6vw; border-radius: 2vh; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 0.2vh solid rgba(253,224,71,0.3); text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
         .wl-prize-label { font-size: 3vh; font-weight: 500; opacity: 0.9; display: block; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1vh; }
         .wl-prize-value { font-size: 5.5vh; color: #fde047; font-weight: 900; filter: drop-shadow(0 4px 3px rgba(0,0,0,0.3)); line-height: 1; }
         .wl-next-date { display: block; font-size: 2.2vh; margin-top: 1vh; opacity: 0.8; font-weight: bold; text-transform: uppercase; }
         .wl-acumulou-badge { background-color: #e74c3c; color: white; font-weight: 900; padding: 0.8vh 3vw; border-radius: 1.5vh; font-size: 4vh; text-transform: uppercase; letter-spacing: 0.1em; animation: pulse 2s infinite; box-shadow: 0 4px 10px rgba(231,76,60,0.4); margin-bottom: 1.5vh; }
         .wl-acumulou-badge.saiu { background-color: #27ae60; box-shadow: 0 4px 10px rgba(39, 174, 96, 0.4); animation: pulse-success 2s infinite; }
         
         @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.9; }
            100% { transform: scale(1); opacity: 1; }
         }

         @keyframes pulse-success {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.9; }
            100% { transform: scale(1); opacity: 1; }
         }
         
         @media (orientation: portrait) {
           .wl-container { padding: 3vh 4vw; }
           .wl-bg-icon { width: 25vh; height: 25vh; }
           .wl-bg-top { top: -5vh; left: -5vh; }
           .wl-bg-bottom { bottom: -5vh; right: -5vh; }
           .wl-header { margin-top: 2vh; }
           .wl-header-title-container { gap: 4vw; margin-bottom: 2vh; }
           .wl-header-icon { width: 8vh; height: 8vh; }
           .wl-header-title { font-size: 7vh; }
           .wl-date-container { padding: 1.5vh 6vw; gap: 3vw; flex-direction: column; border-radius: 2vh; text-align: center; }
           .wl-date-icon { width: 3.5vh; height: 3.5vh; margin-bottom: -1vh; }
           .wl-date-label { font-size: 2.5vh; }
           .wl-date-value { font-size: 3.5vh; }
           .wl-numbers-container { max-width: 95vw; }
           .wl-numbers-container.lotofacil { gap: 3vw; }
           .wl-numbers-container.default { gap: 4vw; }
           .wl-number-ball.lotofacil { width: 14vw; height: 14vw; font-size: 6.5vw; margin: 1vw; border-width: 0.3vh; }
           .wl-number-ball.default { width: 20vw; height: 20vw; font-size: 10vw; margin: 2vw; border-width: 0.4vh; }
           .wl-footer { margin-bottom: 2vh; }
           .wl-prize-container { padding: 2vh 5vw; border-radius: 1.5vh; width: 90%; }
           .wl-prize-label { font-size: 2.2vh; margin-bottom: 0.5vh; }
           .wl-prize-value { font-size: 4vh; }
           .wl-next-date { font-size: 1.8vh; margin-top: 0.8vh; }
           .wl-acumulou-badge { font-size: 3vh; padding: 0.6vh 4vw; border-radius: 1vh; }
         }
       `}} />
       
       {/* Background Pattern Elements */}
       <div className="wl-bg-top">
          <Clover className="wl-bg-icon" />
       </div>
       <div className="wl-bg-bottom">
          <Clover className="wl-bg-icon" />
       </div>

       {/* HEADER */}
       <div className="wl-header">
           <div className="wl-header-title-container">
               <Clover className="wl-header-icon" />
               <h1 className="wl-header-title">
                  {title}
               </h1>
           </div>
           
            <div className="wl-date-container">
               <Calendar className="wl-date-icon" />
               <span className="wl-date-label">Concurso {concurso}</span>
               <span className="wl-date-value">{dataSorteio}</span>
            </div>
       </div>
       
       {/* NUMBERS */}
       <div className={`wl-numbers-container ${isLotofacil ? 'lotofacil' : 'default'}`}>
          {numbers.map((n, i) => (
            <div key={i} className={`wl-number-ball ${isLotofacil ? 'lotofacil' : 'default'}`}>
               {n}
            </div>
          ))}
       </div>

        {/* FOOTER */}
        <div className="wl-footer">
            {acumulado && (
              <div className="wl-acumulou-badge">
                Acumulou!
              </div>
            )}
            {premio && (
             <div className="wl-prize-container">
               <span className="wl-prize-label">
                 Próximo prêmio estimado
               </span>
               <span className="wl-prize-value">
                 {premio}
               </span>
               {dataProximoConcurso && (
                 <span className="wl-next-date">
                   Sorteio em: {dataProximoConcurso}
                 </span>
               )}
             </div>
           )}
       </div>

    </div>
  );
}
