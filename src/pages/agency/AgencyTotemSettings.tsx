import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import { 
  Monitor, Settings, Puzzle, Calendar, Bell, Activity, 
  Camera, RotateCcw, Trash2, ShieldAlert, X, Save
} from 'lucide-react';
import { format } from 'date-fns';

interface Totem {
  id: string;
  nome: string;
  device_id: string;
  status: 'online' | 'offline';
  ultima_sincronizacao: string | null;
  auto_iniciar?: number | boolean;
  versao_app?: string;
  sistema_operacional?: string;
  resolucao?: string;
  espaco_utilizado?: string;
  espaco_livre?: string;
  playlist_id?: string | null;
}

export default function AgencyTotemSettings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [totem, setTotem] = useState<Totem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('configuracoes');
  const [error, setError] = useState('');

  // Form State
  const [nome, setNome] = useState('');
  const [listaReproducao, setListaReproducao] = useState('');
  const [listas, setListas] = useState<{id: string, nome: string}[]>([]);
  const [rotacao, setRotacao] = useState('padrao');

  useEffect(() => {
    loadTotem();
  }, [id]);

  const loadTotem = async () => {
    try {
      const [data, listasData] = await Promise.all([
        apiFetch(`/api/totems/${id}`),
        apiFetch('/api/listas')
      ]);
      setTotem(data);
      setNome(data.nome);
      setListaReproducao(data.playlist_id || '');
      setListas(listasData || []);
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
          playlist_id: listaReproducao 
        }),
      });
      loadTotem();
      alert('Configurações salvas com sucesso!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async () => {
    if (confirm('Deseja realmente desvincular esta TV?')) {
      try {
        await apiFetch(`/api/totems/${id}`, { method: 'DELETE' });
        navigate('/agency/tvs'); // Redirecting back to TV lists
      } catch (err: any) {
        alert(err.message);
      }
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
    return <div className="p-8 text-center text-red-500">TV não encontrada. {error}</div>;
  }

  return (
    <div className="space-y-6 text-zinc-600 font-sans min-h-full max-w-[1200px] mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Monitor className="w-6 h-6 text-[#104a9e]" />
          <h2 className="text-sm font-bold text-[#104a9e] uppercase tracking-wide flex items-center">
            <button onClick={() => navigate('/agency/tvs')} className="hover:underline">TVS</button>
            <span className="mx-2 text-zinc-300">/</span> 
            <span className="text-zinc-400">{totem.nome}</span>
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/agency/tvs')} 
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
        </div>
      </div>

      {/* Red Alert Banner */}
      {!listaReproducao && (
        <div className="bg-[#e74c3c] text-white text-xs font-bold text-center py-3 px-4 rounded flex items-center justify-center relative">
          <span>Escolha uma Lista de Reprodução para essa TV!<br/>Senão, nenhum conteúdo será exibido.</span>
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
        
        {/* Configurações básicas */}
        <section>
          <h3 className="text-[#104a9e] text-sm font-bold flex items-center gap-2 mb-6">
            <Settings className="w-4 h-4" />
            Configurações básicas
          </h3>
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <label className="text-xs font-bold text-zinc-500 w-40 md:text-right">Nome: <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={nome}
                onChange={e => setNome(e.target.value)}
                className="flex-1 border border-zinc-300 rounded px-3 py-2 text-sm text-zinc-700 focus:border-[#104a9e] focus:outline-none border-dashed"
              />
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <label className="text-xs font-bold text-zinc-500 w-40 md:text-right">Lista de Reprodução:</label>
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
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <label className="text-xs font-bold text-zinc-500 w-40 md:text-right">Rotação:</label>
              <select 
                value={rotacao}
                onChange={e => setRotacao(e.target.value)}
                className="flex-1 border border-zinc-300 rounded px-3 py-2 text-sm text-zinc-700 focus:border-[#104a9e] focus:outline-none border-dashed"
              >
                <option value="padrao">Padrão</option>
                <option value="90">90 Graus</option>
                <option value="180">180 Graus</option>
                <option value="270">270 Graus</option>
              </select>
            </div>
            <div className="flex md:pl-44">
              <p className="text-[10px] text-zinc-400 bg-zinc-50 p-2 rounded flex gap-2 items-start border border-zinc-100">
                <ShieldAlert className="w-3 h-3 text-[#104a9e] shrink-0 mt-0.5" />
                Pode levar alguns minutos para as alterações acima terem efeito. As alterações somente terão efeito se/ou quando a TV estiver Online / Funcionando corretamente.
              </p>
            </div>
          </div>
        </section>

        {/* Status e Informações */}
        <section>
          <h3 className="text-[#104a9e] text-sm font-bold flex items-center gap-2 mb-6">
            <Activity className="w-4 h-4" />
            Status e Informações
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
            
            {/* Col 1 */}
            <div>
              <h4 className="text-xs font-bold text-[#104a9e] uppercase mb-4 border-b border-zinc-100 pb-2">Status</h4>
              <div className="space-y-3 text-[11px] font-bold text-zinc-500 border-l-2 border-[#104a9e] pl-4">
                <div className="flex justify-between">
                  <span>App:</span>
                  <span className="text-[#104a9e]">Aguardando Conteúdo</span>
                </div>
                <div className="flex justify-between">
                  <span>Online a:</span>
                  <span className="text-[#104a9e]">
                    {totem.ultima_sincronizacao ? format(new Date(totem.ultima_sincronizacao.replace(' ','T')), 'HH:mm') : '54 minutos'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Última Atualização:</span>
                  <span className="text-[#104a9e]">
                    {totem.ultima_sincronizacao ? format(new Date(totem.ultima_sincronizacao.replace(' ','T')), 'dd/MM/yyyy HH:mm:ss') : '08/08/2026 00:56:53'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Última informação:</span>
                </div>
                <div className="text-zinc-800">Aguardando Conteúdo para Veiculação</div>
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
                  <span>Data/Hora da TV:</span>
                  <span className="text-[#104a9e]">{totem.ultima_sincronizacao ? format(new Date(totem.ultima_sincronizacao.replace(' ','T')), 'dd/MM/yyyy HH:mm') : 'N/A'}</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Comandos */}
        <section className="pt-4 border-t border-zinc-100">
          <h3 className="text-[#104a9e] text-sm font-bold flex items-center gap-2 mb-6">
            Comandos
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <button className="bg-[#8e44ad] hover:bg-[#732d91] text-white text-[10px] font-bold px-4 py-2.5 rounded uppercase flex items-center gap-2 transition-colors">
              <Camera className="w-3.5 h-3.5" />
              CAPTURA DE TELA
            </button>
            <button className="bg-[#7f8c8d] hover:bg-[#6c7a7d] text-white text-[10px] font-bold px-4 py-2.5 rounded uppercase flex items-center gap-2 transition-colors">
              <RotateCcw className="w-3.5 h-3.5" />
              REINICIAR APLICATIVO
            </button>
            <button className="bg-[#1abc9c] hover:bg-[#16a085] text-white text-[10px] font-bold px-4 py-2.5 rounded uppercase flex items-center gap-2 transition-colors">
              <Settings className="w-3.5 h-3.5" />
              LIMPAR CACHE
            </button>
          </div>
        </section>

      </div>

      {/* Bottom Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200">
        <button 
          onClick={handleDelete}
          className="bg-[#e74c3c] hover:bg-[#c0392b] text-white text-[10px] font-bold px-4 py-2.5 rounded transition-colors flex items-center gap-2 uppercase"
        >
          <Trash2 className="w-3.5 h-3.5" />
          DESVINCULAR TV
        </button>
        <button className="bg-[#9b59b6] hover:bg-[#8e44ad] text-white text-[10px] font-bold px-4 py-2.5 rounded transition-colors flex items-center gap-2 uppercase">
          <RotateCcw className="w-3.5 h-3.5" />
          SUBSTITUIR TV
        </button>
      </div>

    </div>
  );
}
