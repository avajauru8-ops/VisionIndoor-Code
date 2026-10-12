import { useEffect, useRef } from 'react';
import { apiFetch } from '../lib/api';

export interface ResultadoValidacao {
  verificados: number;
  corrigidos: number;
  detalhes?: Array<{
    totem_id: string;
    nome?: string | null;
    device_id?: string | null;
    playlist_id_antiga: string;
    motivo: string;
  }>;
}

/**
 * Verifica a cada 10 segundos se algum totem cadastrado está com um id de lista
 * antigo (lista apagada ou lista de outro usuário) e desvincula automaticamente.
 * Quando algo é corrigido, chama `onCorrigido` para a tela recarregar os dados.
 */
export function useValidacaoVinculos(
  onCorrigido?: (resultado: ResultadoValidacao) => void,
  intervaloMs = 10000
) {
  const callbackRef = useRef(onCorrigido);
  callbackRef.current = onCorrigido;

  useEffect(() => {
    let emAndamento = false;

    const validar = async () => {
      if (emAndamento) return;
      emAndamento = true;
      try {
        const res = await apiFetch('/api/totems/validar-vinculos') as ResultadoValidacao;
        if (res && res.corrigidos > 0) {
          console.info('[Validação de vínculos] ids antigos removidos:', res.detalhes);
          callbackRef.current?.(res);
        }
      } catch (err) {
        // Falha de rede não pode quebrar o painel
      } finally {
        emAndamento = false;
      }
    };

    validar();
    const intervalId = setInterval(validar, intervaloMs);
    return () => clearInterval(intervalId);
  }, [intervaloMs]);
}
