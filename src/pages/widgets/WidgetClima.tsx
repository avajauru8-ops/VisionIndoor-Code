import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Cloud, CloudLightning, CloudRain, CloudSnow, Sun, Wind, Droplets, Thermometer, Sunrise, Sunset, Moon, CloudSun, CloudMoon } from 'lucide-react';

export default function WidgetClima() {
   const [searchParams] = useSearchParams();
   const cidade = searchParams.get('cidade') || 'Serra';
   const estado = searchParams.get('estado') || 'ES';

   const [weather, setWeather] = useState({
      temp: 0,
      condition: '',
      description: '',
      humidity: '0%',
      wind: '0 km/h',
      feels_like: 0,
      sunrise: '--:--',
      sunset: '--:--',
      clouds: '0%',
      icon_id: '01d',
      isDay: 1
   });
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      async function fetchWeather() {
         const cacheKey = `weather_${cidade}_${estado}`;
         const cached = localStorage.getItem(cacheKey);
         if (cached) {
            try { setWeather(JSON.parse(cached)); setLoading(false); } catch (_) {}
         }

         const controller = new AbortController();
         const timeoutId = setTimeout(() => controller.abort(), 8000);

         try {
            const res = await fetch(`/api/clima?cidade=${encodeURIComponent(cidade)}&estado=${encodeURIComponent(estado)}`, { signal: controller.signal });
            const data = await res.json();

            if (!res.ok) {
               throw new Error(data.messages?.error || data.erro || 'Erro ao carregar clima');
            }

            const weatherData = {
               temp: data.temp,
               condition: data.condition,
               description: data.description || data.condition,
               humidity: data.humidity,
               wind: data.wind,
               feels_like: data.feels_like || data.temp,
               sunrise: data.sunrise || '--:--',
               sunset: data.sunset || '--:--',
               clouds: data.clouds || '0%',
               icon_id: data.icon_id || (data.isDay ? '01d' : '01n'),
               isDay: data.isDay
            };

            setWeather(weatherData);
            localStorage.setItem(cacheKey, JSON.stringify(weatherData));
         } catch (err: any) {
            if (err.name !== 'AbortError') console.error(err);
         } finally {
            clearTimeout(timeoutId);
            setLoading(false);
         }
      }
      fetchWeather();
      const interval = setInterval(fetchWeather, 30 * 60 * 1000);

      // Envia o status para o painel com a cidade e estado
      const deviceId = searchParams.get('device_id');
      if (deviceId) {
         fetch('/api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               device_id: deviceId,
               widget_status: `Reproduzindo Widget: Clima (${cidade} - ${estado})`
            })
         }).catch(err => console.error('Erro ao atualizar status do widget:', err));
      }

      return () => { clearInterval(interval); };
   }, [cidade, estado, searchParams]);

   const cityLen = Math.max(cidade.length, 1);
   const cityWidth = (0.65 * cityLen).toFixed(2);
   const titleFontSize = `min(8cqh, calc(84cqw / ${cityWidth}))`;
   const titleFontSizePortrait = `min(6cqh, calc(80cqw / ${cityWidth}))`;

   const renderMainIcon = () => {
      const code = weather.icon_id.slice(0, 2);
      const isDay = weather.icon_id.includes('d');
      // For inline styles we just use an inline style object here
      const props = { style: { width: '15cqh', height: '15cqh', color: 'white', fill: 'rgba(255,255,255,0.2)', filter: 'drop-shadow(0 4px 3px rgba(0,0,0,0.07))', flexShrink: 0 }, className: 'wc-main-icon' };
      const propsSun = { style: { width: '15cqh', height: '15cqh', color: '#fde047', fill: 'rgba(253, 224, 71, 0.5)', filter: 'drop-shadow(0 4px 3px rgba(0,0,0,0.07))', flexShrink: 0 }, className: 'wc-main-icon' };
      
      switch(code) {
         case '01': return isDay ? <Sun {...propsSun} /> : <Moon {...props} />;
         case '02': 
         case '03':
         case '04': return isDay ? <CloudSun {...props} /> : <CloudMoon {...props} />;
         case '09':
         case '10': return <CloudRain {...props} />;
         case '11': return <CloudLightning {...props} />;
         case '13': return <CloudSnow {...props} />;
         case '50': return <Cloud {...props} />;
         default: return isDay ? <Sun {...propsSun} /> : <Moon {...props} />;
      }
   };

   return (
      <div className="wc-screen">
         <style dangerouslySetInnerHTML={{__html: `
            html, body {
               margin: 0;
               padding: 0;
               width: 100%;
               height: 100%;
               background-color: #f3f4f6;
               overflow: hidden;
            }
            .wc-screen {
               position: fixed;
               inset: 0;
               display: flex;
               align-items: center;
               justify-content: center;
               padding: 3vmin;
               box-sizing: border-box;
               background-color: #f3f4f6;
               overflow: hidden;
            }
            .widget-clima {
               container-type: size;
               width: 100%;
               height: 100%;
               background-color: #f3f4f6;
               display: flex;
               flex-direction: column;
               font-family: sans-serif;
               overflow: hidden;
            }
            .wc-topbar {
               position: relative;
               width: 100%;
               height: 15cqh;
               background-color: white;
               display: flex;
               box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
               overflow: hidden;
               flex-shrink: 0;
            }
            .wc-topbar-blue {
               position: absolute;
               top: 0; left: 0;
               height: 100%;
               width: 80cqw;
               background-color: #0f204b;
               z-index: 10;
               -webkit-clip-path: polygon(0 0, 100% 0, 93% 100%, 0 100%);
               clip-path: polygon(0 0, 100% 0, 93% 100%, 0 100%);
            }
            .wc-topbar-blue-inner {
               display: flex;
               align-items: center;
               height: 100%;
               padding-left: 5cqw;
            }
            .wc-topbar-title {
               color: white;
               font-weight: bold;
               letter-spacing: 0.1em;
               font-size: 3.5cqh;
            }
            .wc-topbar-pattern {
               position: absolute;
               top: 0; left: 40cqw;
               height: 100%; width: 40cqw;
               opacity: 0.1;
               z-index: 10;
               pointer-events: none;
               display: flex;
               flex-wrap: wrap;
               gap: 1cqw;
               padding: 2cqh;
               align-items: center;
               justify-content: center;
               overflow: hidden;
            }
            .wc-topbar-right {
               position: absolute;
               right: 5cqw; top: 0;
               height: 100%;
               display: flex;
               align-items: center;
               justify-content: flex-end;
               z-index: 0;
            }
            .wc-topbar-right-inner {
               display: flex;
               flex-direction: column;
               align-items: center;
            }
            .wc-sun-icon { width: 6cqh; height: 6cqh; color: #ff6600; }
            .wc-ow-text {
               color: #0f204b;
               font-weight: bold;
               font-size: 1.8cqh;
               margin-top: 0.5cqh;
            }
            
            .wc-content {
               flex: 1;
               display: flex;
               flex-direction: column;
               padding-left: 5cqw;
               padding-right: 5cqw;
               padding-bottom: 5cqh;
               position: relative;
               z-index: 20;
            }
            .wc-city-box {
               display: flex;
               align-items: center;
               margin-top: 6cqh;
               margin-bottom: 6cqh;
            }
            .wc-city-lines {
               display: flex;
               height: 8cqh;
            }
            .wc-city-line-1 {
               width: 2.5cqw;
               background-color: #0f204b;
               transform: skewX(-20deg);
            }
            .wc-city-line-2 {
               width: 2.5cqw;
               background-color: #0052cc;
               transform: skewX(-20deg);
               margin-left: -1cqw;
            }
            .wc-city-name {
               color: #0f204b;
               font-weight: 900;
               margin-left: 2cqw;
               letter-spacing: -0.05em;
               text-transform: uppercase;
               white-space: nowrap;
               font-size: ${titleFontSize};
               margin-top: 0; margin-bottom: 0;
            }
            .wc-cards {
               display: flex;
               justify-content: center;
               align-items: stretch;
               flex: 1;
               gap: 2cqw;
            }
            .wc-card-left {
               position: relative;
               width: 30cqw;
               background-color: #22272e;
               border-radius: 40px;
               display: flex;
               flex-direction: column;
               align-items: center;
               justify-content: center;
               box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
               overflow: hidden;
               flex-shrink: 0;
               padding-top: 4cqh;
               padding-bottom: 4cqh;
            }
            .wc-corner-left {
               position: absolute;
               top: 0; left: 0;
               width: 6cqw; height: 6cqw;
               background-color: #facc15;
               -webkit-clip-path: polygon(0 0, 100% 0, 0 100%);
               clip-path: polygon(0 0, 100% 0, 0 100%);
            }
            .wc-hoje {
               color: #facc15;
               font-size: 4cqh;
               font-weight: bold;
               font-style: italic;
               z-index: 10;
               margin: 0;
            }
            .wc-main-icon-wrapper {
               margin-top: 2cqh;
               margin-bottom: 2cqh;
               z-index: 10;
               filter: drop-shadow(0 25px 25px rgba(0,0,0,0.5));
            }
            .wc-temp {
               color: white;
               font-size: 12cqh;
               font-weight: 900;
               line-height: 1;
               letter-spacing: -0.05em;
               z-index: 10;
            }
            .wc-desc {
               color: white;
               font-size: 3cqh;
               font-weight: 600;
               text-align: center;
               z-index: 10;
               padding-left: 2cqw;
               padding-right: 2cqw;
               line-height: 1.25;
               margin-top: 1cqh;
            }
            .wc-clouds {
               color: rgba(255,255,255,0.7);
               font-size: 2.5cqh;
               margin-top: 0.5cqh;
               z-index: 10;
            }
            
            .wc-separator {
               display: flex;
               align-items: center;
               justify-content: center;
               flex-shrink: 0;
               width: 6cqw;
            }
            .wc-sep-svg {
               width: 8cqw; height: 12cqh;
               color: #facc15;
               fill: #facc15;
               filter: drop-shadow(0 4px 3px rgba(0,0,0,0.07));
            }

            .wc-card-right {
               position: relative;
               flex: 1;
               background-color: #15234b;
               border-radius: 40px;
               padding: 6cqh;
               box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
               overflow: hidden;
               display: flex;
               flex-direction: column;
               justify-content: center;
            }
            .wc-corner-right {
               position: absolute;
               bottom: 0; right: 0;
               width: 6cqw; height: 6cqw;
               background-color: #facc15;
               -webkit-clip-path: polygon(100% 0, 100% 100%, 0 100%);
               clip-path: polygon(100% 0, 100% 100%, 0 100%);
            }
            .wc-grid {
               display: grid;
               grid-template-columns: repeat(3, minmax(0, 1fr));
               row-gap: 8cqh;
               column-gap: 4cqw;
               z-index: 10;
               position: relative;
            }
            .wc-grid-item {
               display: flex;
               align-items: center;
               justify-content: center;
               gap: 1.5cqw;
               width: 100%;
            }
            .wc-grid-icon {
               width: 6cqh; height: 6cqh;
               flex-shrink: 0;
               filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
            }
            .wc-grid-text {
               display: flex;
               flex-direction: column;
               justify-content: center;
            }
            .wc-grid-label {
               color: #a0b0d0;
               font-size: 2cqh;
               font-weight: 500;
               line-height: 1.25;
               margin-bottom: 0.25rem;
            }
            .wc-grid-val {
               color: white;
               font-size: 3cqh;
               font-weight: bold;
               line-height: 1.25;
            }

            /* Portrait overrides */
            @media (orientation: portrait) {
               .wc-topbar { height: 7cqh; }
               .wc-topbar-blue { width: 85cqw; }
               .wc-topbar-title { font-size: 3.5cqh; }
               .wc-sun-icon { width: 4cqh; height: 4cqh; }
               .wc-ow-text { font-size: 1.5cqh; }
               
               .wc-content { padding-bottom: 2cqh; }
               .wc-city-box { margin-top: 2cqh; margin-bottom: 2cqh; }
               .wc-city-lines { height: 6cqh; }
               .wc-city-line-1, .wc-city-line-2 { width: 4cqw; }
               .wc-city-name { font-size: ${titleFontSizePortrait}; }
               
               .wc-cards { flex-direction: column; align-items: center; gap: 2cqh; justify-content: space-evenly; }
               .wc-card-left { width: 94cqw; border-radius: 30px; padding-top: 2.5cqh; padding-bottom: 2.5cqh; }
               .wc-corner-left { width: 10cqw; height: 10cqw; }
               .wc-hoje { font-size: 3.5cqh; }
               .wc-main-icon-wrapper { margin-top: 1cqh; margin-bottom: 1cqh; }
               .wc-temp { font-size: 10cqh; }
               .wc-desc { font-size: 2.5cqh; }
               .wc-clouds { font-size: 2cqh; }
               
               .wc-separator { width: 100%; height: 4cqh; }
               .wc-sep-svg { width: 6cqh; height: 6cqh; transform: rotate(90deg); }
               
               .wc-card-right { flex: none; width: 94cqw; padding: 4cqh; padding-top: 2.5cqh; padding-bottom: 2.5cqh; border-radius: 30px; }
               .wc-corner-right { width: 10cqw; height: 10cqw; }
               
               .wc-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 2.5cqh; column-gap: 2cqw; }
               .wc-grid-item { gap: 2cqw; }
               .wc-grid-icon { width: 3.5cqh; height: 3.5cqh; }
               
               .wc-main-icon { width: 12cqh !important; height: 12cqh !important; }
            }
         `}} />

         <div className="widget-clima">
         <div className="wc-topbar">
           <div className="wc-topbar-blue">
             <div className="wc-topbar-blue-inner">
               <span className="wc-topbar-title">PREVISÃO DO TEMPO</span>
             </div>
           </div>
           <div className="wc-topbar-pattern">
               {Array.from({length: 40}).map((_, i) => (
                  <Cloud key={i} style={{ width: '2.5cqh', height: '2.5cqh', color: 'white' }} />
               ))}
           </div>
           <div className="wc-topbar-right">
               <div className="wc-topbar-right-inner">
                 <Sun className="wc-sun-icon" />
                 <span className="wc-ow-text">OpenWeather</span>
               </div>
           </div>
         </div>

         <div className="wc-content">
            <div className="wc-city-box">
               <div className="wc-city-lines">
                  <div className="wc-city-line-1"></div>
                  <div className="wc-city-line-2"></div>
               </div>
               <h1 className="wc-city-name">{cidade}</h1>
            </div>

            <div className="wc-cards">
               
               <div className="wc-card-left">
                 <div className="wc-corner-left"></div>
                 <h2 className="wc-hoje">Hoje</h2>
                 <div className="wc-main-icon-wrapper">
                    {renderMainIcon()}
                 </div>
                 <div className="wc-temp">{weather.temp}°</div>
                 <div className="wc-desc">{weather.description}</div>
                 <div className="wc-clouds">{weather.clouds}</div>
               </div>

               <div className="wc-separator">
                 <svg viewBox="0 0 24 24" className="wc-sep-svg">
                    <path d="M5 3l14 9-14 9v-5l6.2-4L5 8V3z"/>
                 </svg>
               </div>

               <div className="wc-card-right">
                 <div className="wc-corner-right"></div>
                 <div className="wc-grid">
                    <div className="wc-grid-item">
                       <Wind className="wc-grid-icon" style={{color: 'white'}} />
                       <div className="wc-grid-text">
                          <span className="wc-grid-label">Vento</span>
                          <span className="wc-grid-val">{weather.wind}</span>
                       </div>
                    </div>
                    
                    <div className="wc-grid-item">
                       <Droplets className="wc-grid-icon" style={{color: '#00aaff'}} />
                       <div className="wc-grid-text">
                          <span className="wc-grid-label">Umidade</span>
                          <span className="wc-grid-val">{weather.humidity}</span>
                       </div>
                    </div>

                    <div className="wc-grid-item">
                       <CloudRain className="wc-grid-icon" style={{color: '#00aaff'}} />
                       <div className="wc-grid-text">
                          <span className="wc-grid-label">Chuva</span>
                          <span className="wc-grid-val">0%</span>
                       </div>
                    </div>

                    <div className="wc-grid-item">
                       <Thermometer className="wc-grid-icon" style={{color: '#ff6600'}} />
                       <div className="wc-grid-text">
                          <span className="wc-grid-label">Sensação<br/>Térmica</span>
                          <span className="wc-grid-val">{weather.feels_like}°</span>
                       </div>
                    </div>

                    <div className="wc-grid-item">
                       <Sunrise className="wc-grid-icon" style={{color: '#facc15'}} />
                       <div className="wc-grid-text">
                          <span className="wc-grid-label">Amanhecer</span>
                          <span className="wc-grid-val">{weather.sunrise}</span>
                       </div>
                    </div>

                    <div className="wc-grid-item">
                       <Sunset className="wc-grid-icon" style={{color: '#00aaff'}} />
                       <div className="wc-grid-text">
                          <span className="wc-grid-label">Pôr do Sol</span>
                          <span className="wc-grid-val">{weather.sunset}</span>
                       </div>
                    </div>
                 </div>
               </div>

            </div>
         </div>
      </div>
      </div>
   );
}
