import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Widget YouTube – Digital Signage
 * Query params:
 *   ?url=https://www.youtube.com/watch?v=XXXXXXXXXXX  (URL completa ou ID direto)
 *   &autoplay=1    (padrão: 1)
 *   &mute=1        (padrão: 1 – obrigatório para autoplay no navegador)
 *   &loop=1        (padrão: 1)
 *   &controls=0    (padrão: 0 – sem controles visíveis)
 *   &start=0       (segundos para iniciar)
 */

function extractYoutubeId(raw: string): string | null {
  if (!raw) return null;

  // Já é um ID puro (11 chars alfanuméricos + _ -)
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw.trim())) {
    return raw.trim();
  }

  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);

    // youtu.be/XXXXXXXXXXX
    if (url.hostname === 'youtu.be') {
      return url.pathname.slice(1).split('?')[0] || null;
    }

    // youtube.com/watch?v=XXXXXXXXXXX
    const v = url.searchParams.get('v');
    if (v) return v;

    // youtube.com/embed/XXXXXXXXXXX
    const pathParts = url.pathname.split('/');
    const embedIdx = pathParts.indexOf('embed');
    if (embedIdx !== -1 && pathParts[embedIdx + 1]) {
      return pathParts[embedIdx + 1];
    }

    // youtube.com/shorts/XXXXXXXXXXX
    const shortsIdx = pathParts.indexOf('shorts');
    if (shortsIdx !== -1 && pathParts[shortsIdx + 1]) {
      return pathParts[shortsIdx + 1];
    }
  } catch {
    // not a URL
  }

  return null;
}

export default function WidgetYoutube() {
  const [searchParams] = useSearchParams();
  const rawUrl   = searchParams.get('url')      || '';
  const autoplay = searchParams.get('autoplay') ?? '1';
  const mute     = searchParams.get('mute')     ?? '1';
  const loop     = searchParams.get('loop')     ?? '1';
  const controls = searchParams.get('controls') ?? '0';
  const start    = searchParams.get('start')    ?? '0';

  const videoId = extractYoutubeId(rawUrl);

  // Build embed URL
  const embedUrl = videoId
    ? `https://www.youtube-nocookie.com/embed/${videoId}?` +
      new URLSearchParams({
        autoplay,
        mute,
        loop,
        controls,
        start,
        // For loop to work, playlist must equal the video ID
        playlist: videoId,
        // Disable related videos
        rel: '0',
        // Hide YouTube logo
        modestbranding: '1',
        // Hide title bar
        showinfo: '0',
        // Disable annotations
        iv_load_policy: '3',
        // Prevent keyboard shortcuts on embed
        disablekb: '1',
      }).toString()
    : null;

  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className="w-screen h-screen overflow-hidden relative bg-black"
      style={{ fontFamily: 'sans-serif' }}
    >
      {!videoId ? (
        /* ── Error state: no valid URL ── */
        <div className="w-full h-full flex flex-col items-center justify-center gap-6 text-white bg-gradient-to-br from-zinc-900 to-zinc-800 px-8 text-center">
          <svg
            viewBox="0 0 90 90"
            className="w-[20vw] max-w-[120px] min-w-[64px] opacity-80"
            fill="currentColor"
          >
            <path d="M88.2 25.9c-1-3.8-4-6.8-7.8-7.8C73.6 16 45 16 45 16S16.4 16 9.6 18.1c-3.8 1-6.8 4-7.8 7.8C0 32.7 0 45 0 45s0 12.3 1.8 19.1c1 3.8 4 6.8 7.8 7.8C16.4 74 45 74 45 74s28.6 0 35.4-2.1c3.8-1 6.8-4 7.8-7.8C90 57.3 90 45 90 45s0-12.3-1.8-19.1zM36 57V33l24 12-24 12z" />
          </svg>
          <div>
            <p className="text-[3vw] max-text-2xl font-bold text-red-400 mb-2">URL do YouTube inválida</p>
            <p className="text-[1.8vw] text-zinc-400 max-w-lg">
              Adicione o parâmetro <code className="bg-zinc-700 px-1.5 py-0.5 rounded text-emerald-400">?url=</code> com a URL ou ID do vídeo do YouTube.
            </p>
            <p className="text-[1.4vw] text-zinc-500 mt-3">Exemplo: /widget/youtube?url=dQw4w9WgXcQ</p>
          </div>
        </div>
      ) : (
        <>
          {/* Loading overlay */}
          {!loaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 gap-4">
              <div className="w-14 h-14 border-4 border-zinc-700 border-t-red-500 rounded-full animate-spin" />
              <span className="text-zinc-500 text-sm tracking-widest uppercase">Carregando vídeo...</span>
            </div>
          )}

          {/* YouTube iframe – fills the entire screen */}
          <iframe
            key={embedUrl}
            src={embedUrl!}
            title="YouTube Video Player"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            onLoad={() => setLoaded(true)}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              // Scale to cover the entire viewport maintaining 16:9
              // We use a technique that ensures full-screen coverage
              width: '100vw',
              height: '100vh',
              transform: 'translate(-50%, -50%)',
              border: 'none',
              pointerEvents: 'none', // Prevent user interaction (totem mode)
            }}
          />

          {/* Invisible overlay to block any click-through */}
          <div
            className="absolute inset-0 z-20"
            style={{ background: 'transparent', cursor: 'none' }}
          />
        </>
      )}
    </div>
  );
}
