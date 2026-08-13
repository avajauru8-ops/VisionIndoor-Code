import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function WidgetHoraCerta() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // Sincronização offline: apenas usamos o setInterval com o Date do dispositivo
    // O JavaScript/Navegador/WebView já pega a hora do SO (que é precisa se conectada ou a melhor possível offline)
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return { hours, minutes, seconds };
  };

  const formatDate = (date: Date) => {
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
  };

  const { hours, minutes, seconds } = formatTime(time);

  return (
    <div className="whc-container">
      <style dangerouslySetInnerHTML={{__html: `
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        html, body, #root {
          width: 100%; height: 100%;
          background-color: #050505;
          overflow: hidden;
        }
        .whc-container {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          color: white; overflow: hidden;
          background: radial-gradient(circle at center, #1a1a1a 0%, #000000 100%);
        }
        .whc-bg-glow {
          position: absolute;
          width: 60vw; height: 60vw;
          background: radial-gradient(circle, rgba(45, 116, 255, 0.15) 0%, transparent 70%);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .whc-clock-box {
          display: flex; flex-direction: column; align-items: center; z-index: 10;
        }
        .whc-header {
          display: flex; align-items: center; gap: 1vw; margin-bottom: 2vh;
          opacity: 0.8;
        }
        .whc-header-icon {
          width: 4vh; height: 4vh; color: #2d74ff;
        }
        .whc-header-title {
          font-size: 3vh; font-weight: 600; text-transform: uppercase; letter-spacing: 0.2em;
          color: #a0a0a0;
        }
        .whc-time {
          display: flex; align-items: baseline; justify-content: center;
          font-family: 'JetBrains Mono', monospace;
          line-height: 1; text-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .whc-hours-mins {
          font-size: 28vh; font-weight: 700; letter-spacing: -0.02em;
        }
        .whc-seconds {
          font-size: 10vh; font-weight: 300; color: #2d74ff; margin-left: 2vw;
        }
        .whc-date-box {
          margin-top: 4vh; background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255,255,255,0.05);
          padding: 2vh 4vw; border-radius: 999px;
          backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .whc-date-text {
          font-size: 4vh; font-weight: 400; color: #d0d0d0;
          text-transform: capitalize; letter-spacing: 0.05em;
        }
      `}} />
      
      <div className="whc-bg-glow" />

      <div className="whc-clock-box">
        <div className="whc-header">
          <Clock className="whc-header-icon" />
          <h2 className="whc-header-title">Hora Certa</h2>
        </div>
        
        <div className="whc-time">
          <span className="whc-hours-mins">{hours}:{minutes}</span>
          <span className="whc-seconds">{seconds}</span>
        </div>

        <div className="whc-date-box">
          <p className="whc-date-text">{formatDate(time)}</p>
        </div>
      </div>
    </div>
  );
}
