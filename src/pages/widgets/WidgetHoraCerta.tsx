import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface WidgetConfig {
  timezone?: string;
  cor_fundo?: string;
  imagem_fundo_horizontal?: string;
  imagem_fundo_vertical?: string;
  logo?: string;
  fonte_data?: string;
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

function formatDate(date: Date): string {
  const days = ['Domingo', 'Segunda-Feira', 'Terça-Feira', 'Quarta-Feira', 'Quinta-Feira', 'Sexta-Feira', 'Sábado'];
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
}

function getUrlParam(key: string): string | null {
  const params = new URLSearchParams(window.location.search);
  const val = params.get(key);
  return val && val.trim() !== '' ? val : null;
}

function getWidgetConfig(): Record<string, string> {
  const encoded = getUrlParam('widget_config');
  if (encoded) {
    try {
      return JSON.parse(atob(encoded));
    } catch {}
  }
  return {};
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function WidgetHoraCerta() {
  const [time, setTime] = useState(new Date());
  const [config, setConfig] = useState<WidgetConfig>({});
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/widget-config/horacerta')
      .then(res => res.json())
      .then(data => { setConfig(data || {}); setConfigLoaded(true); })
      .catch(() => { setConfig({}); setConfigLoaded(true); });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const wc = getWidgetConfig();
  const timezone = wc.tz || getUrlParam('tz') || config.timezone || 'America/Sao_Paulo';
  const displayTime = getTimeInTimezone(timezone);
  const hours = displayTime.getHours().toString().padStart(2, '0');
  const minutes = displayTime.getMinutes().toString().padStart(2, '0');
  const seconds = displayTime.getSeconds().toString().padStart(2, '0');

  const bgH = wc.bg_h || getUrlParam('bg_h') || config.imagem_fundo_horizontal || '';
  const bgV = wc.bg_v || getUrlParam('bg_v') || config.imagem_fundo_vertical || '';
  const logoUrl = wc.logo || getUrlParam('logo') || config.logo || '';
  const hasImages = !!(bgH || bgV);
  const hasLogo = !!logoUrl;
  const bgColor = config.cor_fundo || '#050505';

  const corHora = wc.cor_hora || getUrlParam('cor_hora') || '#ffffff';
  const corSeg = wc.cor_seg || getUrlParam('cor_seg') || '#2d74ff';
  const corData = wc.cor_data || getUrlParam('cor_data') || '#d0d0d0';
  const corPill = wc.cor_pill || getUrlParam('cor_pill') || '#ffffff';
  const fontSizeData = wc.fonte_data || getUrlParam('fonte_data') || config.fonte_data || '';

  if (!configLoaded) {
    return (
      <div className="whc-loading">
        <style dangerouslySetInnerHTML={{ __html: `
          .whc-loading { width:100%; height:100%; background:#050505; display:flex; align-items:center; justify-content:center; }
        `}} />
        <div style={{ color: '#666', fontSize: '3vh' }}>Carregando...</div>
      </div>
    );
  }

  return (
    <div className="whc-root">
      <style dangerouslySetInnerHTML={{ __html: `
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { width: 100%; height: 100%; background: ${bgColor}; overflow: hidden; }

        .whc-root {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          color: white; overflow: hidden; background: ${bgColor};
          font-family: 'JetBrains Mono', monospace;
        }
        .whc-bg {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          background-size: cover; background-position: center; background-repeat: no-repeat;
          z-index: 1; pointer-events: none;
        }
        .whc-bg-h { display: block; }
        .whc-bg-v { display: none; }
        @media (max-aspect-ratio: 1/1) {
          .whc-bg-h { display: none; }
          .whc-bg-v { display: block; }
        }

        .whc-glow {
          position: absolute; width: 60vw; height: 60vw;
          background: radial-gradient(circle, rgba(45,116,255,0.15) 0%, transparent 70%);
          top: 50%; left: 50%; transform: translate(-50%,-50%);
          pointer-events: none; z-index: 1;
        }

        .whc-content {
          position: relative; z-index: 10;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          width: 100%; height: 100%;
          padding: 2vh 4vw;
        }

        .whc-logo {
          max-width: 20vw; max-height: 14vh; margin-top: 50px; margin-bottom: 3vh;
          object-fit: contain; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
        }
        .whc-header {
          display: flex; align-items: center; gap: 1vw; margin-bottom: 2vh; opacity: 0.8;
        }
        .whc-header-icon { width: 3.5vh; height: 3.5vh; }
        .whc-header-title {
          font-size: 3vh; font-weight: 600; text-transform: uppercase; letter-spacing: 0.25em; color: #a0a0a0;
        }
        .whc-time {
          display: flex; align-items: baseline; justify-content: center; line-height: 1;
          text-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .whc-hours-mins { font-size: 28vh; font-weight: 700; letter-spacing: -0.02em; }
        .whc-seconds { font-size: 10vh; font-weight: 300; margin-left: 2vw; }
        .whc-date-box {
          margin-top: 4vh; padding: 1.8vh 4vw; border-radius: 999px;
          backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.15);
        }
        .whc-date-text { font-weight: 500; letter-spacing: 0.04em; }

        @media (max-aspect-ratio: 1/1) {
          .whc-logo { max-width: 35vw; max-height: 10vh; margin-top: 50px; margin-bottom: 4vh; }
          .whc-header { gap: 2vw; margin-bottom: 3vh; }
          .whc-header-icon { width: 5vw; height: 5vw; }
          .whc-header-title { font-size: 4.5vw; }
          .whc-hours-mins { font-size: 24vw; }
          .whc-seconds { font-size: 9vw; margin-left: 2vw; }
          .whc-date-box { margin-top: 5vh; padding: 3vw 6vw; }
        }
      `}} />

      {/* Background Images */}
      {hasImages && (
        <>
          <div className="whc-bg whc-bg-h" style={{ backgroundImage: `url(${bgH})` }} />
          <div className="whc-bg whc-bg-v" style={{ backgroundImage: `url(${bgV || bgH})` }} />
        </>
      )}

      {!hasImages && <div className="whc-glow" />}

      <div className="whc-content">
        {hasLogo && <img src={logoUrl} alt="Logo" className="whc-logo" />}

        <div className="whc-header">
          <Clock className="whc-header-icon" style={{ color: corSeg }} />
          <h2 className="whc-header-title">Hora Certa</h2>
        </div>

        <div className="whc-time">
          <span className="whc-hours-mins" style={{ color: corHora }}>{hours}:{minutes}</span>
          <span className="whc-seconds" style={{ color: corSeg }}>{seconds}</span>
        </div>

        <div className="whc-date-box" style={{
          background: hexToRgba(corPill, 0.08),
          border: `1px solid ${hexToRgba(corPill, 0.15)}`,
        }}>
          <p className="whc-date-text" style={{ color: corData, fontSize: fontSizeData || undefined }}>{formatDate(displayTime)}</p>
        </div>
      </div>
    </div>
  );
}
