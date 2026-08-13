import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function WidgetVideoPlayer() {
  const [searchParams] = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);

  const url = searchParams.get('url') || '';
  const device_id = searchParams.get('device_id') || '';

  useEffect(() => {
    if (device_id) {
      fetch('/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id,
          widget_status: 'Reproduzindo Video'
        })
      }).catch(() => {});
    }
  }, [device_id]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !url) return;

    vid.muted = true;

    const tryPlay = () => {
      const p = vid.play();
      if (p) p.catch(() => {});
    };

    if (vid.readyState >= 2) {
      tryPlay();
    } else {
      vid.addEventListener('loadeddata', tryPlay, { once: true });
    }

    return () => vid.removeEventListener('loadeddata', tryPlay);
  }, [url]);

  if (!url) {
    return (
      <div style={{ width: '100vw', height: '100vh', backgroundColor: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#666', fontSize: '3vh' }}>Video nao disponivel</span>
      </div>
    );
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: 'black',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <video
        ref={videoRef}
        src={url}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block'
        }}
      />
    </div>
  );
}
