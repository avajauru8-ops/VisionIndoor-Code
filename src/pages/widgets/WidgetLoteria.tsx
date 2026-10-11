import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clover, Calendar } from 'lucide-react';
import { loteriaBalls, loteriaColor, loteriaLabel } from '../../lib/loterias';

interface Resultado {
  numbers: string[];
  dataSorteio: string;
  concurso: string;
  premio: string;
  premioLabel: string;
  acumulado: boolean;
  dataProximoConcurso: string;
  proximoConcurso: string;
  trevos: string[];
  timeCoracao: string;
  mesSorte: string;
}

const generateNumbers = (count: number, seed: number) => {
  let result: number[] = [];
  let currentSeed = seed;
  const random = () => {
    const x = Math.sin(currentSeed++) * 10000;
    return x - Math.floor(x);
  };
  while (result.length < count) {
    const num = Math.floor(random() * 60) + 1;
    if (!result.includes(num)) result.push(num);
  }
  return result.sort((a, b) => a - b).map(n => n.toString().padStart(2, '0'));
};

function formatPrize(valor: number): string {
  if (valor >= 1000000) {
    return `R$ ${(valor / 1000000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} Milhões`;
  }
  if (valor >= 1000) {
    return `R$ ${(valor / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} Mil`;
  }
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function pickNumbers(data: any): string[] {
  const order = [
    data.dezenasOrdemSorteio,
    data.dezenasSorteadasOrdemSorteio,
    data.dezenas,
    data.listaDezenas
  ].find((list: any) => Array.isArray(list) && list.length > 0);

  if (!order) return [];

  const numbers = order.map((n: any) => String(n));

  // +Milionária: as dezenas vêm na ordem do sorteio e os trevos no final
  const trevos = Array.isArray(data.trevos) ? data.trevos.length : 0;
  const sorted = Array.isArray(data.dezenas) ? data.dezenas.length : 0;
  if (trevos > 0 && sorted > 0 && numbers.length === sorted + trevos) {
    return numbers.slice(0, sorted);
  }

  return numbers;
}

function applyData(data: any): Partial<Resultado> | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;

  const update: Partial<Resultado> = {};
  const numbers = pickNumbers(data);
  if (numbers.length > 0) update.numbers = numbers;

  const dataSorteio = data.data || data.dataApuracao;
  if (dataSorteio) update.dataSorteio = String(dataSorteio);

  const concurso = data.concurso ?? data.numero;
  if (concurso) update.concurso = String(concurso);

  const valor = Number(data.valorEstimadoProximoConcurso) || 0;
  update.premio = '';
  update.premioLabel = 'Próximo prêmio estimado';
  if (valor > 0) {
    update.premio = formatPrize(valor);
  } else if (Array.isArray(data.premiacoes) && data.premiacoes.length > 0) {
    const best = data.premiacoes.reduce((a: any, b: any) =>
      (Number(b.valorPremio) || 0) > (Number(a.valorPremio) || 0) ? b : a);
    if (Number(best.valorPremio) > 0) {
      update.premio = formatPrize(Number(best.valorPremio));
      update.premioLabel = 'Maior prêmio pago';
    }
  }

  const acumulou = typeof data.acumulou !== 'undefined' ? data.acumulou : data.acumulado;
  if (typeof acumulou !== 'undefined') update.acumulado = !!acumulou;

  if (data.dataProximoConcurso) update.dataProximoConcurso = String(data.dataProximoConcurso);

  const proximoConcurso = data.proximoConcurso;
  if (proximoConcurso !== null && typeof proximoConcurso !== 'undefined' && proximoConcurso !== '') {
    update.proximoConcurso = String(proximoConcurso);
  }

  if (Array.isArray(data.trevos) && data.trevos.length > 0) {
    update.trevos = data.trevos.map((t: any) => String(t));
  }
  if (data.timeCoracao) update.timeCoracao = String(data.timeCoracao);
  if (data.mesSorte) update.mesSorte = String(data.mesSorte);

  return Object.keys(update).length > 0 ? update : null;
}

function getFallback(tipo: string): Resultado {
  const today = new Date();
  const seed = today.getFullYear() * 1000 + today.getMonth() * 100 + today.getDate() + tipo.length;
  const count = loteriaBalls(tipo);
  return {
    numbers: generateNumbers(count, seed),
    dataSorteio: today.toLocaleDateString('pt-BR'),
    concurso: '0000',
    premio: `R$ ${Math.floor(Math.random() * 40 + 10)} Milhões`,
    premioLabel: 'Próximo prêmio estimado',
    acumulado: false,
    dataProximoConcurso: '',
    proximoConcurso: '',
    trevos: [],
    timeCoracao: '',
    mesSorte: ''
  };
}

function getWidgetConfig(): Record<string, string> {
  const encoded = new URLSearchParams(window.location.search).get('widget_config');
  if (encoded) {
    try { return JSON.parse(atob(encoded)); } catch (_) {}
  }
  return {};
}

export default function WidgetLoteria() {
  const [searchParams] = useSearchParams();
  const configTipo = getWidgetConfig()['tipo'];
  const tipo = configTipo || searchParams.get('tipo') || 'megasena';

  const [resultado, setResultado] = useState<Resultado>(() => getFallback(tipo));

  useEffect(() => {
    setResultado(getFallback(tipo));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const merge = (raw: any) => {
      const update = applyData(raw);
      if (update) setResultado(prev => ({ ...prev, ...update }));
    };

    const fetchData = async () => {
      try {
        const cached = localStorage.getItem(`loteria_${tipo}`);
        if (cached) {
          try { merge(JSON.parse(cached)); } catch (_) {}
        }

        const response = await fetch(`/api/loteria?tipo=${encodeURIComponent(tipo)}`, { signal: controller.signal });
        if (!response.ok) throw new Error('API request failed');
        const data = await response.json();

        merge(data);
        localStorage.setItem(`loteria_${tipo}`, JSON.stringify(data));
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.warn('Loteria API timeout, usando fallback');
          return;
        }
        console.error('Erro ao carregar loteria:', error);
        const cached = localStorage.getItem(`loteria_${tipo}`);
        if (cached) {
          try { merge(JSON.parse(cached)); } catch (_) {}
        }
      } finally {
        clearTimeout(timeoutId);
      }
    };

    fetchData();
    return () => { controller.abort(); clearTimeout(timeoutId); };
  }, [tipo]);

  const bgColor = loteriaColor(tipo);
  const title = loteriaLabel(tipo);

  const { numbers, dataSorteio, concurso, premio, premioLabel, acumulado, dataProximoConcurso, proximoConcurso, trevos, timeCoracao, mesSorte } = resultado;

  const nextDrawInfo = [
    proximoConcurso ? `Próximo concurso: ${proximoConcurso}` : '',
    dataProximoConcurso ? `Sorteio em: ${dataProximoConcurso}` : ''
  ].filter(Boolean).join('  •  ');

  const hasWideNumbers = numbers.some(n => n.length >= 5);
  const sizeClass = hasWideNumbers
    ? 'sz-wide'
    : numbers.length <= 6
      ? 'sz-lg'
      : numbers.length <= 15
        ? 'sz-md'
        : numbers.length <= 20
          ? 'sz-sm'
          : 'sz-xs';

  const hasExtras = trevos.length > 0 || !!timeCoracao || !!mesSorte;

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
         .wl-header-title { font-size: 9vh; font-weight: bold; text-transform: uppercase; letter-spacing: -0.025em; color: white; line-height: 1; text-shadow: 0 4px 6px rgba(0,0,0,0.3); margin: 0; text-align: center; }

         .wl-date-container { display: flex; align-items: center; gap: 2vw; background-color: rgba(0,0,0,0.2); padding: 1.5vh 5vw; border-radius: 9999px; border: 0.3vh solid rgba(255,255,255,0.2); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); }
         .wl-date-icon { width: 4vh; height: 4vh; opacity: 0.9; }
         .wl-date-label { font-size: 3.5vh; font-weight: 500; opacity: 0.9; text-transform: uppercase; letter-spacing: 0.1em; }
         .wl-date-value { font-size: 4.5vh; font-weight: bold; }

         .wl-numbers-container { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; align-content: center; flex: 1; max-width: 92vw; width: 100%; gap: 1.5vh; z-index: 10; padding: 1vh 0; }

         .wl-number-ball { border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; text-align: center; border: 0.4vh solid white; filter: drop-shadow(0 10px 8px rgba(0,0,0,0.2)); background-color: transparent; line-height: 1; }
         .wl-number-ball.sz-lg { width: 15vh; height: 15vh; font-size: 7vh; }
         .wl-number-ball.sz-md { width: 11vh; height: 11vh; font-size: 5vh; border-width: 0.35vh; }
         .wl-number-ball.sz-sm { width: 8vh; height: 8vh; font-size: 3.8vh; border-width: 0.3vh; }
         .wl-number-ball.sz-xs { width: 5.5vh; height: 5.5vh; font-size: 2.7vh; border-width: 0.25vh; }
         .wl-number-ball.sz-wide { width: auto; min-width: 11vh; height: 7vh; padding: 0 1.5vh; font-size: 4vh; border-radius: 1.2vh; }

         .wl-extras { display: flex; flex-wrap: wrap; justify-content: center; gap: 1.5vh; width: 100%; z-index: 10; margin-top: 1vh; }
         .wl-chip { display: inline-flex; align-items: center; gap: 1vh; background-color: rgba(0,0,0,0.25); border: 0.2vh solid rgba(255,255,255,0.25); padding: 1vh 2.5vh; border-radius: 9999px; font-size: 3vh; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
         .wl-chip strong { color: #fde047; }

         .wl-footer { display: flex; flex-direction: column; align-items: center; margin-bottom: 4vh; gap: 1vh; z-index: 10; width: 100%; }
         .wl-prize-container { background-color: rgba(0,0,0,0.3); padding: 2vh 6vw; border-radius: 2vh; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 0.2vh solid rgba(253,224,71,0.3); text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
         .wl-prize-label { font-size: 3vh; font-weight: 500; opacity: 0.9; display: block; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1vh; }
         .wl-prize-value { font-size: 5.5vh; color: #fde047; font-weight: 900; filter: drop-shadow(0 4px 3px rgba(0,0,0,0.3)); line-height: 1; }
         .wl-next-draw { display: block; font-size: 2.6vh; margin-top: 1vh; padding: 1vh 3vw; background-color: rgba(0,0,0,0.25); border: 0.2vh solid rgba(255,255,255,0.2); border-radius: 9999px; opacity: 0.95; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; }
         .wl-acumulou-badge { background-color: #e74c3c; color: white; font-weight: 900; padding: 0.8vh 3vw; border-radius: 1.5vh; font-size: 4vh; text-transform: uppercase; letter-spacing: 0.1em; animation: pulse 2s infinite; box-shadow: 0 4px 10px rgba(231,76,60,0.4); margin-bottom: 1.5vh; }

         @keyframes pulse {
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
           .wl-header-title { font-size: 6.5vh; }
           .wl-date-container { padding: 1.5vh 6vw; gap: 3vw; flex-direction: column; border-radius: 2vh; text-align: center; }
           .wl-date-icon { width: 3.5vh; height: 3.5vh; margin-bottom: -1vh; }
           .wl-date-label { font-size: 2.5vh; }
           .wl-date-value { font-size: 3.5vh; }
           .wl-numbers-container { max-width: 95vw; gap: 1.2vh; }
           .wl-number-ball.sz-lg { width: 17vw; height: 17vw; font-size: 8vw; border-width: 0.3vh; }
           .wl-number-ball.sz-md { width: 15vw; height: 15vw; font-size: 6.5vw; border-width: 0.3vh; }
           .wl-number-ball.sz-sm { width: 12vw; height: 12vw; font-size: 5.5vw; border-width: 0.25vh; }
           .wl-number-ball.sz-xs { width: 9vw; height: 9vw; font-size: 4.5vw; border-width: 0.2vh; }
           .wl-number-ball.sz-wide { min-width: 20vw; height: 9vw; font-size: 5vw; padding: 0 2vw; }
           .wl-chip { font-size: 2.2vh; padding: 0.8vh 3vw; }
           .wl-footer { margin-bottom: 2vh; }
           .wl-prize-container { padding: 2vh 5vw; border-radius: 1.5vh; width: 90%; }
           .wl-prize-label { font-size: 2.2vh; margin-bottom: 0.5vh; }
           .wl-prize-value { font-size: 4vh; }
           .wl-next-draw { font-size: 1.9vh; margin-top: 0.8vh; padding: 0.8vh 3vw; }
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
       <div className="wl-numbers-container">
          {numbers.map((n, i) => (
            <div key={i} className={`wl-number-ball ${sizeClass}`}>
               {n}
            </div>
          ))}
       </div>

       {hasExtras && (
         <div className="wl-extras">
            {trevos.length > 0 && (
              <span className="wl-chip">Trevo: <strong>{trevos.join(' • ')}</strong></span>
            )}
            {timeCoracao && (
              <span className="wl-chip">Time do Coração: <strong>{timeCoracao}</strong></span>
            )}
            {mesSorte && (
              <span className="wl-chip">Mês da Sorte: <strong>{mesSorte}</strong></span>
            )}
         </div>
       )}

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
                 {premioLabel}
               </span>
               <span className="wl-prize-value">
                 {premio}
               </span>
             </div>
           )}
           {nextDrawInfo && (
             <span className="wl-next-draw">
               {nextDrawInfo}
             </span>
           )}
        </div>

    </div>
  );
}
