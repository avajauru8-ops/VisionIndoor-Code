import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface WidgetConfig {
  timezone?: string;
  cor_fundo?: string;
  imagem_fundo_horizontal?: string;
  imagem_fundo_vertical?: string;
  logo?: string;
}

function getTimeInTimezone(tz: string): Date {
  try {
    const now = new Date();
    const str = now.toLocaleString('en-US', { timeZone: tz });
    return new Date(str);
  } catch {
    return new Date();
  }
}

function formatDateDDMMYYYY(date: Date): string {
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${days[date.getDay()]}, ${day} de ${months[date.getMonth()]} de ${year}`;
}

function getUrlParam(key: string): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

export default function WidgetHoraCerta() {
  const [time, setTime] = useState(new Date());
  const [config, setConfig] = useState<WidgetConfig>({});
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/widget-config/horacerta')
      .then(res => res.json())
      .then(data => {
        setConfig(data || {});
        setConfigLoaded(true);
      })
      .catch(() => {
        setConfig({});
        setConfigLoaded(true);
      });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const urlTimezone = getUrlParam('tz');
  const timezone = urlTimezone || config.timezone || 'America/Sao_Paulo';
  const displayTime = getTimeInTimezone(timezone);

  const hours = displayTime.getHours().toString().padStart(2, '0');
  const minutes = displayTime.getMinutes().toString().padStart(2, '0');
  const seconds = displayTime.getSeconds().toString().padStart(2, '0');

  const hasImages = !!(config.imagem_fundo_horizontal || config.imagem_fundo_vertical);
  const hasLogo = !!config.logo;
  const bgColor = config.cor_fundo || '#050505';

  if (!configLoaded) {
    return (
      <div style={{ width: '100%', height: '100%', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#666', fontSize: '3vh' }}>Carregando...</div>
      </div>
    );
  }

  return (
    <div className="whc-container">
      <style dangerouslySetInnerHTML={{
        __html: `
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
        .whc-container {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          color: white; overflow: hidden;
          background-color: ${bgColor};
          ${hasImages ? '' : `background: radial-gradient(circle at center, #1a1a1a 0%, ${bgColor} 100%);`}
        }
        .whc-bg-image {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          pointer-events: none;
        }
        .whc-bg-glow {
          position: absolute;
          width: 60vw; height: 60vw;
          background: radial-gradient(circle, rgba(45, 116, 255, 0.15) 0%, transparent 70%);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .whc-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .whc-logo {
          max-width: 20vw;
          max-height: 12vh;
          margin-bottom: 3vh;
          object-fit: contain;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
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

        /* Portrait overrides */
        @media (orientation: portrait) {
          .whc-bg-glow { width: 100vw; height: 100vw; }
          .whc-header-icon { width: 6vw; height: 6vw; }
          .whc-header-title { font-size: 5vw; }
          .whc-hours-mins { font-size: 20vw; }
          .whc-seconds { font-size: 8vw; margin-left: 2vw; }
          .whc-date-box { margin-top: 6vw; padding: 3vw 6vw; }
          .whc-date-text { font-size: 5vw; }
          .whc-logo { max-width: 30vw; max-height: 10vh; }
        }
        `}} />

      {/* Background Image */}
      {hasImages && (
        <>
          <div 
            className="whc-bg-image hidden md:block"
            style={{ backgroundImage: `url(${config.imagem_fundo_horizontal})` }}
          />
          <div 
            className="whc-bg-image block md:hidden"
            style={{ backgroundImage: `url(${config.imagem_fundo_vertical || config.imagem_fundo_horizontal})` }}
          />
        </>
      )}

      {!hasImages && <div className="whc-bg-glow" />}

      <div className="whc-content">
        {/* Logo */}
        {hasLogo && (
          <img src={config.logo} alt="Logo" className="whc-logo" />
        )}

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
            <p className="whc-date-text">{formatDateDDMMYYYY(displayTime)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
