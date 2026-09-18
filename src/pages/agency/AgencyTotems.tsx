import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import { Tv, Plus, Search, Trash2, Camera, Play, Tag, ChevronDown, Square, X, SkipForward, ListVideo, AlertCircle } from 'lucide-react';

interface Agendamento {
  id: string;
  tipo: string;
  playlist_id: string;
  data_inicio: string;
  data_fim: string;
  hora_inicio: string;
  hora_fim: string;
  dia_semana: string;
  dia_mes: string;
  mes: string;
}

interface Totem {
  id: number;
  nome: string;
  device_id: string;
  status: string;
  ultima_sincronizacao: string | null;
  ultima_informacao?: string;
  auto_iniciar?: number | boolean;
  horario_liga?: string;
  horario_desliga?: string;
  horario_inicio?: string;
  horario_fim?: string;
  playlist_id?: string | null;
  fuso_horario?: string;
  agendamentos?: Agendamento[] | string | null;
}

// ──────────────────────────────────────────────────────────────
// Helpers: fuso horário e verificação de horário de funcionamento
// ──────────────────────────────────────────────────────────────

/** Retorna os minutos do dia atual no fuso horário do dispositivo */
function getCurrentMinutesInTz(fusoHorario?: string): number {
  const tz = fusoHorario || 'America/Sao_Paulo';
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('pt-BR', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(now);
    const h = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10);
    const m = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0', 10);
    return h * 60 + m;
  } catch {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }
}

/** Verifica se agora está fora do horário de funcionamento */
function isOutsideWorkingHours(totem: Totem): boolean {
  const hInicio = totem.horario_inicio || totem.horario_liga;
  const hFim = totem.horario_fim || totem.horario_desliga;
  if (!hInicio || !hFim) return false;

  const currentMinutes = getCurrentMinutesInTz(totem.fuso_horario);
  const [startH, startM] = hInicio.split(':').map(Number);
  const [endH, endM] = hFim.split(':').map(Number);
  const startMinutes = startH * 60 + (startM || 0);
  const endMinutes = endH * 60 + (endM || 0);

  if (startMinutes <= endMinutes) {
    return currentMinutes < startMinutes || currentMinutes > endMinutes;
  } else {
    // Horário que cruza meia-noite
    return currentMinutes < startMinutes && currentMinutes > endMinutes;
  }
}

/** Normaliza agendamentos (podem vir como string JSON do PHP) */
function parseAgendamentos(raw: Agendamento[] | string | null | undefined): Agendamento[] {
  if (!raw) return [];
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) ?? []; } catch { return []; }
  }
  return Array.isArray(raw) ? raw : [];
}

/** Verifica se existe agendamento ativo agora (considerando fuso do dispositivo) */
function hasActiveScheduleNow(totem: Totem): boolean {
  const agendamentos = parseAgendamentos(totem.agendamentos);
  if (agendamentos.length === 0) return false;

  const now = new Date();
  const currentMinutes = getCurrentMinutesInTz(totem.fuso_horario);

  for (const ag of agendamentos) {
    if (!ag.tipo || !ag.playlist_id) continue;

    // Período de datas
    if (ag.data_inicio && ag.data_fim) {
      const start = new Date(ag.data_inicio.replace(' ', 'T'));
      const end = new Date(ag.data_fim.replace(' ', 'T'));
      if (now < start || now > end) continue;
    }

    // Horário do dia
    if (ag.hora_inicio && ag.hora_fim) {
      const [sh, sm] = ag.hora_inicio.split(':').map(Number);
      const [eh, em] = ag.hora_fim.split(':').map(Number);
      const startM = sh * 60 + (sm || 0);
      const endM = eh * 60 + (em || 0);
      if (currentMinutes < startM || currentMinutes > endM) continue;
    }

    // Dia da semana
    if (ag.tipo === 'dia_semana' && ag.dia_semana !== '') {
      if (now.getDay().toString() !== ag.dia_semana) continue;
    }

    // Dia do mês
    if (ag.tipo === 'dia_mes' && ag.dia_mes !== '') {
      if (now.getDate().toString() !== ag.dia_mes) continue;
    }

    // Mês
    if (ag.tipo === 'mes' && ag.mes !== '') {
      if ((now.getMonth() + 1).toString() !== ag.mes) continue;
    }

    return true;
  }
  return false;
}

// ──────────────────────────────────────────────────────────────
// Lógica principal de status da tela
// ──────────────────────────────────────────────────────────────
const getTotemStatusInfo = (totem: Totem): { color: string; label: string } => {
  // Sem comunicação alguma
  if (!totem.ultima_sincronizacao) {
    if (isOutsideWorkingHours(totem)) {
      return { color: 'bg-[#bdc3c7]', label: 'SEM COMUNICAÇÃO FORA DO HORÁRIO DE FUNCIONAMENTO' };
    }
    return { color: 'bg-[#e74c3c]', label: 'SEM COMUNICAÇÃO' };
  }

  const lastSync = new Date(
    totem.ultima_sincronizacao.replace(' ', 'T') +
    (totem.ultima_sincronizacao.includes('Z') || totem.ultima_sincronizacao.includes('+') ? '' : '')
  );
  const now = new Date();
  const diffMinutes = (now.getTime() - lastSync.getTime()) / (1000 * 60);

  const isDeviceReportWorking =
    totem.status === 'FUNCIONANDO CORRETAMENTE' ||
    !!(totem.ultima_informacao && totem.ultima_informacao.startsWith('Reproduzindo'));

  if (diffMinutes > 15 || diffMinutes < -15) {
    // Dispositivo offline — verifica se é por horário ou agendamento
    if (isOutsideWorkingHours(totem)) {
      return { color: 'bg-[#bdc3c7]', label: 'SEM COMUNICAÇÃO FORA DO HORÁRIO DE FUNCIONAMENTO' };
    }
    // Agendamentos de descanso: tem horário de funcionamento mas não há agendamento ativo
    const agendamentos = parseAgendamentos(totem.agendamentos);
    if (agendamentos.length > 0 && !hasActiveScheduleNow(totem)) {
      return { color: 'bg-[#bdc3c7]', label: 'SEM COMUNICAÇÃO FORA DO HORÁRIO DE FUNCIONAMENTO' };
    }

    if (isDeviceReportWorking) {
      return { color: 'bg-[#2ecc71]', label: 'FUNCIONANDO CORRETAMENTE' };
    }
    return { color: 'bg-[#e74c3c]', label: 'SEM COMUNICAÇÃO' };
  } else if (diffMinutes > 5) {
    return { color: 'bg-[#f1c40f]', label: 'EM VERIFICAÇÃO' };
  } else {
    // Online — mas sem lista de reprodução → Em Verificação
    if (!totem.playlist_id) {
      return { color: 'bg-[#f1c40f]', label: 'EM VERIFICAÇÃO' };
    }
    return { color: 'bg-[#2ecc71]', label: 'FUNCIONANDO CORRETAMENTE' };
  }
};

const getTotemStatusColor = (totem: Totem) => getTotemStatusInfo(totem).color;
const getTotemStatusLabel = (totem: Totem) => getTotemStatusInfo(totem).label;

export default function AgencyTotems() {
  const navigate = useNavigate();
  const [totems, setTotems] = useState<Totem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [deviceId, setDeviceId] = useState('');
  const [error, setError] = useState('');

  const loadTotems = async () => {
    try {
      const data = await apiFetch('/api/totems');
      // Normaliza agendamentos (PHP retorna string JSON)
      const normalized = (data as Totem[]).map((t: Totem) => {
        if (typeof t.agendamentos === 'string') {
          try { t.agendamentos = JSON.parse(t.agendamentos) ?? []; } catch { t.agendamentos = []; }
        }
        return t;
      });
      setTotems(normalized);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTotems();
    const interval = setInterval(loadTotems, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await apiFetch('/api/totems', {
        method: 'POST',
        body: JSON.stringify({ device_id: deviceId }),
      });
      setDeviceId('');
      setShowForm(false);
      if (res && res.id) {
        navigate(`/agency/totems/${res.id}`);
      } else {
        loadTotems();
      }
    } catch (err: any) {
      if (err.message === 'Limite de Telas atingido' || err.code === 'LIMIT_REACHED') {
        setShowForm(false);
        setShowLimitModal(true);
      } else {
        setError(err.message);
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Deseja realmente desvincular esta Tela?')) {
      try {
        await apiFetch(`/api/totems/${id}`, { method: 'DELETE' });
        loadTotems();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Filtro de pesquisa
  const filteredTotems = totems.filter(t =>
    t.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.device_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-zinc-600 font-sans relative min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-[#104a9e] flex items-center gap-2 uppercase tracking-wide">
          <Tv className="w-6 h-6" />
          TELAS
        </h2>
        <button 
          onClick={() => { setShowForm(true); setError(''); }}
          className="bg-[#0066ff] hover:bg-[#0052cc] text-white text-[11px] font-bold px-4 py-2.5 rounded transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          VINCULAR TELA
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="relative w-full max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="w-4 h-4 text-[#104a9e]" />
          </span>
          <input 
            type="text" 
            placeholder="PESQUISAR" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full border-b border-zinc-200 bg-transparent py-2 pl-10 pr-4 text-xs font-bold text-[#104a9e] uppercase placeholder-[#104a9e] focus:outline-none focus:border-[#104a9e] transition-colors"
          />
        </div>
        
        <button className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase hover:text-zinc-800 transition-colors">
          <Tag className="w-4 h-4" />
          ETIQUETAS / PASTAS
        </button>
      </div>

      {/* Sorting / Pagination Info */}
      <div className="flex items-center justify-end gap-6 text-[10px] font-bold uppercase text-zinc-400">
        <div className="flex items-center gap-2">
          ORDENAR POR
          <button className="flex items-center gap-1 text-zinc-600 border-b border-zinc-300 pb-0.5">
            Data de Vínculo <ChevronDown className="w-3 h-3" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          TELAS POR PÁGINA
          <button className="flex items-center gap-1 text-zinc-600 border border-zinc-300 rounded px-2 py-0.5">
            15 <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200">
              <tr>
                <th className="px-4 py-3 w-10 text-center"><Square className="w-4 h-4 inline-block text-zinc-300" /></th>
                <th className="px-4 py-3 font-semibold">Nome</th>
                <th className="px-4 py-3 font-semibold">Lista de Reprodução</th>
                <th className="px-4 py-3 font-semibold text-center">Captura de Tela</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-zinc-300 border-t-[#104a9e] rounded-full animate-spin" />
                      Carregando telas...
                    </div>
                  </td>
                </tr>
              ) : filteredTotems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-400">
                    {searchTerm ? 'Nenhuma Tela encontrada para a pesquisa.' : 'Nenhuma Tela cadastrada.'}
                  </td>
                </tr>
              ) : (
                filteredTotems.map(totem => {
                  const statusInfo = getTotemStatusInfo(totem);
                  const hasPlaylist = !!totem.playlist_id;
                  return (
                  <tr key={totem.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors group">
                    <td className="px-4 py-4 text-center">
                      <Square className="w-4 h-4 inline-block text-zinc-300" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Link to={`/agency/totems/${totem.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                          {/* Play Icon Box */}
                          <div className={`w-8 h-8 rounded ${statusInfo.color} flex items-center justify-center shrink-0 shadow-sm transition-colors duration-300`}>
                            <Play className="w-4 h-4 text-white ml-0.5" />
                          </div>
                        </Link>
                        
                        {/* Botão de aviso sobre auto-start Android */}
                        <Link 
                          to="/agency/help/autostart"
                          className="w-7 h-7 rounded border border-orange-200 bg-orange-50 text-orange-400 flex items-center justify-center hover:bg-orange-100 transition-colors relative group/tip shrink-0"
                        >
                          <SkipForward className="w-3.5 h-3.5" />
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-2 bg-[#2d2d2d] text-white text-[11px] font-normal normal-case rounded shadow-xl opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all z-10 pointer-events-none text-center">
                            O app não iniciará automaticamente até que seja liberado a permissão de "sobreposição sobre outros apps" no Android.
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#2d2d2d]"></div>
                          </div>
                        </Link>

                        <Link to={`/agency/totems/${totem.id}`} className="font-semibold text-zinc-700 hover:text-[#104a9e] hover:underline whitespace-nowrap">
                          {totem.nome}
                        </Link>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded text-white whitespace-nowrap ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {hasPlaylist ? (
                        <PlaylistBadge totemId={totem.id} playlistId={totem.playlist_id!} />
                      ) : (
                        <Link
                          to={`/agency/totems/${totem.id}`}
                          className="inline-block bg-[#e74c3c] hover:bg-[#c0392b] text-white text-[10px] font-bold px-3 py-1.5 rounded transition-colors uppercase"
                        >
                          Selecione uma lista de reprodução para essa Tela!
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center relative">
                      <button
                        onClick={() => handleCaptureScreen(totem.id)}
                        className="w-8 h-8 rounded bg-[#9b59b6] flex items-center justify-center text-white mx-auto hover:bg-[#8e44ad] transition-colors"
                        title="Capturar tela"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(totem.id)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 text-zinc-400 hover:text-red-500 transition-all"
                        title="Desvincular Tela"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="text-[10px] text-zinc-500 uppercase tracking-wide">
        Mostrando de 1 a {filteredTotems.length} de {filteredTotems.length} TELA{filteredTotems.length !== 1 ? 'S' : ''}
      </div>

      {/* Legends */}
      <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-zinc-500 uppercase">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-4 bg-[#2ecc71] rounded-sm"></div>
          Funcionando corretamente
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-4 bg-[#f1c40f] rounded-sm"></div>
          Em Verificação
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-4 bg-[#e74c3c] rounded-sm"></div>
          Sem Comunicação
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-4 bg-[#bdc3c7] rounded-sm"></div>
          Sem Comunicação fora do Horário de Funcionamento
        </div>
      </div>

      {/* Modal Vincular Tela */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <h3 className="text-sm font-bold text-zinc-800">Vincular Tela</h3>
              <button onClick={() => setShowForm(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              {error && <div className="mb-4 text-xs text-red-600 bg-red-50 p-3 rounded">{error}</div>}
              
              <div className="mb-6">
                <label className="block text-xs font-bold text-zinc-600 mb-2">Código da Tela</label>
                <input
                  type="text"
                  required
                  className="w-full border border-zinc-300 rounded px-4 py-2.5 text-sm focus:border-[#104a9e] focus:outline-none transition-colors uppercase"
                  value={deviceId}
                  onChange={e => setDeviceId(e.target.value.toUpperCase())}
                  placeholder="Informe o código exibido na Tela"
                />
                <p className="text-[10px] text-zinc-400 mt-2">O nome da Tela será gerado automaticamente.</p>
              </div>
              
              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)} 
                  className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-700 transition-colors"
                >
                  CANCELAR
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-[#0066ff] hover:bg-[#0052cc] text-white rounded text-xs font-bold transition-colors"
                >
                  VINCULAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Limite de Telas Atingido */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className="text-sm font-bold text-zinc-800">Limite de Telas atingido</h3>
              <button onClick={() => setShowLimitModal(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 text-center">
              <p className="text-sm text-zinc-600 mb-2">
                Você poderá vincular mais Telas ao realizar o upgrade de seu <a href="#" className="text-[#104a9e] hover:underline">plano</a>.
              </p>
              <p className="text-sm text-zinc-600 mb-8">
                <a href="#" className="text-[#104a9e] hover:underline">Contate o Suporte</a> caso tenha qualquer dúvida.
              </p>
              
              <button 
                onClick={() => setShowLimitModal(false)} 
                className="px-8 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded text-xs font-bold uppercase transition-colors"
              >
                FECHAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Sub-componente: badge da playlist configurada
// Busca o nome da playlist via API e exibe como badge verde
// ──────────────────────────────────────────────────────────────
function PlaylistBadge({ totemId, playlistId }: { totemId: number; playlistId: string }) {
  const [playlistNome, setPlaylistNome] = useState<string | null>(null);

  useEffect(() => {
    if (!playlistId) return;
    apiFetch(`/api/listas/${playlistId}`)
      .then((data: any) => setPlaylistNome(data?.nome ?? null))
      .catch(() => setPlaylistNome(null));
  }, [playlistId]);

  return (
    <Link
      to={`/agency/totems/${totemId}`}
      className="inline-flex items-center gap-1.5 bg-[#2ecc71] hover:bg-[#27ae60] text-white text-[10px] font-bold px-3 py-1.5 rounded transition-colors uppercase max-w-[220px]"
      title={playlistNome ?? 'Lista configurada'}
    >
      <ListVideo className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate">{playlistNome ?? 'Lista configurada'}</span>
    </Link>
  );
}

// ──────────────────────────────────────────────────────────────
// Função: envia comando de captura de tela para o dispositivo
// ──────────────────────────────────────────────────────────────
async function handleCaptureScreen(id: number) {
  try {
    await apiFetch(`/api/totems/${id}/comando`, {
      method: 'POST',
      body: JSON.stringify({ comando: 'capturar_tela' }),
    });
    alert('Comando de captura de tela enviado! A imagem aparecerá em breve nas configurações da Tela.');
  } catch (err: any) {
    alert('Erro ao enviar comando: ' + err.message);
  }
}
