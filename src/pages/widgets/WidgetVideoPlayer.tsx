import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function WidgetVideoPlayer() {
  const [searchParams] = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);

  const url = searchParams.get('url') || '';
  const device_id = searchParams.get('device_id') || '';
  const loop = searchParams.get('loop') !== '0';
  const muted = searchParams.get('mute') === '1';

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

    const playPromise = vid.play();
    if (playPromise) playPromise.catch(() => {});
  }, [url]);

  if (!url) {
    return (
      <div style={{ width: '100vw', height: '100vh', backgroundColor: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#666', fontSize: '3vh' }}>Video nao disponivel</span>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: 'black', margin: 0, padding: 0, overflow: 'hidden' }}>
      <style dangerouslySetInnerHTML={{__html: `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #root { width: 100%; height: 100%; background-color: black; overflow: hidden; }
      `}} />
      <video
        ref={videoRef}
        src={url}
        autoPlay
        loop={loop}
        muted={muted}
        playsInline
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          transform: 'translate(-50%, -50%)'
        }}
      />
    </div>
  );
}
