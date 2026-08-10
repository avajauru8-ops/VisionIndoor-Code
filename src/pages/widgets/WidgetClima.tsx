import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Cloud, CloudLightning, CloudRain, CloudSnow, Sun, Wind } from 'lucide-react';

export default function WidgetClima() {
   const [searchParams] = useSearchParams();
   const cidade = searchParams.get('cidade') || 'Serra';
   const estado = searchParams.get('estado') || 'ES';

   const [weather, setWeather] = useState({
      temp: 0,
      condition: '',
      humidity: '0%',
      wind: '0 km/h',
      isDay: 1
   });
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      async function fetchWeather() {
         try {
            // Fazer requisição para a nossa própria API que possui a chave do OpenWeather
            const res = await fetch(`/api/clima?cidade=${encodeURIComponent(cidade)}&estado=${encodeURIComponent(estado)}`);
            const data = await res.json();

            if (!res.ok) {
               throw new Error(data.messages?.error || data.erro || 'Erro ao carregar clima');
            }

            setWeather({
               temp: data.temp,
               condition: data.condition,
               humidity: data.humidity,
               wind: data.wind,
               isDay: data.isDay
            });

         } catch (err: any) {
            console.error(err);
            setWeather({ temp: 25, condition: err.message || 'Erro na API', humidity: '--', wind: '--', isDay: 1 });
         } finally {
            setLoading(false);
         }
      }
      fetchWeather();

      // Atualiza a cada 30 minutos
      const interval = setInterval(fetchWeather, 30 * 60 * 1000);
      return () => clearInterval(interval);
   }, [cidade, estado]);

   const bgClass = weather.isDay ? 'bg-gradient-to-br from-sky-400 to-blue-600' : 'bg-gradient-to-br from-indigo-900 to-slate-900';

   if (loading) {
      return <div className={`w-screen h-screen ${bgClass}`}></div>;
   }

   return (
      <div className={`w-screen h-screen ${bgClass} flex flex-col items-center justify-between text-white overflow-hidden p-[4vh] transition-opacity duration-1000`}>

         <h1 className="text-[6vh] font-bold mt-[2vh] drop-shadow-lg text-center leading-tight max-w-[90vw] shrink-0">{cidade} - {estado}</h1>

         <div className="flex flex-col sm:flex-row items-center justify-center gap-[4vw] flex-1 min-h-0 py-[2vh] drop-shadow-lg w-full">
            {weather.condition === 'Chuvoso' ? (
               <CloudRain className="w-[25vh] h-[25vh] text-blue-200 shrink-0" />
            ) : weather.isDay ? (
               <Sun className="w-[25vh] h-[25vh] text-yellow-300 shrink-0" />
            ) : (
               <Cloud className="w-[25vh] h-[25vh] text-slate-300 shrink-0" />
            )}
            <div className="flex flex-col items-center">
               <span className="text-[20vh] font-black leading-none">{weather.temp}°C</span>
               <span className="text-[5vh] font-medium tracking-wide drop-shadow-md text-center mt-[1vh]">
                  {weather.condition}
               </span>
            </div>
         </div>

         <div className="flex flex-wrap justify-center items-center gap-[4vw] sm:gap-[8vw] mb-[2vh] text-[3.5vh] opacity-90 drop-shadow-md bg-black/20 px-[6vw] py-[2.5vh] rounded-[2.5vh] backdrop-blur-sm border border-white/10 max-w-[95vw] shrink-0">
            <div className="flex items-center gap-[2vw]">
               <CloudRain className="w-[5vh] h-[5vh] shrink-0" />
               <span className="whitespace-nowrap">Umidade: {weather.humidity}</span>
            </div>
            <div className="flex items-center gap-[2vw]">
               <Wind className="w-[5vh] h-[5vh] shrink-0" />
               <span className="whitespace-nowrap">Vento: {weather.wind}</span>
            </div>
         </div>

      </div>
   );
}
