import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Cloud, CloudLightning, CloudRain, CloudSnow, Sun, Wind } from 'lucide-react';

export default function WidgetClima() {
  const [searchParams] = useSearchParams();
  const cidade = searchParams.get('cidade') || 'São Paulo';
  const estado = searchParams.get('estado') || 'SP';
  
  const [weather, setWeather] = useState({
    temp: 0,
    condition: 'Carregando...',
    humidity: '0%',
    wind: '0 km/h',
    isDay: 1
  });

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
       }
    }
    fetchWeather();
    
    // Atualiza a cada 30 minutos
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [cidade, estado]);

  return (
    <div className={`w-screen h-screen ${weather.isDay ? 'bg-gradient-to-br from-sky-400 to-blue-600' : 'bg-gradient-to-br from-indigo-900 to-slate-900'} flex flex-col items-center justify-center text-white overflow-hidden p-[4vmin]`}>
       <h1 className="text-[6vmin] font-bold mb-[2vmin] drop-shadow-lg text-center leading-tight max-w-[90vw]">{cidade} - {estado}</h1>
       <div className="flex flex-col sm:flex-row items-center gap-[4vmin] my-[4vmin] drop-shadow-lg">
          {weather.condition === 'Chuvoso' ? (
             <CloudRain className="w-[20vmin] h-[20vmin] text-blue-200 shrink-0" />
          ) : weather.isDay ? (
             <Sun className="w-[20vmin] h-[20vmin] text-yellow-300 shrink-0" />
          ) : (
             <Cloud className="w-[20vmin] h-[20vmin] text-slate-300 shrink-0" />
          )}
          <span className="text-[16vmin] font-black leading-none">{weather.temp}°C</span>
       </div>
       <div className="text-[5vmin] font-medium tracking-wide drop-shadow-md text-center">
          {weather.condition}
       </div>
       <div className="flex flex-wrap justify-center gap-[4vmin] sm:gap-[8vmin] mt-[6vmin] text-[3.5vmin] opacity-90 drop-shadow-md bg-black/20 px-[6vmin] py-[3vmin] rounded-[3vmin] backdrop-blur-sm border border-white/10 max-w-[95vw]">
          <div className="flex items-center gap-[2vmin]">
             <CloudRain className="w-[4.5vmin] h-[4.5vmin] shrink-0" />
             <span className="whitespace-nowrap">Umidade: {weather.humidity}</span>
          </div>
          <div className="flex items-center gap-[2vmin]">
             <Wind className="w-[4.5vmin] h-[4.5vmin] shrink-0" />
             <span className="whitespace-nowrap">Vento: {weather.wind}</span>
          </div>
       </div>
    </div>
  );
}
