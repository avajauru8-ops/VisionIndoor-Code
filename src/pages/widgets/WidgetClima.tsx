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
         try {
            const res = await fetch(`/api/clima?cidade=${encodeURIComponent(cidade)}&estado=${encodeURIComponent(estado)}`);
            const data = await res.json();

            if (!res.ok) {
               throw new Error(data.messages?.error || data.erro || 'Erro ao carregar clima');
            }

            setWeather({
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
            });

         } catch (err: any) {
            console.error(err);
         } finally {
            setLoading(false);
         }
      }
      fetchWeather();
      const interval = setInterval(fetchWeather, 30 * 60 * 1000);
      return () => clearInterval(interval);
   }, [cidade, estado]);

   const renderMainIcon = () => {
      const code = weather.icon_id.slice(0, 2);
      const isDay = weather.icon_id.includes('d');
      const props = { className: "w-[15vh] h-[15vh] portrait:w-[12vh] portrait:h-[12vh] text-white fill-white/20 shrink-0 drop-shadow-md" };
      
      switch(code) {
         case '01': return isDay ? <Sun {...props} className="w-[15vh] h-[15vh] portrait:w-[12vh] portrait:h-[12vh] text-yellow-300 fill-yellow-300/50" /> : <Moon {...props} />;
         case '02': 
         case '03':
         case '04': return isDay ? <CloudSun {...props} /> : <CloudMoon {...props} />;
         case '09':
         case '10': return <CloudRain {...props} />;
         case '11': return <CloudLightning {...props} />;
         case '13': return <CloudSnow {...props} />;
         case '50': return <Cloud {...props} />;
         default: return isDay ? <Sun {...props} className="w-[15vh] h-[15vh] portrait:w-[12vh] portrait:h-[12vh] text-yellow-300 fill-yellow-300/50" /> : <Moon {...props} />;
      }
   };

   if (loading) {
      return <div className="w-screen h-screen bg-[#f3f4f6]"></div>;
   }

   return (
      <div className="w-screen h-screen bg-[#f3f4f6] flex flex-col font-sans overflow-hidden">
         {/* Top Bar */}
         <div className="relative w-full h-[15vh] portrait:h-[7vh] bg-white flex shadow-md overflow-hidden shrink-0">
           {/* Dark blue section */}
           <div className="absolute top-0 left-0 h-full w-[80vw] portrait:w-[85vw] bg-[#0f204b] z-10" style={{ clipPath: 'polygon(0 0, 100% 0, 93% 100%, 0 100%)' }}>
             <div className="flex items-center h-full pl-[5vw]">
               <span className="text-white font-bold tracking-widest text-[3.5vh] portrait:text-[3.5vh]">PREVISÃO DO TEMPO</span>
             </div>
           </div>
           
           {/* Faint pattern overlay on blue (optional) */}
           <div className="absolute top-0 left-[40vw] h-full w-[40vw] opacity-10 z-10 pointer-events-none flex flex-wrap gap-[1vw] p-[2vh] items-center justify-center overflow-hidden">
               {Array.from({length: 40}).map((_, i) => (
                  <Cloud key={i} className="w-[2.5vh] h-[2.5vh] text-white" />
               ))}
           </div>

           {/* Right section (OpenWeather logo) */}
           <div className="absolute right-[5vw] top-0 h-full flex items-center justify-end z-0">
               <div className="flex flex-col items-center">
                 <Sun className="w-[6vh] h-[6vh] portrait:w-[4vh] portrait:h-[4vh] text-[#ff6600]" />
                 <span className="text-[#0f204b] font-bold text-[1.8vh] portrait:text-[1.5vh] mt-[0.5vh]">OpenWeather</span>
               </div>
           </div>
         </div>

         {/* Content Area */}
         <div className="flex-1 flex flex-col px-[5vw] pb-[5vh] portrait:pb-[2vh] relative z-20">
            {/* City Title */}
            <div className="flex items-center mt-[6vh] mb-[6vh] portrait:mt-[2vh] portrait:mb-[2vh]">
               <div className="flex h-[8vh] portrait:h-[6vh]">
                  <div className="w-[2.5vw] portrait:w-[4vw] bg-[#0f204b] skew-x-[-20deg]"></div>
                  <div className="w-[2.5vw] portrait:w-[4vw] bg-[#0052cc] skew-x-[-20deg] -ml-[1vw]"></div>
               </div>
               <h1 className="text-[#0f204b] font-black text-[8vh] portrait:text-[6vh] ml-[2vw] tracking-tighter uppercase">{cidade}</h1>
            </div>

            {/* Main Cards */}
            <div className="flex justify-center items-stretch flex-1 gap-[2vw] portrait:flex-col portrait:items-center portrait:gap-[2vh] portrait:justify-evenly">
               
               {/* Left Card: Today */}
               <div className="relative w-[30vw] portrait:w-[94vw] bg-[#22272e] rounded-[40px] portrait:rounded-[30px] flex flex-col items-center justify-center shadow-2xl overflow-hidden shrink-0 py-[4vh] portrait:py-[4vh]">
                 {/* Yellow corner accent top left */}
                 <div className="absolute top-0 left-0 w-[6vw] h-[6vw] portrait:w-[12vw] portrait:h-[12vw] bg-[#facc15]" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}></div>
                 
                 <h2 className="text-[#facc15] text-[4vh] portrait:text-[4vh] font-bold italic z-10">Hoje</h2>
                 
                 <div className="my-[2vh] z-10 drop-shadow-2xl">
                    {renderMainIcon()}
                 </div>

                 <div className="text-white text-[12vh] portrait:text-[14vh] font-black leading-none tracking-tighter z-10">
                    {weather.temp}°
                 </div>
                 <div className="text-white text-[3vh] portrait:text-[2.5vh] font-semibold text-center z-10 px-[2vw] leading-tight">{weather.description}</div>
                 <div className="text-white/70 text-[2.5vh] portrait:text-[2vh] mt-[1vh] z-10">{weather.clouds}</div>
               </div>

               {/* Chevron Separator */}
               <div className="flex items-center justify-center shrink-0 w-[6vw] portrait:w-full portrait:h-[4vh]">
                 <svg viewBox="0 0 24 24" className="w-[8vw] h-[12vh] portrait:w-[6vh] portrait:h-[6vh] text-[#facc15] fill-[#facc15] drop-shadow-md portrait:rotate-90">
                    <path d="M5 3l14 9-14 9v-5l6.2-4L5 8V3z"/>
                 </svg>
               </div>

               {/* Right Card: Details Grid */}
               <div className="relative flex-1 portrait:flex-none portrait:w-[94vw] portrait:py-[4vh] bg-[#15234b] rounded-[40px] portrait:rounded-[30px] p-[6vh] portrait:p-[5vh] shadow-2xl overflow-hidden flex flex-col justify-center">
                 {/* Yellow corner accent bottom right */}
                 <div className="absolute bottom-0 right-0 w-[6vw] h-[6vw] portrait:w-[12vw] portrait:h-[12vw] bg-[#facc15]" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}></div>

                 <div className="grid grid-cols-3 portrait:grid-cols-2 gap-y-[8vh] portrait:gap-y-[3.5vh] gap-x-[4vw] portrait:gap-x-[2vw] z-10 relative">
                    {/* Vento */}
                    <div className="flex items-center gap-[1.5vw] portrait:gap-[2vw]">
                       <Wind className="w-[6vh] h-[6vh] portrait:w-[4vh] portrait:h-[4vh] text-white shrink-0 drop-shadow" />
                       <div className="flex flex-col justify-center">
                          <span className="text-[#a0b0d0] text-[2vh] portrait:text-[2.2vh] font-medium leading-tight mb-1">Vento</span>
                          <span className="text-white text-[3vh] portrait:text-[3.2vh] font-bold leading-tight">{weather.wind}</span>
                       </div>
                    </div>
                    
                    {/* Umidade */}
                    <div className="flex items-center gap-[1.5vw] portrait:gap-[2vw]">
                       <Droplets className="w-[6vh] h-[6vh] portrait:w-[4vh] portrait:h-[4vh] text-[#00aaff] shrink-0 drop-shadow" />
                       <div className="flex flex-col justify-center">
                          <span className="text-[#a0b0d0] text-[2vh] portrait:text-[2.2vh] font-medium leading-tight mb-1">Umidade</span>
                          <span className="text-white text-[3vh] portrait:text-[3.2vh] font-bold leading-tight">{weather.humidity}</span>
                       </div>
                    </div>

                    {/* Chuva */}
                    <div className="flex items-center gap-[1.5vw] portrait:gap-[2vw]">
                       <CloudRain className="w-[6vh] h-[6vh] portrait:w-[4vh] portrait:h-[4vh] text-[#00aaff] shrink-0 drop-shadow" />
                       <div className="flex flex-col justify-center">
                          <span className="text-[#a0b0d0] text-[2vh] portrait:text-[2.2vh] font-medium leading-tight mb-1">Chuva</span>
                          <span className="text-white text-[3vh] portrait:text-[3.2vh] font-bold leading-tight">0%</span>
                       </div>
                    </div>

                    {/* Sensação Térmica */}
                    <div className="flex items-center gap-[1.5vw] portrait:gap-[2vw]">
                       <Thermometer className="w-[6vh] h-[6vh] portrait:w-[4vh] portrait:h-[4vh] text-[#ff6600] shrink-0 drop-shadow" />
                       <div className="flex flex-col justify-center">
                          <span className="text-[#a0b0d0] text-[2vh] portrait:text-[2.2vh] font-medium leading-tight mb-1">Sensação<br/>Térmica</span>
                          <span className="text-white text-[3vh] portrait:text-[3.2vh] font-bold leading-tight">{weather.feels_like}°</span>
                       </div>
                    </div>

                    {/* Amanhecer */}
                    <div className="flex items-center gap-[1.5vw] portrait:gap-[2vw]">
                       <Sunrise className="w-[6vh] h-[6vh] portrait:w-[4vh] portrait:h-[4vh] text-[#facc15] shrink-0 drop-shadow" />
                       <div className="flex flex-col justify-center">
                          <span className="text-[#a0b0d0] text-[2vh] portrait:text-[2.2vh] font-medium leading-tight mb-1">Amanhecer</span>
                          <span className="text-white text-[3vh] portrait:text-[3.2vh] font-bold leading-tight">{weather.sunrise}</span>
                       </div>
                    </div>

                    {/* Pôr do Sol */}
                    <div className="flex items-center gap-[1.5vw] portrait:gap-[2vw]">
                       <Sunset className="w-[6vh] h-[6vh] portrait:w-[4vh] portrait:h-[4vh] text-[#00aaff] shrink-0 drop-shadow" />
                       <div className="flex flex-col justify-center">
                          <span className="text-[#a0b0d0] text-[2vh] portrait:text-[2.2vh] font-medium leading-tight mb-1">Pôr do Sol</span>
                          <span className="text-white text-[3vh] portrait:text-[3.2vh] font-bold leading-tight">{weather.sunset}</span>
                       </div>
                    </div>
                 </div>
               </div>

            </div>
         </div>
      </div>
   );
}
