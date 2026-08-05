import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Cloud, CloudLightning, CloudRain, CloudSnow, Sun, Wind } from 'lucide-react';

export default function WidgetClima() {
  const [searchParams] = useSearchParams();
  const cidade = searchParams.get('cidade') || 'SÃ£o Paulo';
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
    <div className={`w-screen h-screen ${weather.isDay ? 'bg-gradient-to-br from-sky-400 to-blue-600' : 'bg-gradient-to-br from-indigo-900 to-slate-900'} flex flex-col items-center justify-center text-white p-8`}>
       <h1 className="text-6xl font-bold mb-4 drop-shadow-lg">{cidade} - {estado}</h1>
       <div className="flex items-center gap-8 my-8 drop-shadow-lg">
          {weather.condition === 'Chuvoso' ? (
             <CloudRain className="w-48 h-48 text-blue-200" />
          ) : weather.isDay ? (
             <Sun className="w-48 h-48 text-yellow-300" />
          ) : (
             <Cloud className="w-48 h-48 text-slate-300" />
          )}
          <span className="text-9xl font-black">{weather.temp}Â°C</span>
       </div>
       <div className="text-4xl font-medium tracking-wide drop-shadow-md">
          {weather.condition}
       </div>
       <div className="flex gap-16 mt-12 text-3xl opacity-90 drop-shadow-md bg-black/20 px-12 py-6 rounded-3xl backdrop-blur-sm border border-white/10">
          <div className="flex items-center gap-4">
             <CloudRain className="w-10 h-10" />
             <span>Umidade: {weather.humidity}</span>
          </div>
          <div className="flex items-center gap-4">
             <Wind className="w-10 h-10" />
             <span>Vento: {weather.wind}</span>
          </div>
       </div>
    </div>
  );
}
