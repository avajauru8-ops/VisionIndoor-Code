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
         try {
            const res = await fetch(`/api/clima?cidade=${encodeURIComponent(cidade)}&estado=${encodeURIComponent(estado)}`);
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
            console.error(err);
            // Fallback for offline mode
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
               try {
                  setWeather(JSON.parse(cached));
               } catch (e) {
                  console.error("Erro ao fazer parse do cache de clima");
               }
            }
         } finally {
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

      return () => clearInterval(interval);
   }, [cidade, estado, searchParams]);

   let titleFontSize = '8vh';
   let titleFontSizePortrait = '6vh';
   if (cidade.length > 20) {
      titleFontSize = '4.5vh';
      titleFontSizePortrait = '3.5vh';
   } else if (cidade.length > 12) {
      titleFontSize = '6vh';
      titleFontSizePortrait = '4.5vh';
   }

   const renderMainIcon = () => {
      const code = weather.icon_id.slice(0, 2);
      const isDay = weather.icon_id.includes('d');
      // For inline styles we just use an inline style object here
      const props = { style: { width: '15vh', height: '15vh', color: 'white', fill: 'rgba(255,255,255,0.2)', filter: 'drop-shadow(0 4px 3px rgba(0,0,0,0.07))', flexShrink: 0 }, className: 'wc-main-icon' };
      const propsSun = { style: { width: '15vh', height: '15vh', color: '#fde047', fill: 'rgba(253, 224, 71, 0.5)', filter: 'drop-shadow(0 4px 3px rgba(0,0,0,0.07))', flexShrink: 0 }, className: 'wc-main-icon' };
      
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

   if (loading) {
      return <div style={{ width: '100vw', height: '100vh', backgroundColor: '#f3f4f6' }}></div>;
   }

   return (
      <div className="widget-clima">
         <style dangerouslySetInnerHTML={{__html: `
            html, body {
               margin: 0;
               padding: 0;
               width: 100%;
               height: 100%;
               background-color: #f3f4f6;
               overflow: hidden;
            }
            .widget-clima {
               width: 100vw;
               height: 100vh;
               background-color: #f3f4f6;
               display: flex;
               flex-direction: column;
               font-family: sans-serif;
               overflow: hidden;
            }
            .wc-topbar {
               position: relative;
               width: 100%;
               height: 15vh;
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
               width: 80vw;
               background-color: #0f204b;
               z-index: 10;
               -webkit-clip-path: polygon(0 0, 100% 0, 93% 100%, 0 100%);
               clip-path: polygon(0 0, 100% 0, 93% 100%, 0 100%);
            }
            .wc-topbar-blue-inner {
               display: flex;
               align-items: center;
               height: 100%;
               padding-left: 5vw;
            }
            .wc-topbar-title {
               color: white;
               font-weight: bold;
               letter-spacing: 0.1em;
               font-size: 3.5vh;
            }
            .wc-topbar-pattern {
               position: absolute;
               top: 0; left: 40vw;
               height: 100%; width: 40vw;
               opacity: 0.1;
               z-index: 10;
               pointer-events: none;
               display: flex;
               flex-wrap: wrap;
               gap: 1vw;
               padding: 2vh;
               align-items: center;
               justify-content: center;
               overflow: hidden;
            }
            .wc-topbar-right {
               position: absolute;
               right: 5vw; top: 0;
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
            .wc-sun-icon { width: 6vh; height: 6vh; color: #ff6600; }
            .wc-ow-text {
               color: #0f204b;
               font-weight: bold;
               font-size: 1.8vh;
               margin-top: 0.5vh;
            }
            
            .wc-content {
               flex: 1;
               display: flex;
               flex-direction: column;
               padding-left: 5vw;
               padding-right: 5vw;
               padding-bottom: 5vh;
               position: relative;
               z-index: 20;
            }
            .wc-city-box {
               display: flex;
               align-items: center;
               margin-top: 6vh;
               margin-bottom: 6vh;
            }
            .wc-city-lines {
               display: flex;
               height: 8vh;
            }
            .wc-city-line-1 {
               width: 2.5vw;
               background-color: #0f204b;
               transform: skewX(-20deg);
            }
            .wc-city-line-2 {
               width: 2.5vw;
               background-color: #0052cc;
               transform: skewX(-20deg);
               margin-left: -1vw;
            }
            .wc-city-name {
               color: #0f204b;
               font-weight: 900;
               margin-left: 2vw;
               letter-spacing: -0.05em;
               text-transform: uppercase;
               font-size: ${titleFontSize};
               margin-top: 0; margin-bottom: 0;
            }
            .wc-cards {
               display: flex;
               justify-content: center;
               align-items: stretch;
               flex: 1;
               gap: 2vw;
            }
            .wc-card-left {
               position: relative;
               width: 30vw;
               background-color: #22272e;
               border-radius: 40px;
               display: flex;
               flex-direction: column;
               align-items: center;
               justify-content: center;
               box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
               overflow: hidden;
               flex-shrink: 0;
               padding-top: 4vh;
               padding-bottom: 4vh;
            }
            .wc-corner-left {
               position: absolute;
               top: 0; left: 0;
               width: 6vw; height: 6vw;
               background-color: #facc15;
               -webkit-clip-path: polygon(0 0, 100% 0, 0 100%);
               clip-path: polygon(0 0, 100% 0, 0 100%);
            }
            .wc-hoje {
               color: #facc15;
               font-size: 4vh;
               font-weight: bold;
               font-style: italic;
               z-index: 10;
               margin: 0;
            }
            .wc-main-icon-wrapper {
               margin-top: 2vh;
               margin-bottom: 2vh;
               z-index: 10;
               filter: drop-shadow(0 25px 25px rgba(0,0,0,0.5));
            }
            .wc-temp {
               color: white;
               font-size: 12vh;
               font-weight: 900;
               line-height: 1;
               letter-spacing: -0.05em;
               z-index: 10;
            }
            .wc-desc {
               color: white;
               font-size: 3vh;
               font-weight: 600;
               text-align: center;
               z-index: 10;
               padding-left: 2vw;
               padding-right: 2vw;
               line-height: 1.25;
               margin-top: 1vh;
            }
            .wc-clouds {
               color: rgba(255,255,255,0.7);
               font-size: 2.5vh;
               margin-top: 0.5vh;
               z-index: 10;
            }
            
            .wc-separator {
               display: flex;
               align-items: center;
               justify-content: center;
               flex-shrink: 0;
               width: 6vw;
            }
            .wc-sep-svg {
               width: 8vw; height: 12vh;
               color: #facc15;
               fill: #facc15;
               filter: drop-shadow(0 4px 3px rgba(0,0,0,0.07));
            }

            .wc-card-right {
               position: relative;
               flex: 1;
               background-color: #15234b;
               border-radius: 40px;
               padding: 6vh;
               box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
               overflow: hidden;
               display: flex;
               flex-direction: column;
               justify-content: center;
            }
            .wc-corner-right {
               position: absolute;
               bottom: 0; right: 0;
               width: 6vw; height: 6vw;
               background-color: #facc15;
               -webkit-clip-path: polygon(100% 0, 100% 100%, 0 100%);
               clip-path: polygon(100% 0, 100% 100%, 0 100%);
            }
            .wc-grid {
               display: grid;
               grid-template-columns: repeat(3, minmax(0, 1fr));
               row-gap: 8vh;
               column-gap: 4vw;
               z-index: 10;
               position: relative;
            }
            .wc-grid-item {
               display: flex;
               align-items: center;
               justify-content: center;
               gap: 1.5vw;
               width: 100%;
            }
            .wc-grid-icon {
               width: 6vh; height: 6vh;
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
               font-size: 2vh;
               font-weight: 500;
               line-height: 1.25;
               margin-bottom: 0.25rem;
            }
            .wc-grid-val {
               color: white;
               font-size: 3vh;
               font-weight: bold;
               line-height: 1.25;
            }

            /* Portrait overrides */
            @media (orientation: portrait) {
               .wc-topbar { height: 7vh; }
               .wc-topbar-blue { width: 85vw; }
               .wc-topbar-title { font-size: 3.5vh; }
               .wc-sun-icon { width: 4vh; height: 4vh; }
               .wc-ow-text { font-size: 1.5vh; }
               
               .wc-content { padding-bottom: 2vh; }
               .wc-city-box { margin-top: 2vh; margin-bottom: 2vh; }
               .wc-city-lines { height: 6vh; }
               .wc-city-line-1, .wc-city-line-2 { width: 4vw; }
               .wc-city-name { font-size: ${titleFontSizePortrait}; }
               
               .wc-cards { flex-direction: column; align-items: center; gap: 2vh; justify-content: space-evenly; }
               .wc-card-left { width: 94vw; border-radius: 30px; padding-top: 2.5vh; padding-bottom: 2.5vh; }
               .wc-corner-left { width: 10vw; height: 10vw; }
               .wc-hoje { font-size: 3.5vh; }
               .wc-main-icon-wrapper { margin-top: 1vh; margin-bottom: 1vh; }
               .wc-temp { font-size: 10vh; }
               .wc-desc { font-size: 2.5vh; }
               .wc-clouds { font-size: 2vh; }
               
               .wc-separator { width: 100%; height: 4vh; }
               .wc-sep-svg { width: 6vh; height: 6vh; transform: rotate(90deg); }
               
               .wc-card-right { flex: none; width: 94vw; padding: 4vh; padding-top: 2.5vh; padding-bottom: 2.5vh; border-radius: 30px; }
               .wc-corner-right { width: 10vw; height: 10vw; }
               
               .wc-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 2.5vh; column-gap: 2vw; }
               .wc-grid-item { gap: 2vw; }
               .wc-grid-icon { width: 3.5vh; height: 3.5vh; }
               
               .wc-main-icon { width: 12vh !important; height: 12vh !important; }
            }
         `}} />

         <div className="wc-topbar">
           <div className="wc-topbar-blue">
             <div className="wc-topbar-blue-inner">
               <span className="wc-topbar-title">PREVISÃO DO TEMPO</span>
             </div>
           </div>
           <div className="wc-topbar-pattern">
               {Array.from({length: 40}).map((_, i) => (
                  <Cloud key={i} style={{ width: '2.5vh', height: '2.5vh', color: 'white' }} />
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
   );
}
