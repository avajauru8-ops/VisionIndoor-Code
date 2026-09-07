import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Monitor, Settings, Puzzle, Calendar, Bell, Activity, 
  Camera, RotateCcw, Trash2, ShieldAlert, X, Save, Pencil, ExternalLink,
  BarChart3, Download, ChevronDown, ChevronUp, Clock, Image, Film, Radio
} from 'lucide-react';
import { format } from 'date-fns';

interface Totem {
  id: string;
  nome: string;
  device_id: string;
  status: string;
  ultima_informacao?: string;
  ultima_sincronizacao: string | null;
  auto_iniciar?: number | boolean;
  versao_app?: string;
  sistema_operacional?: string;
  resolucao?: string;
  espaco_utilizado?: string;
  espaco_livre?: string;
  playlist_id?: string | null;
  rotacao?: string;
  iniciar_tv_energia?: number | boolean;
  fuso_horario?: string;
  exibir_barra_tarefas?: number | boolean;
  audio_ligado?: number | boolean;
  auto_reiniciar_horas?: number;
  exibir_notificacoes?: number | boolean;
  limpeza_automatica?: number | boolean;
  tempo_exibicao_padrao?: number;
  id_monetizacao?: string;
  ultima_captura_tela?: string;
  horario_liga?: string;
  horario_desliga?: string;
  horario_inicio?: string;
  horario_fim?: string;
}

export default function AgencyTotemSettings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [totem, setTotem] = useState<Totem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('configuracoes');
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [nome, setNome] = useState('');
  const [listaReproducao, setListaReproducao] = useState('');
  const [listas, setListas] = useState<{id: string, nome: string}[]>([]);
  const [rotacao, setRotacao] = useState('padrao');

  // Extras State
  const [autoIniciar, setAutoIniciar] = useState(false);
  const [iniciarTvEnergia, setIniciarTvEnergia] = useState(false);
  const [fusoHorario, setFusoHorario] = useState('America/Sao_Paulo');
  const [exibirBarraTarefas, setExibirBarraTarefas] = useState(true);
  const [audioLigado, setAudioLigado] = useState(true);
  const [autoReiniciarHoras, setAutoReiniciarHoras] = useState(0);
  const [exibirNotificacoes, setExibirNotificacoes] = useState(false);
  const [limpezaAutomatica, setLimpezaAutomatica] = useState(true);
  const [tempoExibicao, setTempoExibicao] = useState(10);
  const [idMonetizacao, setIdMonetizacao] = useState('');
  
  // Agendamento State
  const [horarioInicio, setHorarioInicio] = useState('');
  const [horarioFim, setHorarioFim] = useState('');
  const [agendamentos, setAgendamentos] = useState<Array<{
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
  }>>([]);

  const SCHEDULE_TYPES = [
    { value: 'periodo_dias_horas', label: 'Período de Dias e Horas' },
    { value: 'periodo_horas_dia', label: 'Período de Horas do Dia' },
    { value: 'periodo_horas_dia_especifico', label: 'Período de Horas do Dia em Dia Específico' },
    { value: 'dia_semana', label: 'Dia da Semana' },
    { value: 'dia_mes', label: 'Dia do Mês' },
    { value: 'mes', label: 'Mês' },
  ];

  const DIAS_SEMANA = [
    { value: '0', label: 'Domingo' },
    { value: '1', label: 'Segunda-feira' },
    { value: '2', label: 'Terça-feira' },
    { value: '3', label: 'Quarta-feira' },
    { value: '4', label: 'Quinta-feira' },
    { value: '5', label: 'Sexta-feira' },
    { value: '6', label: 'Sábado' },
  ];

  const MESES = [
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ];

  const addAgendamento = () => {
    setAgendamentos([...agendamentos, {
      id: Date.now().toString(),
      tipo: '',
      playlist_id: '',
      data_inicio: '',
      data_fim: '',
      hora_inicio: '',
      hora_fim: '',
      dia_semana: '',
      dia_mes: '',
      mes: '',
    }]);
  };

  const removeAgendamento = (idx: number) => {
    setAgendamentos(agendamentos.filter((_, i) => i !== idx));
  };

  const updateAgendamento = (idx: number, field: string, value: string) => {
    setAgendamentos(agendamentos.map((a, i) => i === idx ? { ...a, [field]: value } : a));
  };
  
  // Replace Screen State
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [replaceCode, setReplaceCode] = useState('');

  useEffect(() => {
    loadTotem();
    const intervalId = setInterval(loadTotemStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(intervalId);
  }, [id]);

  const loadTotemStatus = async () => {
    try {
      const data = await apiFetch(`/api/totems/${id}`);
      setTotem(data);
    } catch (err) {
      console.error('Failed to poll totem status', err);
    }
  };

  const getCalculatedStatusInfo = () => {
    if (!totem) return { status: 'Desconhecido', color: 'text-orange-500', info: 'Aguardando Conteúdo para Veiculação' };
    
    if (!totem.ultima_sincronizacao) {
      return { 
        status: totem.status || 'Desconhecido', 
        color: totem.status === 'FUNCIONANDO CORRETAMENTE' || totem.status === 'online' ? 'text-green-600' : 'text-orange-500',
        info: totem.ultima_informacao || 'Aguardando Conteúdo para Veiculação'
      };
    }

    const lastSync = new Date(totem.ultima_sincronizacao.replace(' ', 'T') + 'Z');
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSync.getTime()) / (1000 * 60);

    if (diffMinutes > 15 || diffMinutes < -15) {
      // Check if out of operating hours
      const hInicio = totem.horario_liga || totem.horario_inicio;
      const hFim = totem.horario_desliga || totem.horario_fim;
      
      let isOut = false;
      if (hInicio && hFim) {
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const [startH, startM] = hInicio.split(':').map(Number);
        const [endH, endM] = hFim.split(':').map(Number);
        
        const startMinutes = startH * 60 + (startM || 0);
        const endMinutes = endH * 60 + (endM || 0);
        
        if (startMinutes <= endMinutes) {
          isOut = currentMinutes < startMinutes || currentMinutes > endMinutes;
        } else {
          isOut = currentMinutes < startMinutes && currentMinutes > endMinutes;
        }
      }

      if (isOut) {
        return { status: 'SEM COMUNICAÇÃO (FORA DE HORÁRIO)', color: 'text-gray-400', info: 'Dispositivo Offline (Fora do Horário)' };
      }
      return { status: 'SEM COMUNICAÇÃO', color: 'text-red-500', info: 'Dispositivo Offline' };
    } else if (diffMinutes > 5) {
      return { status: 'EM VERIFICAÇÃO', color: 'text-yellow-500', info: totem.ultima_informacao || 'Aguardando Conteúdo para Veiculação' };
    }
    
    // Online
    return { 
      status: totem.status || 'FUNCIONANDO CORRETAMENTE', 
      color: totem.status === 'FUNCIONANDO CORRETAMENTE' || totem.status === 'online' ? 'text-green-600' : 'text-yellow-500',
      info: totem.ultima_informacao || 'Aguardando Conteúdo para Veiculação'
    };
  };

  const loadTotem = async () => {
    try {
      const [data, listasData] = await Promise.all([
        apiFetch(`/api/totems/${id}`),
        apiFetch('/api/listas')
      ]);
      setTotem(data);
      setNome(data.nome);
      setListaReproducao(data.playlist_id || '');
      setRotacao(data.rotacao || 'padrao');
      setListas(listasData || []);
      
      
        const parseBool = (val: any, defaultVal: boolean) => {
          if (val === undefined || val === null) return defaultVal;
          if (val === '1' || val === 1 || val === true || val === 'true') return true;
          if (val === '0' || val === 0 || val === false || val === 'false') return false;
          return !!val;
        };

        // Load Extras state safely
        setAutoIniciar(parseBool(data.auto_iniciar, true));
        setIniciarTvEnergia(parseBool(data.iniciar_tv_energia, false));
        setFusoHorario(data.fuso_horario || 'America/Sao_Paulo');
        setExibirBarraTarefas(parseBool(data.exibir_barra_tarefas, true));
        setAudioLigado(parseBool(data.audio_ligado, true));
        setAutoReiniciarHoras(data.auto_reiniciar_horas || 0);
        setExibirNotificacoes(parseBool(data.exibir_notificacoes, false));
        setLimpezaAutomatica(parseBool(data.limpeza_automatica, true));
        setTempoExibicao(data.tempo_exibicao_padrao || 15);

      setIdMonetizacao(data.id_monetizacao || '');
      setHorarioInicio(data.horario_inicio || data.horario_liga || '');
      setHorarioFim(data.horario_fim || data.horario_desliga || '');
      
      // Load agendamentos
      if (data.agendamentos && Array.isArray(data.agendamentos)) {
        setAgendamentos(data.agendamentos);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await apiFetch(`/api/totems/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          nome, 
          playlist_id: listaReproducao,
          rotacao,
          auto_iniciar: autoIniciar,
          iniciar_tv_energia: iniciarTvEnergia,
          fuso_horario: fusoHorario,
          exibir_barra_tarefas: exibirBarraTarefas,
          audio_ligado: audioLigado,
          auto_reiniciar_horas: autoReiniciarHoras,
          exibir_notificacoes: exibirNotificacoes,
          limpeza_automatica: limpezaAutomatica,
          tempo_exibicao_padrao: tempoExibicao,
          id_monetizacao: idMonetizacao,
          horario_inicio: horarioInicio,
          horario_fim: horarioFim,
          agendamentos: agendamentos
        }),
      });
      alert('Configurações salvas com sucesso!');
      setIsEditing(false);
      loadTotem();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async () => {
    if (confirm('Deseja realmente desvincular esta Tela?')) {
      try {
        await apiFetch(`/api/totems/${id}`, { method: 'DELETE' });
        navigate('/agency/totems'); // Redirecting back to TV lists
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleReplace = async () => {
    if (!replaceCode.trim()) {
      alert('Por favor, informe o código da nova Tela.');
      return;
    }
    
    try {
      await apiFetch(`/api/totems/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ device_id: replaceCode.trim() })
      });
      alert('Tela substituída com sucesso!');
      setShowReplaceModal(false);
      setReplaceCode('');
      navigate('/agency/totems');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCommand = async (commandName: string) => {
    try {
      await apiFetch(`/api/totems/${id}/comando`, {
        method: 'POST',
        body: JSON.stringify({ comando: commandName })
      });
      alert(`Comando '${commandName}' enviado para a TV com sucesso!`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#104a9e]"></div>
      </div>
    );
  }

  if (!totem) {
    return <div className="p-8 text-center text-red-500">Tela não encontrada. {error}</div>;
  }

  return (
    <div className="space-y-6 text-zinc-600 font-sans min-h-full max-w-[1200px] mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Monitor className="w-6 h-6 text-[#104a9e]" />
          <h2 className="text-sm font-bold text-[#104a9e] uppercase tracking-wide flex items-center">
            <button onClick={() => navigate('/agency/totems')} className="hover:underline">TELAS</button>
            <span className="mx-2 text-zinc-300">/</span> 
            <span className="text-zinc-400">{totem.nome}</span>
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <button 
                onClick={() => { setIsEditing(false); loadTotem(); }} 
                className="bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-[10px] font-bold px-4 py-2.5 rounded transition-colors flex items-center gap-2 uppercase"
              >
                <X className="w-3.5 h-3.5" />
                CANCELAR EDIÇÃO
              </button>
              <button 
                onClick={handleSave}
                className="bg-[#0066ff] hover:bg-[#0052cc] text-white text-[10px] font-bold px-5 py-2.5 rounded transition-colors flex items-center gap-2 uppercase"
              >
                <Save className="w-3.5 h-3.5" />
                SALVAR
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="bg-[#20b2aa] hover:bg-[#1da19a] text-white text-[10px] font-bold px-5 py-2.5 rounded transition-colors flex items-center gap-2 uppercase"
            >
              <Pencil className="w-3.5 h-3.5" />
              HABILITAR EDIÇÃO
            </button>
          )}
        </div>
      </div>

      {/* Red Alert Banner */}
      {!listaReproducao && (
        <div className="bg-[#e74c3c] text-white text-xs font-bold text-center py-3 px-4 rounded flex items-center justify-center relative">
          <span>Escolha uma Lista de Reprodução para essa Tela!<br/>Senão, nenhum conteúdo será exibido.</span>
          <button className="absolute right-4 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1 border-b border-zinc-200 mt-6">
        {[
          { id: 'configuracoes', label: 'Configurações e Status', icon: Settings },
          { id: 'extras', label: 'Extras', icon: Puzzle },
          { id: 'agendamentos', label: 'Agendamentos', icon: Calendar },
          { id: 'notificacoes', label: 'Notificações', icon: Bell },
          { id: 'relatorio', label: 'Relatório de Exibição', icon: Activity },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase transition-colors rounded-t-lg ${
              activeTab === tab.id 
                ? 'bg-white text-[#104a9e] border-t border-l border-r border-zinc-200 -mb-px'
                : 'text-zinc-400 hover:text-zinc-600 border-transparent'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white border border-zinc-200 border-t-0 -mt-px rounded-b-lg p-6 md:p-8 space-y-10">
        
        {/* Configurações básicas (Only on Configurações tab) */}
        {activeTab === 'configuracoes' && (
        <section>
          <h3 className="text-[#104a9e] text-sm font-bold flex items-center gap-2 mb-6">
            <Settings className="w-4 h-4" />
            Configurações básicas
          </h3>
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <label className="text-xs font-bold text-zinc-500 w-40 md:text-right">Nome: <span className="text-red-500">*</span></label>
              {isEditing ? (
                <input 
                  type="text" 
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  className="flex-1 border border-zinc-300 rounded px-3 py-2 text-sm text-zinc-700 focus:border-[#104a9e] focus:outline-none border-dashed"
                />
              ) : (
                <div className="flex-1 text-sm text-[#104a9e] border-b border-dashed border-zinc-200 pb-1">
                  {nome}
                </div>
              )}
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <label className="text-xs font-bold text-zinc-500 w-40 md:text-right">Lista de Reprodução:</label>
              {isEditing ? (
                <select 
                  value={listaReproducao}
                  onChange={e => setListaReproducao(e.target.value)}
                  className={`flex-1 border-2 rounded px-3 py-2 text-sm text-zinc-700 focus:outline-none ${!listaReproducao ? 'border-[#e74c3c] border-dashed' : 'border-zinc-300'}`}
                >
                  <option value="">Selecione uma Lista de Reprodução</option>
                  {listas.map(l => (
                    <option key={l.id} value={l.id}>{l.nome}</option>
                  ))}
                </select>
              ) : (
                <div 
                  className="flex-1 text-sm text-[#104a9e] border-b border-dashed border-zinc-200 pb-1 flex items-center gap-1 cursor-pointer hover:text-[#0052cc] group"
                  onClick={() => listaReproducao ? navigate(`/agency/listas/${listaReproducao}`) : null}
                >
                  {listaReproducao ? listas.find(l => l.id === listaReproducao)?.nome : 'Nenhuma'}
                  {listaReproducao && <ExternalLink className="w-3 h-3 text-[#104a9e] group-hover:text-[#0052cc]" />}
                </div>
              )}
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <label className="text-xs font-bold text-zinc-500 w-40 md:text-right">Rotação:</label>
              {isEditing ? (
                <select 
                  value={rotacao}
                  onChange={e => setRotacao(e.target.value)}
                  className="flex-1 border border-zinc-300 rounded px-3 py-2 text-sm text-zinc-700 focus:border-[#104a9e] focus:outline-none border-dashed"
                >
                  <option value="padrao">Horizontal (Padrão)</option>
                  <option value="90">Vertical (90 Graus)</option>
                  <option value="180">Horizontal Invertido (180 Graus)</option>
                  <option value="270">Vertical Invertido (270 Graus)</option>
                </select>
              ) : (
                <div className="flex-1 text-sm text-[#104a9e] border-b border-dashed border-zinc-200 pb-1">
                  {rotacao === '90' ? 'Vertical (90 Graus)' : rotacao === '180' ? 'Horizontal Invertido (180 Graus)' : rotacao === '270' ? 'Vertical Invertido (270 Graus)' : 'Horizontal (Padrão)'}
                </div>
              )}
            </div>
            <div className="flex md:pl-44">
              <p className="text-[10px] text-zinc-400 bg-zinc-50 p-2 rounded flex gap-2 items-start border border-zinc-100">
                <ShieldAlert className="w-3 h-3 text-[#104a9e] shrink-0 mt-0.5" />
                As alterações acima agora são aplicadas quase em tempo real (aprox. 3 segundos) na Tela. As alterações somente terão efeito se/ou quando a Tela estiver Online / Funcionando corretamente.
              </p>
            </div>
          </div>
        </section>
        )}

        {/* Extras Tab Content */}
        {activeTab === 'extras' && (
          <div className="space-y-10">
            {/* Painel de Controle */}
            <section className="border-b border-zinc-100 pb-8">
              <fieldset disabled={!isEditing} className="contents">
              <h3 className="text-[#104a9e] text-sm font-bold flex items-center gap-2 mb-6">
                <Settings className="w-4 h-4" />
                Painel de controle
              </h3>
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <label className="text-xs font-bold text-zinc-500 w-64 md:text-right shrink-0">Auto-Iniciar Aplicativo:</label>
                  <select 
                    value={autoIniciar ? 'sim' : 'nao'}
                    onChange={e => setAutoIniciar(e.target.value === 'sim')}
                    className="flex-1 max-w-sm border border-zinc-300 rounded px-3 py-2 text-sm text-zinc-700 focus:border-[#104a9e] focus:outline-none"
                  >
                    <option value="sim">Sim (Recomendado)</option>
                    <option value="nao">Não</option>
                  </select>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <label className="text-xs font-bold text-zinc-500 w-64 md:text-right shrink-0">Iniciar Tela ao Ligar na Energia:</label>
                  <select 
                    value={iniciarTvEnergia ? 'sim' : 'nao'}
                    onChange={e => setIniciarTvEnergia(e.target.value === 'sim')}
                    className="flex-1 max-w-sm border border-zinc-300 rounded px-3 py-2 text-sm text-zinc-700 focus:border-[#104a9e] focus:outline-none"
                  >
                    <option value="sim">Sim</option>
                    <option value="nao">Não</option>
                  </select>
                </div>
              </div>
              </fieldset>
            </section>

            {/* Idioma e Fuso */}
            <section className="border-b border-zinc-100 pb-8">
              <fieldset disabled={!isEditing} className="contents">
              <h3 className="text-[#104a9e] text-sm font-bold flex items-center gap-2 mb-6">
                <Calendar className="w-4 h-4" />
                Idioma de Exibição
              </h3>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <label className="text-xs font-bold text-zinc-500 w-64 md:text-right shrink-0">Fuso Horário:</label>
                <select 
                  value={fusoHorario}
                  onChange={e => setFusoHorario(e.target.value)}
                  className="flex-1 max-w-sm border border-zinc-300 rounded px-3 py-2 text-sm text-zinc-700 focus:border-[#104a9e] focus:outline-none"
                >
                  <option value="America/Sao_Paulo">America/Sao_Paulo (UTC-03:00)</option>
                  <option value="America/Manaus">America/Manaus (UTC-04:00)</option>
                  <option value="America/Belem">America/Belem (UTC-03:00)</option>
                  <option value="America/Rio_Branco">America/Rio_Branco (UTC-05:00)</option>
                  <option value="America/Fortaleza">America/Fortaleza (UTC-03:00)</option>
                  <option value="America/Recife">America/Recife (UTC-03:00)</option>
                </select>
              </div>
              </fieldset>
            </section>

            {/* App Settings */}
            <section className="border-b border-zinc-100 pb-8">
              <fieldset disabled={!isEditing} className="contents">
              <h3 className="text-[#104a9e] text-sm font-bold flex items-center gap-2 mb-6">
                <Monitor className="w-4 h-4" />
                Configurações do App
              </h3>
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <label className="text-xs font-bold text-zinc-500 w-64 md:text-right shrink-0">Barra de Tarefas do Android:</label>
                  <select 
                    value={exibirBarraTarefas ? 'exibir' : 'ocultar'}
                    onChange={e => setExibirBarraTarefas(e.target.value === 'exibir')}
                    className="flex-1 max-w-sm border border-zinc-300 rounded px-3 py-2 text-sm text-zinc-700 focus:border-[#104a9e] focus:outline-none"
                  >
                    <option value="ocultar">Ocultar</option>
                    <option value="exibir">Exibir</option>
                  </select>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <label className="text-xs font-bold text-zinc-500 w-64 md:text-right shrink-0">Áudio Principal:</label>
                  <select 
                    value={audioLigado ? 'ligado' : 'desligado'}
                    onChange={e => setAudioLigado(e.target.value === 'ligado')}
                    className="flex-1 max-w-sm border border-zinc-300 rounded px-3 py-2 text-sm text-zinc-700 focus:border-[#104a9e] focus:outline-none"
                  >
                    <option value="ligado">Ligado (Reproduzir Som)</option>
                    <option value="desligado">Desligado (Mudo)</option>
                  </select>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <label className="text-xs font-bold text-zinc-500 w-64 md:text-right shrink-0">Auto-Reiniciar Diário:</label>
                  <select 
                    value={autoReiniciarHoras.toString()}
                    onChange={e => setAutoReiniciarHoras(parseInt(e.target.value))}
                    className="flex-1 max-w-sm border border-zinc-300 rounded px-3 py-2 text-sm text-zinc-700 focus:border-[#104a9e] focus:outline-none"
                  >
                    <option value="0">Desligado (Não reiniciar)</option>
                    <option value="12">A cada 12 horas</option>
                    <option value="24">A cada 24 horas</option>
                    <option value="48">A cada 48 horas</option>
                  </select>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <label className="text-xs font-bold text-zinc-500 w-64 md:text-right shrink-0">Notificações do Android:</label>
                  <select 
                    value={exibirNotificacoes ? 'exibir' : 'ocultar'}
                    onChange={e => setExibirNotificacoes(e.target.value === 'exibir')}
                    className="flex-1 max-w-sm border border-zinc-300 rounded px-3 py-2 text-sm text-zinc-700 focus:border-[#104a9e] focus:outline-none"
                  >
                    <option value="ocultar">Ocultar</option>
                    <option value="exibir">Exibir</option>
                  </select>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <label className="text-xs font-bold text-zinc-500 w-64 md:text-right shrink-0">Gerenciamento de Armazenamento:</label>
                  <select 
                    value={limpezaAutomatica ? 'automatica' : 'manual'}
                    onChange={e => setLimpezaAutomatica(e.target.value === 'automatica')}
                    className="flex-1 max-w-sm border border-zinc-300 rounded px-3 py-2 text-sm text-zinc-700 focus:border-[#104a9e] focus:outline-none"
                  >
                    <option value="automatica">Limpeza Automática (Recomendado)</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <label className="text-xs font-bold text-zinc-500 w-64 md:text-right shrink-0">Tempo de Exibição Padrão (s):</label>
                  <input 
                    type="number"
                    min="1"
                    value={tempoExibicao}
                    onChange={e => setTempoExibicao(parseInt(e.target.value) || 10)}
                    className="flex-1 max-w-sm border border-zinc-300 rounded px-3 py-2 text-sm text-zinc-700 focus:border-[#104a9e] focus:outline-none"
                  />
                </div>
              </div>
              </fieldset>
            </section>

            {/* Comandos / Ações */}
            <section className="border-b border-zinc-100 pb-8">
              <h3 className="text-[#104a9e] text-sm font-bold flex items-center gap-2 mb-6">
                <Activity className="w-4 h-4" />
                Ação / Comando
              </h3>
              <div className="flex flex-wrap items-center gap-3 md:pl-28">
                <button onClick={() => handleCommand('limpar_dados')} className="bg-[#e67e22] hover:bg-[#d35400] text-white text-[10px] font-bold px-4 py-2.5 rounded uppercase flex items-center gap-2 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                  LIMPAR DADOS
                </button>
                <button onClick={() => handleCommand('reiniciar')} className="bg-[#3498db] hover:bg-[#2980b9] text-white text-[10px] font-bold px-4 py-2.5 rounded uppercase flex items-center gap-2 transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" />
                  REINICIAR APP
                </button>
                <button onClick={() => handleCommand('formatar')} className="bg-[#c0392b] hover:bg-[#a93226] text-white text-[10px] font-bold px-4 py-2.5 rounded uppercase flex items-center gap-2 transition-colors">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  FORMATAR
                </button>
                <button onClick={() => handleCommand('reiniciar_tv')} className="bg-[#7f8c8d] hover:bg-[#6c7a7d] text-white text-[10px] font-bold px-4 py-2.5 rounded uppercase flex items-center gap-2 transition-colors">
                  <Monitor className="w-3.5 h-3.5" />
                  REINICIAR TELA
                </button>
              </div>
            </section>

            {/* Monetização */}
            <section>
              <fieldset disabled={!isEditing} className="contents">
              <h3 className="text-[#104a9e] text-sm font-bold flex items-center gap-2 mb-6">
                <Puzzle className="w-4 h-4" />
                Monetização
              </h3>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <label className="text-xs font-bold text-zinc-500 w-64 md:text-right shrink-0">ID de Monetização (Ex: GrandMidia):</label>
                <input 
                  type="text" 
                  value={idMonetizacao}
                  onChange={e => setIdMonetizacao(e.target.value)}
                  placeholder="Deixe em branco para desativar"
                  className="flex-1 max-w-sm border border-zinc-300 rounded px-3 py-2 text-sm text-zinc-700 focus:border-[#104a9e] focus:outline-none border-dashed"
                />
              </div>
              </fieldset>
            </section>
          </div>
        )}

        {/* Agendamentos Tab Content */}
        {activeTab === 'agendamentos' && (
          <div className="space-y-6">
            <section>
              <fieldset disabled={!isEditing} className="contents">
                <h3 className="text-[#104a9e] text-sm font-bold flex items-center gap-2 mb-6">
                  <Calendar className="w-4 h-4" />
                  Agendamentos
                </h3>
                
                <div className="flex flex-col gap-4 max-w-4xl">
                  {agendamentos.map((ag, idx) => (
                    <div key={ag.id} className="flex flex-col md:flex-row md:items-start gap-4">
                      <span className="text-xs font-bold text-zinc-500 w-32 md:text-right shrink-0 mt-2">
                        {idx === 0 ? 'Agendamento:' : ''}
                      </span>
                      
                      <div className="flex-1 bg-zinc-50 border border-zinc-200 rounded p-3 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <button 
                            className="text-zinc-400 hover:text-red-500 shrink-0"
                            onClick={() => removeAgendamento(idx)}
                            disabled={!isEditing}
                          >
                            <X className="w-4 h-4" />
                          </button>
                          
                          <span className="text-xs text-zinc-500">Tipo:</span>
                          <select 
                            value={ag.tipo}
                            onChange={e => updateAgendamento(idx, 'tipo', e.target.value)}
                            className="border border-zinc-300 rounded px-2 py-1 text-sm bg-white text-zinc-600 flex-1 min-w-[200px]"
                          >
                            <option value="">Selecione o Tipo de Agendamento</option>
                            {SCHEDULE_TYPES.map(t => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                        </div>

                        {ag.tipo && (
                          <div className="flex items-center gap-3 flex-wrap pl-7">
                            <span className="text-xs text-zinc-500">lista de reprodução</span>
                            <select 
                              value={ag.playlist_id}
                              onChange={e => updateAgendamento(idx, 'playlist_id', e.target.value)}
                              className="border border-zinc-300 rounded px-2 py-1 text-sm bg-white text-zinc-600 flex-1 min-w-[180px]"
                            >
                              <option value="">Selecione...</option>
                              <option value="descanso">MODO DE DESCANSO</option>
                              {listas.map(l => (
                                <option key={l.id} value={l.id}>{l.nome}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Período de Dias e Horas */}
                        {ag.tipo === 'periodo_dias_horas' && (
                          <div className="flex items-center gap-3 flex-wrap pl-7">
                            <span className="text-xs text-zinc-500">a partir de</span>
                            <input type="date" value={ag.data_inicio} onChange={e => updateAgendamento(idx, 'data_inicio', e.target.value)}
                              className="border border-zinc-300 rounded px-2 py-1 text-sm bg-white text-zinc-600" />
                            <input type="time" value={ag.hora_inicio} onChange={e => updateAgendamento(idx, 'hora_inicio', e.target.value)}
                              className="border border-zinc-300 rounded px-2 py-1 text-sm bg-white text-zinc-600" />
                            <span className="text-xs text-zinc-500">até</span>
                            <input type="date" value={ag.data_fim} onChange={e => updateAgendamento(idx, 'data_fim', e.target.value)}
                              className="border border-zinc-300 rounded px-2 py-1 text-sm bg-white text-zinc-600" />
                            <input type="time" value={ag.hora_fim} onChange={e => updateAgendamento(idx, 'hora_fim', e.target.value)}
                              className="border border-zinc-300 rounded px-2 py-1 text-sm bg-white text-zinc-600" />
                          </div>
                        )}

                        {/* Período de Horas do Dia */}
                        {ag.tipo === 'periodo_horas_dia' && (
                          <div className="flex items-center gap-3 flex-wrap pl-7">
                            <span className="text-xs text-zinc-500">a partir de</span>
                            <input type="time" value={ag.hora_inicio} onChange={e => updateAgendamento(idx, 'hora_inicio', e.target.value)}
                              className="border border-zinc-300 rounded px-2 py-1 text-sm bg-white text-zinc-600" />
                            <span className="text-xs text-zinc-500">até</span>
                            <input type="time" value={ag.hora_fim} onChange={e => updateAgendamento(idx, 'hora_fim', e.target.value)}
                              className="border border-zinc-300 rounded px-2 py-1 text-sm bg-white text-zinc-600" />
                          </div>
                        )}

                        {/* Período de Horas do Dia em Dia Específico */}
                        {ag.tipo === 'periodo_horas_dia_especifico' && (
                          <div className="flex items-center gap-3 flex-wrap pl-7">
                            <span className="text-xs text-zinc-500">dia</span>
                            <input type="date" value={ag.data_inicio} onChange={e => updateAgendamento(idx, 'data_inicio', e.target.value)}
                              className="border border-zinc-300 rounded px-2 py-1 text-sm bg-white text-zinc-600" />
                            <span className="text-xs text-zinc-500">a partir de</span>
                            <input type="time" value={ag.hora_inicio} onChange={e => updateAgendamento(idx, 'hora_inicio', e.target.value)}
                              className="border border-zinc-300 rounded px-2 py-1 text-sm bg-white text-zinc-600" />
                            <span className="text-xs text-zinc-500">até</span>
                            <input type="time" value={ag.hora_fim} onChange={e => updateAgendamento(idx, 'hora_fim', e.target.value)}
                              className="border border-zinc-300 rounded px-2 py-1 text-sm bg-white text-zinc-600" />
                          </div>
                        )}

                        {/* Dia da Semana */}
                        {ag.tipo === 'dia_semana' && (
                          <div className="flex items-center gap-3 flex-wrap pl-7">
                            <span className="text-xs text-zinc-500">dia</span>
                            <select value={ag.dia_semana} onChange={e => updateAgendamento(idx, 'dia_semana', e.target.value)}
                              className="border border-zinc-300 rounded px-2 py-1 text-sm bg-white text-zinc-600">
                              <option value="">Selecione...</option>
                              {DIAS_SEMANA.map(d => (
                                <option key={d.value} value={d.value}>{d.label}</option>
                              ))}
                            </select>
                            <span className="text-xs text-zinc-500">a partir de</span>
                            <input type="time" value={ag.hora_inicio} onChange={e => updateAgendamento(idx, 'hora_inicio', e.target.value)}
                              className="border border-zinc-300 rounded px-2 py-1 text-sm bg-white text-zinc-600" />
                            <span className="text-xs text-zinc-500">até</span>
                            <input type="time" value={ag.hora_fim} onChange={e => updateAgendamento(idx, 'hora_fim', e.target.value)}
                              className="border border-zinc-300 rounded px-2 py-1 text-sm bg-white text-zinc-600" />
                          </div>
                        )}

                        {/* Dia do Mês */}
                        {ag.tipo === 'dia_mes' && (
                          <div className="flex items-center gap-3 flex-wrap pl-7">
                            <span className="text-xs text-zinc-500">dia</span>
                            <input type="number" min="1" max="31" value={ag.dia_mes} onChange={e => updateAgendamento(idx, 'dia_mes', e.target.value)}
                              className="border border-zinc-300 rounded px-2 py-1 text-sm bg-white text-zinc-600 w-16" />
                            <span className="text-xs text-zinc-500">a partir de</span>
                            <input type="time" value={ag.hora_inicio} onChange={e => updateAgendamento(idx, 'hora_inicio', e.target.value)}
                              className="border border-zinc-300 rounded px-2 py-1 text-sm bg-white text-zinc-600" />
                            <span className="text-xs text-zinc-500">até</span>
                            <input type="time" value={ag.hora_fim} onChange={e => updateAgendamento(idx, 'hora_fim', e.target.value)}
                              className="border border-zinc-300 rounded px-2 py-1 text-sm bg-white text-zinc-600" />
                          </div>
                        )}

                        {/* Mês */}
                        {ag.tipo === 'mes' && (
                          <div className="flex items-center gap-3 flex-wrap pl-7">
                            <span className="text-xs text-zinc-500">mês</span>
                            <select value={ag.mes} onChange={e => updateAgendamento(idx, 'mes', e.target.value)}
                              className="border border-zinc-300 rounded px-2 py-1 text-sm bg-white text-zinc-600">
                              <option value="">Selecione...</option>
                              {MESES.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                              ))}
                            </select>
                            <span className="text-xs text-zinc-500">a partir de</span>
                            <input type="time" value={ag.hora_inicio} onChange={e => updateAgendamento(idx, 'hora_inicio', e.target.value)}
                              className="border border-zinc-300 rounded px-2 py-1 text-sm bg-white text-zinc-600" />
                            <span className="text-xs text-zinc-500">até</span>
                            <input type="time" value={ag.hora_fim} onChange={e => updateAgendamento(idx, 'hora_fim', e.target.value)}
                              className="border border-zinc-300 rounded px-2 py-1 text-sm bg-white text-zinc-600" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="md:pl-36 mt-2 flex items-center gap-3">
                    <button 
                      className="bg-[#d4a017] hover:bg-[#b8860b] text-white text-[10px] font-bold px-4 py-2 rounded flex items-center gap-2 uppercase"
                      onClick={addAgendamento}
                      disabled={!isEditing}
                    >
                      + ADICIONAR AGENDAMENTO
                    </button>
                    <span className="text-zinc-400 hover:text-zinc-600 cursor-help" title="Configure agendamentos para trocar a playlist automaticamente em horários específicos">?</span>
                  </div>
                </div>
              </fieldset>
            </section>
          </div>
        )}

        {/* Notificações Tab Content */}
        {activeTab === 'notificacoes' && (
          <div className="space-y-6">
            <section>
              <h3 className="text-emerald-600 text-sm font-bold flex items-center gap-2 mb-6">
                <Bell className="w-4 h-4" />
                Notificações
              </h3>

              <div className="max-w-4xl space-y-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <span className="text-xs font-bold text-zinc-500 w-64 md:text-right shrink-0">Receber notificação quando ficar Offline:</span>
                  <select
                    value={exibirNotificacoes ? 'sim' : 'nao'}
                    onChange={e => setExibirNotificacoes(e.target.value === 'sim')}
                    disabled={!isEditing}
                    className="border border-zinc-300 rounded px-3 py-1.5 text-sm bg-white text-zinc-600 w-32"
                  >
                    <option value="sim">Sim</option>
                    <option value="nao">Não</option>
                  </select>
                </div>

                <div className="md:pl-64 text-[11px] text-zinc-500 space-y-2">
                  <p>
                    Você será notificado por Email quando a TV ficar Offline. A notificação será enviada para seu email: <span className="font-bold text-zinc-700">{user?.email || 'email@email.com'}</span>
                  </p>
                  <p>
                    Se não receber emails, verifique se os mesmos estão indo para caixa de SPAM ou adicione este email como remetente confiável: <span className="font-bold text-zinc-700">status@on-cloud.live</span>
                  </p>
                </div>

                <div className="md:pl-64 bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-700 flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">⚠</span>
                  <span>Se definido um Horário de Funcionamento, você só receberá notificações se a TV ficar Offline / Sem comunicação dentro do horário de funcionamento.</span>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Relatório de Exibição Tab Content */}
        {activeTab === 'relatorio' && (
          <RelatorioExibicao totemId={id!} user={user} />
        )}

        {/* Status e Informações (Only on Configurações tab) */}
        {activeTab === 'configuracoes' && (
        <section>
          <h3 className="text-[#104a9e] text-sm font-bold flex items-center gap-2 mb-6">
            <Activity className="w-4 h-4" />
            Status e Informações
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
            
            {/* Col 1 - Status */}
            <div>
              <h4 className="text-xs font-bold text-[#104a9e] uppercase mb-4 border-b border-zinc-100 pb-2">Status</h4>
              <div className="space-y-3 text-[11px] font-bold text-zinc-500 border-l-2 border-[#104a9e] pl-4">
                <div className="flex justify-between">
                  <span>App:</span>
                  <span className={`font-bold ${getCalculatedStatusInfo().color}`}>
                    {getCalculatedStatusInfo().status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{totem.status === 'FUNCIONANDO CORRETAMENTE' ? 'Online a:' : 'Offline a:'}</span>
                  <span className="text-[#104a9e]">
                    {totem.ultima_sincronizacao ? (() => {
                      const last = new Date(totem.ultima_sincronizacao.replace(' ', 'T') + 'Z');
                      const now = new Date();
                      const diffMs = now.getTime() - last.getTime();
                      const diffMin = Math.floor(diffMs / 60000);
                      if (diffMin < 1) return 'agora';
                      if (diffMin < 60) return `${diffMin} minuto${diffMin > 1 ? 's' : ''}`;
                      const diffH = Math.floor(diffMin / 60);
                      if (diffH < 24) return `${diffH} hora${diffH > 1 ? 's' : ''}`;
                      const diffD = Math.floor(diffH / 24);
                      return `${diffD} dia${diffD > 1 ? 's' : ''}`;
                    })() : 'Nunca'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Última Atualização:</span>
                  <span className="text-[#104a9e]">
                    {totem.ultima_sincronizacao ? format(new Date(totem.ultima_sincronizacao.replace(' ','T')), 'dd/MM/yyyy HH:mm:ss') : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span>Última Informação:</span>
                </div>
                <div className="text-zinc-800">{getCalculatedStatusInfo().info}</div>
              </div>

              {/* Exibindo / Lista de Reprodução */}
              <div className="mt-6 space-y-3 text-[11px] font-bold text-zinc-500 border-l-2 border-[#104a9e] pl-4">
                {totem.ultima_informacao && totem.ultima_informacao.includes('Reproduzindo') && (
                  <div>
                    <span className="text-zinc-500">Exibindo {totem.ultima_informacao.replace('Reproduzindo ', '')}:</span>
                    <div className="flex items-center gap-1.5 mt-1 text-zinc-700">
                      <Image className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="font-mono text-[10px]">{totem.ultima_informacao}</span>
                    </div>
                  </div>
                )}
                {totem.playlist_id && (() => {
                  const lista = listas.find(l => l.id === totem.playlist_id);
                  return lista ? (
                    <div>
                      <span className="text-zinc-500">Lista de Reprodução:</span>
                      <div className="flex items-center gap-1.5 mt-1 text-zinc-700">
                        <span className="text-[10px]">☰</span>
                        <span>{lista.nome}</span>
                        <ExternalLink className="w-3 h-3 text-zinc-400 cursor-pointer hover:text-[#104a9e]" />
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>

            {/* Col 2 */}
            <div>
              <h4 className="text-xs font-bold text-[#104a9e] uppercase mb-4 border-b border-zinc-100 pb-2">Informações</h4>
              <div className="space-y-3 text-[11px] font-bold text-zinc-500 border-l-2 border-[#104a9e] pl-4">
                <div className="flex justify-between items-center">
                  <span>Versão do Aplicativo:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#104a9e]">{totem.versao_app || 'N/A'}</span>
                    {totem.versao_app && <span className="bg-[#104a9e] text-white text-[8px] px-1.5 py-0.5 rounded">ATUALIZADO</span>}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Sistema Operacional:</span>
                  <span className="text-[#104a9e]">{totem.sistema_operacional || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Resolução:</span>
                  <span className="text-[#104a9e]">{totem.resolucao || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Espaço utilizado pelo Aplicativo:</span>
                  <span className="text-[#104a9e]">{totem.espaco_utilizado || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Espaço livre:</span>
                  <span className="text-[#104a9e]">{totem.espaco_livre || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Data/Hora da Tela:</span>
                  <span className="text-[#104a9e]">{totem.ultima_sincronizacao ? format(new Date(totem.ultima_sincronizacao.replace(' ','T')), 'dd/MM/yyyy HH:mm') : 'N/A'}</span>
                </div>
              </div>

              {totem.ultima_captura_tela && (
                <div className="mt-8 border-t border-zinc-100 pt-6">
                  <h4 className="text-xs font-bold text-[#104a9e] uppercase mb-4 flex items-center justify-between">
                    Última Captura de Tela
                    <button onClick={() => window.open(`${(import.meta as any).env.VITE_API_URL}/${totem.ultima_captura_tela}`, '_blank')} className="text-[10px] bg-zinc-100 px-2 py-1 rounded text-zinc-500 hover:text-[#104a9e]">Ampliar</button>
                  </h4>
                  <div className="bg-zinc-50 rounded border border-zinc-200 overflow-hidden relative shadow-sm" style={{aspectRatio: '16/9'}}>
                    <img 
                      src={`${(import.meta as any).env.VITE_API_URL}/${totem.ultima_captura_tela}`} 
                      alt="Última captura" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-2">Dica: Atualize a página em alguns segundos após solicitar a captura.</p>
                </div>
              )}
            </div>

          </div>
        </section>
        )}

        {/* Comandos (Only on Configurações tab) */}
        {activeTab === 'configuracoes' && (
        <section className="pt-4 border-t border-zinc-100">
          <h3 className="text-[#104a9e] text-sm font-bold flex items-center gap-2 mb-6">
            Comandos
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => handleCommand('capturar_tela')} className="bg-[#8e44ad] hover:bg-[#732d91] text-white text-[10px] font-bold px-4 py-2.5 rounded uppercase flex items-center gap-2 transition-colors">
              <Camera className="w-3.5 h-3.5" />
              CAPTURA DE TELA
            </button>
            <button onClick={() => handleCommand('reiniciar_app')} className="bg-[#7f8c8d] hover:bg-[#6c7a7d] text-white text-[10px] font-bold px-4 py-2.5 rounded uppercase flex items-center gap-2 transition-colors">
              <RotateCcw className="w-3.5 h-3.5" />
              REINICIAR APLICATIVO
            </button>
            <button onClick={() => handleCommand('limpar_cache')} className="bg-[#1abc9c] hover:bg-[#16a085] text-white text-[10px] font-bold px-4 py-2.5 rounded uppercase flex items-center gap-2 transition-colors">
              <Settings className="w-3.5 h-3.5" />
              LIMPAR CACHE
            </button>
          </div>
        </section>
        )}

      </div>

      {/* Bottom Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200">
        <button 
          onClick={handleDelete}
          className="bg-[#e74c3c] hover:bg-[#c0392b] text-white text-[10px] font-bold px-4 py-2.5 rounded transition-colors flex items-center gap-2 uppercase"
        >
          <Trash2 className="w-3.5 h-3.5" />
          DESVINCULAR TELA
        </button>
        <button 
          onClick={() => setShowReplaceModal(true)}
          className="bg-[#9b59b6] hover:bg-[#8e44ad] text-white text-[10px] font-bold px-4 py-2.5 rounded transition-colors flex items-center gap-2 uppercase"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          SUBSTITUIR TELA
        </button>
      </div>

      {/* Modal Substituir Tela */}
      {showReplaceModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-[#104a9e] p-4 flex items-center justify-between">
              <h3 className="text-white font-bold">Substituir Tela</h3>
              <button 
                onClick={() => setShowReplaceModal(false)}
                className="text-white/80 hover:text-white"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-zinc-600 mb-6">
                Informe o código da nova Tela para transferir todas as configurações e listas de reprodução. A tela atual será desvinculada automaticamente.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-2">Código da Nova Tela</label>
                  <input 
                    type="text" 
                    value={replaceCode}
                    onChange={e => setReplaceCode(e.target.value)}
                    placeholder="Informe o código exibido na TV"
                    className="w-full border-2 border-zinc-200 rounded p-3 uppercase font-mono text-center text-lg focus:border-[#104a9e] focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-zinc-50 p-4 flex justify-end gap-3 border-t border-zinc-100">
              <button 
                onClick={() => setShowReplaceModal(false)}
                className="px-6 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-700 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleReplace}
                className="bg-[#9b59b6] hover:bg-[#8e44ad] text-white px-6 py-2 rounded text-sm font-bold transition-colors shadow-sm"
              >
                Substituir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function RelatorioExibicao({ totemId, user }: { totemId: string; user: any }) {
  const [periodo, setPeriodo] = useState('tempo_real');
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 3);
    return d.toISOString().split('T')[0];
  });
  const [dataFim, setDataFim] = useState(() => new Date().toISOString().split('T')[0]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  const PERIODOS = [
    { value: 'tempo_real', label: 'Em Tempo Real' },
    { value: 'hoje', label: 'Hoje' },
    { value: '3d', label: 'Últimos 3 dias' },
    { value: '7d', label: 'Últimos 7 dias' },
    { value: '15d', label: 'Últimos 15 dias' },
    { value: '30d', label: 'Últimos 30 dias' },
    { value: 'custom', label: 'Período customizado' },
  ];

  useEffect(() => {
    if (periodo !== 'custom') {
      const now = new Date();
      setDataFim(now.toISOString().split('T')[0]);
      switch (periodo) {
        case 'hoje': setDataInicio(now.toISOString().split('T')[0]); break;
        case '3d': { const d = new Date(); d.setDate(d.getDate() - 3); setDataInicio(d.toISOString().split('T')[0]); break; }
        case '7d': { const d = new Date(); d.setDate(d.getDate() - 7); setDataInicio(d.toISOString().split('T')[0]); break; }
        case '15d': { const d = new Date(); d.setDate(d.getDate() - 15); setDataInicio(d.toISOString().split('T')[0]); break; }
        case '30d': { const d = new Date(); d.setDate(d.getDate() - 30); setDataInicio(d.toISOString().split('T')[0]); break; }
        default: { const d = new Date(); d.setDate(d.getDate() - 3); setDataInicio(d.toISOString().split('T')[0]); break; }
      }
    }
  }, [periodo]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/totems/${totemId}/relatorio?data_inicio=${dataInicio}&data_fim=${dataFim}`);
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleDate = (date: string) => {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  const getMediaIcon = (tipo: string) => {
    if (tipo === 'imagem') return <Image className="w-3 h-3" />;
    if (tipo === 'video') return <Film className="w-3 h-3" />;
    if (tipo === 'noticia') return <Radio className="w-3 h-3" />;
    return <Clock className="w-3 h-3" />;
  };

  const getMediaColor = (tipo: string) => {
    switch (tipo) {
      case 'imagem': return 'bg-sky-500';
      case 'video': return 'bg-sky-600';
      case 'noticia': return 'bg-sky-500';
      case 'clima': return 'bg-orange-500';
      case 'loteria': return 'bg-green-600';
      case 'hora': return 'bg-slate-700';
      case 'frases': return 'bg-emerald-600';
      case 'versiculos': return 'bg-amber-600';
      default: return 'bg-sky-500';
    }
  };

  const groupedLogs: Record<string, any[]> = {};
  logs.forEach(log => {
    const date = log.data_exibicao || log.created_at?.split(' ')[0] || 'Sem data';
    if (!groupedLogs[date]) groupedLogs[date] = [];
    groupedLogs[date].push(log);
  });

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T12:00:00');
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', weekday: 'long' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-[#104a9e] text-sm font-bold flex items-center gap-2 mb-6">
          <BarChart3 className="w-4 h-4" />
          Relatório de Exibição
        </h3>

        <div className="max-w-5xl space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={periodo}
              onChange={e => setPeriodo(e.target.value)}
              className="border border-zinc-300 rounded px-3 py-2 text-sm bg-white text-zinc-600 min-w-[200px]"
            >
              {PERIODOS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>

            <div className="flex items-center gap-2 bg-zinc-100 rounded px-3 py-2">
              <span className="text-xs text-zinc-500">a partir de</span>
              <input
                type="date"
                value={dataInicio}
                onChange={e => setDataInicio(e.target.value)}
                disabled={periodo !== 'custom'}
                className="border border-zinc-300 rounded px-2 py-1 text-sm bg-white text-zinc-600 disabled:bg-zinc-200"
              />
              <span className="text-xs text-zinc-500">até</span>
              <input
                type="date"
                value={dataFim}
                onChange={e => setDataFim(e.target.value)}
                disabled={periodo !== 'custom'}
                className="border border-zinc-300 rounded px-2 py-1 text-sm bg-white text-zinc-600 disabled:bg-zinc-200"
              />
            </div>

            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-[#104a9e] hover:bg-[#0d3a7e] text-white text-[11px] font-bold px-5 py-2 rounded flex items-center gap-2 transition-colors"
            >
              {loading ? '...' : <><BarChart3 className="w-3.5 h-3.5" /> PESQUISAR</>}
            </button>
          </div>

          {/* Results */}
          <div className="space-y-4 mt-6">
            {Object.keys(groupedLogs).length === 0 && !loading && (
              <div className="text-center py-12 text-zinc-400">
                <p className="text-3xl mb-2">😊</p>
                <p className="text-sm">Nada para exibir por enquanto.</p>
              </div>
            )}

            {Object.entries(groupedLogs).sort(([a], [b]) => b.localeCompare(a)).map(([date, items]) => (
              <div key={date} className="border border-zinc-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-50">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                    <span className="text-xs font-bold text-zinc-600">{formatDate(date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="text-zinc-400 hover:text-zinc-600 p-1" title="Baixar relatório">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleDate(date)}
                      className="text-zinc-400 hover:text-zinc-600 p-1"
                    >
                      {expandedDates[date] === false ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {expandedDates[date] !== false && (
                  <div className="p-3 space-y-1.5">
                    {items.map((item, idx) => {
                      const nome = item.playlist_nome || item.lista_nome || '';
                      return (
                        <React.Fragment key={idx}>
                          {idx === 0 && nome && (
                            <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-zinc-500 uppercase">
                              <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full"></span>
                              {nome}
                            </div>
                          )}
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-white text-[11px] ${getMediaColor(item.tipo_midia || item.tipo || '')}`}>
                            <span className="font-mono font-bold w-10 shrink-0">{item.hora_exibicao || item.hora || ''}</span>
                            {getMediaIcon(item.tipo_midia || item.tipo || '')}
                            <span className="truncate">{item.titulo || item.nome_arquivo || item.descricao || item.campanha_nome || '—'}</span>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
