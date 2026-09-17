import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function WidgetVideoPlayer() {
  const [searchParams] = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [rotation, setRotation] = useState(0);

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
    vid.load();

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

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const target = e.target as HTMLVideoElement;
    const vW = target.videoWidth;
    const vH = target.videoHeight;
    const sW = window.innerWidth;
    const sH = window.innerHeight;

    // Se a tela for horizontal e o vídeo vertical, ou vice-versa, rotaciona a mídia em 90 graus
    if ((vW < vH && sW > sH) || (vW > vH && sW < sH)) {
      setRotation(90);
    } else {
      setRotation(0);
    }
  };

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
        muted
        playsInline
        preload="auto"
        onLoadedMetadata={handleLoadedMetadata}
        style={{
          width: rotation ? '100vh' : '100vw',
          height: rotation ? '100vw' : '100vh',
          objectFit: 'contain',
          display: 'block',
          transform: `rotate(${rotation}deg)`,
          transformOrigin: 'center center'
        }}
      />
    </div>
  );
}
