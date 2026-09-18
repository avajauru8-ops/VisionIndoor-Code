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

function formatDate(date: Date): string {
  const days = ['Domingo', 'Segunda-Feira', 'Terça-Feira', 'Quarta-Feira', 'Quinta-Feira', 'Sexta-Feira', 'Sábado'];
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${days[date.getDay()]}, ${day} de ${month} de ${year}`;
}

function getUrlParam(key: string): string | null {
  const params = new URLSearchParams(window.location.search);
  const val = params.get(key);
  return val && val.trim() !== '' ? val : null;
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function isPortrait() {
  return window.innerHeight > window.innerWidth;
}

export default function WidgetHoraCerta() {
  const [time, setTime] = useState(new Date());
  const [config, setConfig] = useState<WidgetConfig>({});
  const [configLoaded, setConfigLoaded] = useState(false);
  const [portrait, setPortrait] = useState(isPortrait());

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
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleResize = () => setPortrait(isPortrait());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const urlTimezone = getUrlParam('tz');
  const timezone = urlTimezone || config.timezone || 'America/Sao_Paulo';
  const displayTime = getTimeInTimezone(timezone);

  const hours = displayTime.getHours().toString().padStart(2, '0');
  const minutes = displayTime.getMinutes().toString().padStart(2, '0');
  const seconds = displayTime.getSeconds().toString().padStart(2, '0');

  const bgH = getUrlParam('bg_h') || config.imagem_fundo_horizontal || '';
  const bgV = getUrlParam('bg_v') || config.imagem_fundo_vertical || '';
  const logo = getUrlParam('logo') || config.logo || '';
  const hasImages = !!(bgH || bgV);
  const hasLogo = !!logo;
  const bgColor = config.cor_fundo || '#050505';

  const corHora = getUrlParam('cor_hora') || '#ffffff';
  const corSeg = getUrlParam('cor_seg') || '#2d74ff';
  const corData = getUrlParam('cor_data') || '#d0d0d0';
  const corPill = getUrlParam('cor_pill') || '#ffffff';

  if (!configLoaded) {
    return (
      <div style={{ width: '100%', height: '100%', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#666', fontSize: '3vh' }}>Carregando...</div>
      </div>
    );
  }

  const p = portrait;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: bgColor, overflow: 'hidden', color: 'white',
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      {/* Background Image */}
      {hasImages && (
        <>
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            backgroundImage: `url(${bgH})`, backgroundSize: 'cover', backgroundPosition: 'center',
            zIndex: 1, display: p ? 'none' : 'block',
          }} />
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            backgroundImage: `url(${bgV || bgH})`, backgroundSize: 'cover', backgroundPosition: 'center',
            zIndex: 1, display: p ? 'block' : 'none',
          }} />
        </>
      )}

      {!hasImages && (
        <div style={{
          position: 'absolute', width: p ? '100vw' : '60vw', height: p ? '100vw' : '60vw',
          background: 'radial-gradient(circle, rgba(45, 116, 255, 0.15) 0%, transparent 70%)',
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 1,
        }} />
      )}

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 10, width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Logo */}
        {hasLogo && (
          <img src={logo} alt="Logo" style={{
            maxWidth: p ? '35vw' : '22vw',
            maxHeight: p ? '12vh' : '14vh',
            marginTop: 50,
            marginBottom: p ? '6vh' : '4vh',
            objectFit: 'contain',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
          }} />
        )}

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: p ? '2vw' : '1vw',
          marginBottom: p ? '3vh' : '3vh', opacity: 0.8,
        }}>
          <Clock style={{ width: p ? '5vw' : '3.5vh', height: p ? '5vw' : '3.5vh', color: corSeg }} />
          <h2 style={{
            fontSize: p ? '4.5vw' : '3vh', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.25em', color: '#a0a0a0',
          }}>Hora Certa</h2>
        </div>

        {/* Time */}
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'center',
          lineHeight: 1, textShadow: '0 10px 30px rgba(0,0,0,0.5)',
        }}>
          <span style={{
            fontSize: p ? '22vw' : '28vh', fontWeight: 700, letterSpacing: '-0.02em', color: corHora,
          }}>{hours}:{minutes}</span>
          <span style={{
            fontSize: p ? '8vw' : '10vh', fontWeight: 300, color: corSeg, marginLeft: '2vw',
          }}>{seconds}</span>
        </div>

        {/* Date Pill */}
        <div style={{
          marginTop: p ? '6vh' : '4vh',
          background: hexToRgba(corPill, 0.08),
          border: `1px solid ${hexToRgba(corPill, 0.15)}`,
          padding: p ? '3vw 6vw' : '1.8vh 4vw',
          borderRadius: 999,
          backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
        }}>
          <p style={{
            fontSize: p ? '4.5vw' : '3.2vh', fontWeight: 500, color: corData, letterSpacing: '0.04em',
          }}>{formatDate(displayTime)}</p>
        </div>
      </div>
    </div>
  );
}
