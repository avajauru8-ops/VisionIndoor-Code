export interface LotteryInfo {
  title: string;
  color: string;
  balls: number;
}

export const LOTERIAS: Record<string, LotteryInfo> = {
  maismilionaria: { title: '+Milionária', color: '#B5007F', balls: 6 },
  megasena: { title: 'Mega-Sena', color: '#209869', balls: 6 },
  megavirada: { title: 'Mega da Virada', color: '#209869', balls: 6 },
  lotofacil: { title: 'Lotofácil', color: '#4A154B', balls: 15 },
  quina: { title: 'Quina', color: '#260085', balls: 5 },
  lotomania: { title: 'Lotomania', color: '#F78100', balls: 20 },
  timemania: { title: 'Timemania', color: '#00724F', balls: 7 },
  duplasena: { title: 'Dupla Sena', color: '#A61B29', balls: 12 },
  federal: { title: 'Loteria Federal', color: '#003399', balls: 5 },
  diadesorte: { title: 'Dia de Sorte', color: '#6A1B9A', balls: 7 },
  supersete: { title: 'Super Sete', color: '#0D47A1', balls: 7 },
};

export const LOTERIA_OPTIONS = Object.keys(LOTERIAS).map((id) => ({
  id,
  title: LOTERIAS[id].title,
}));

export const loteriaLabel = (tipo: string): string => LOTERIAS[tipo]?.title || 'Loteria';

export const loteriaColor = (tipo: string): string => LOTERIAS[tipo]?.color || '#209869';

export const loteriaBalls = (tipo: string): number => LOTERIAS[tipo]?.balls || 6;
