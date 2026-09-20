export interface TotemStatusData {
  status?: string;
  ultima_sincronizacao?: string | null;
  ultima_informacao?: string;
  horario_inicio?: string;
  horario_fim?: string;
  horario_liga?: string;
  horario_desliga?: string;
  fuso_horario?: string;
  playlist_id?: string | null;
  agendamentos?: any[] | string | null;
}

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

function isOutsideWorkingHours(totem: TotemStatusData): boolean {
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
    return currentMinutes < startMinutes && currentMinutes > endMinutes;
  }
}

function parseAgendamentos(raw: any[] | string | null | undefined): any[] {
  if (!raw) return [];
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) ?? []; } catch { return []; }
  }
  return Array.isArray(raw) ? raw : [];
}

function hasActiveScheduleNow(totem: TotemStatusData): boolean {
  const agendamentos = parseAgendamentos(totem.agendamentos);
  if (agendamentos.length === 0) return false;

  const now = new Date();
  const currentMinutes = getCurrentMinutesInTz(totem.fuso_horario);

  for (const ag of agendamentos) {
    if (!ag.tipo || !ag.playlist_id) continue;
    if (ag.data_inicio && ag.data_fim) {
      const start = new Date(ag.data_inicio.replace(' ', 'T'));
      const end = new Date(ag.data_fim.replace(' ', 'T'));
      if (now < start || now > end) continue;
    }
    if (ag.hora_inicio && ag.hora_fim) {
      const [sh, sm] = ag.hora_inicio.split(':').map(Number);
      const [eh, em] = ag.hora_fim.split(':').map(Number);
      const startM = sh * 60 + (sm || 0);
      const endM = eh * 60 + (em || 0);
      if (currentMinutes < startM || currentMinutes > endM) continue;
    }
    if (ag.tipo === 'dia_semana' && ag.dia_semana !== '') {
      if (now.getDay().toString() !== ag.dia_semana) continue;
    }
    if (ag.tipo === 'dia_mes' && ag.dia_mes !== '') {
      if (now.getDate().toString() !== ag.dia_mes) continue;
    }
    if (ag.tipo === 'mes' && ag.mes !== '') {
      if ((now.getMonth() + 1).toString() !== ag.mes) continue;
    }
    return true;
  }
  return false;
}

export function getTotemStatus(totem: TotemStatusData): { color: string; label: string; dotClass: string; iconBg: string } {
  if (!totem.ultima_sincronizacao) {
    if (isOutsideWorkingHours(totem)) {
      return { color: 'bg-zinc-100 text-zinc-400 border border-zinc-200', label: 'Offline', dotClass: 'bg-zinc-300', iconBg: 'bg-[#bdc3c7]' };
    }
    return { color: 'bg-rose-50 text-rose-600 border border-rose-100', label: 'Sem Comunicação', dotClass: 'bg-rose-500', iconBg: 'bg-[#e74c3c]' };
  }

  const lastSync = new Date(
    totem.ultima_sincronizacao.replace(' ', 'T') +
    (totem.ultima_sincronizacao.includes('Z') || totem.ultima_sincronizacao.includes('+') ? '' : '')
  );
  const now = new Date();
  const diffMinutes = (now.getTime() - lastSync.getTime()) / (1000 * 60);

  // Se nao sincronizou nos ultimos 5 minutos, esta offline
  if (diffMinutes > 5 || diffMinutes < -5) {
    if (isOutsideWorkingHours(totem)) {
      return { color: 'bg-zinc-100 text-zinc-400 border border-zinc-200', label: 'Offline', dotClass: 'bg-zinc-300', iconBg: 'bg-[#bdc3c7]' };
    }
    const agendamentos = parseAgendamentos(totem.agendamentos);
    if (agendamentos.length > 0 && !hasActiveScheduleNow(totem)) {
      return { color: 'bg-zinc-100 text-zinc-400 border border-zinc-200', label: 'Offline', dotClass: 'bg-zinc-300', iconBg: 'bg-[#bdc3c7]' };
    }
    return { color: 'bg-rose-50 text-rose-600 border border-rose-100', label: 'Sem Comunicação', dotClass: 'bg-rose-500', iconBg: 'bg-[#e74c3c]' };
  }

  // Sincronizou nos ultimos 5 minutos - esta online
  if (!totem.playlist_id) {
    return { color: 'bg-amber-50 text-amber-600 border border-amber-100', label: 'Em Verificação', dotClass: 'bg-amber-400', iconBg: 'bg-[#f1c40f]' };
  }
  return { color: 'bg-emerald-50 text-emerald-600 border border-emerald-100', label: 'Online', dotClass: 'bg-emerald-500 animate-pulse', iconBg: 'bg-[#2ecc71]' };
}
