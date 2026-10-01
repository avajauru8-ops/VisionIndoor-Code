import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  Pencil,
  Play,
  Save,
  Search,
  Tag,
  Trash2,
  Upload,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { compressImage } from '../../lib/compress';
import {
  AgendamentoModal,
  EtiquetasModal,
  Janela,
  deInputJanela,
} from '../../components/media/MediaModals';

interface Arquivo {
  id: string;
  titulo: string;
  tipo_midia: string;
  arquivo_url: string;
  tempo_exibicao?: number;
  data_inicio?: string | null;
  data_fim?: string | null;
  ativo?: number | string;
  etiquetas: string[];
  janelas: { inicio?: string | null; fim?: string | null }[];
  size_bytes?: number | null;
  largura?: number | null;
  altura?: number | null;
  data_envio?: string | null;
}

interface ListaUso {
  id: string;
  nome: string;
  totens: { id: string; nome: string }[];
}

interface Detalhe {
  arquivo: Arquivo;
  listas: ListaUso[];
  total_listas: number;
  total_tv: number;
}

interface Estatisticas {
  total: number;
  por_dia: { data_exibicao: string; exibicoes: number }[];
  por_tela: { totem_id: number | null; nome: string | null; exibicoes: number }[];
  por_lista: { playlist_id: number | null; playlist_nome: string | null; exibicoes: number }[];
}

type Aba = 'config' | 'arquivo' | 'stats';

const VIDEO_EXTS = ['.mp4', '.flv', '.3gp', '.avi', '.m4v', '.mkv', '.mov', '.mpg', '.rm', '.rmvb', '.vob', '.webm', '.wmv'];
const IMAGE_EXTS = ['.jpg', '.jpeg', '.gif', '.png'];

const fileExt = (name: string) => '.' + (name.split('.').pop() || '').toLowerCase();

const fmtBytes = (b?: number | null) => {
  if (b === null || b === undefined) return '—';
  if (b < 1024) return `${b} B`;
  const kb = b / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

const fmtData = (v?: string | null) => {
  if (!v) return '—';
  const m = String(v).match(/(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(v);
};

const fmtHora = (v?: string | null) => {
  if (!v) return '';
  const m = String(v).match(/(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : '';
};

const fmtDataHora = (v?: string | null) => {
  if (!v) return '—';
  const h = fmtHora(v);
  const d = fmtData(v);
  return h ? `${d} ${h}` : d;
};

const fmtDuracao = (seg?: number | null) => {
  if (seg === null || seg === undefined || isNaN(seg)) return '—';
  const total = Math.round(seg);
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
};

const hojeISO = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const diasAtrasISO = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const p = (num: number) => String(num).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const hojeInput = () => hojeISO() + 'T00:00';

const rotuloJanela = (j: Janela) => {
  const ini = j.inicio ? fmtDataHora(j.inicio) : 'Em diante';
  const fim = j.fim ? fmtDataHora(j.fim) : 'Sempre';
  return `${ini} — ${fim}`;
};

export default function AgencyMediaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<Detalhe | null>(null);

  const [aba, setAba] = useState<Aba>('config');
  const [editando, setEditando] = useState(false);
  const [tituloForm, setTituloForm] = useState('');
  const [janelasInput, setJanelasInput] = useState<Janela[]>([]);
  const [etiquetas, setEtiquetas] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  const [modalAgendamento, setModalAgendamento] = useState(false);
  const [modalEtiquetas, setModalEtiquetas] = useState(false);

  const [videoMeta, setVideoMeta] = useState<{ w: number; h: number; dur: number } | null>(null);

  // Substituição de arquivo
  const [novoArquivo, setNovoArquivo] = useState<File | null>(null);
  const [substituindo, setSubstituindo] = useState(false);
  const substituirInputRef = useRef<HTMLInputElement>(null);

  // Estatísticas
  const [preset, setPreset] = useState('3');
  const [dataInicio, setDataInicio] = useState(diasAtrasISO(3));
  const [dataFim, setDataFim] = useState(hojeISO());
  const [totemId, setTotemId] = useState('');
  const [listaId, setListaId] = useState('');
  const [telas, setTelas] = useState<{ id: string; nome: string }[]>([]);
  const [listas, setListas] = useState<{ id: string; nome: string }[]>([]);
  const [stats, setStats] = useState<Estatisticas | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [carregouStats, setCarregouStats] = useState(false);

  const arquivo = detalhe?.arquivo || null;

  const carregar = async () => {
    if (!id) return;
    setCarregando(true);
    setErro(null);
    try {
      const d: Detalhe = await apiFetch(`/api/playlists/${id}`);
      setDetalhe(d);
      setTituloForm(d.arquivo.titulo || '');
      setJanelasInput(
        (d.arquivo.janelas || []).map(j => ({
          inicio: j.inicio ? String(j.inicio).replace(' ', 'T').slice(0, 16) : '',
          fim: j.fim ? String(j.fim).replace(' ', 'T').slice(0, 16) : '',
        }))
      );
      setEtiquetas(d.arquivo.etiquetas || []);
      setVideoMeta(null);
      setEditando(false);
    } catch (e: any) {
      setErro(e.message || 'Erro ao carregar arquivo');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [id]);

  useEffect(() => {
    if (aba !== 'stats') return;
    if (telas.length === 0) {
      apiFetch('/api/totems')
        .then((d: any[]) => setTelas((Array.isArray(d) ? d : []).map(t => ({ id: String(t.id), nome: t.nome || `Tela ${t.id}` }))))
        .catch(() => {});
    }
    if (listas.length === 0) {
      apiFetch('/api/listas')
        .then((d: any[]) => setListas((Array.isArray(d) ? d : []).map(l => ({ id: String(l.id), nome: l.nome || `Lista ${l.id}` }))))
        .catch(() => {});
    }
  }, [aba, telas.length, listas.length]);

  const salvar = async () => {
    if (!id) return;
    setSalvando(true);
    try {
      await apiFetch(`/api/playlists/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          titulo: tituloForm,
          etiquetas,
          agendamentos: janelasInput.map(deInputJanela),
        }),
      });
      setEditando(false);
      await carregar();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async () => {
    if (!id || !arquivo) return;
    if (!confirm(`Deseja apagar o arquivo "${arquivo.titulo}"?`)) return;
    try {
      await apiFetch(`/api/playlists/${id}`, { method: 'DELETE' });
      navigate('/agency/arquivos');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const salvarEtiquetas = (novas: string[], modo: 'substituir' | 'adicionar') => {
    setEtiquetas(modo === 'substituir' ? novas : Array.from(new Set([...etiquetas, ...novas])));
    setModalEtiquetas(false);
  };

  const substituirArquivo = async () => {
    if (!id || !novoArquivo) return;
    setSubstituindo(true);
    try {
      const ehVideo = novoArquivo.type.startsWith('video/') || VIDEO_EXTS.includes(fileExt(novoArquivo.name));
      let fileToSend = novoArquivo;
      if (!ehVideo) {
        try {
          fileToSend = await compressImage(novoArquivo);
        } catch {
          // envia original
        }
      }
      const fd = new FormData();
      fd.append('arquivo', fileToSend);
      fd.append('tipo_midia', ehVideo ? 'video' : 'imagem');
      await apiFetch(`/api/playlists/${id}`, { method: 'POST', body: fd });
      setNovoArquivo(null);
      if (substituirInputRef.current) substituirInputRef.current.value = '';
      await carregar();
      alert('Arquivo substituído com sucesso!');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubstituindo(false);
    }
  };

  const mudarPreset = (v: string) => {
    setPreset(v);
    if (v !== 'custom') {
      setDataInicio(diasAtrasISO(Number(v)));
      setDataFim(hojeISO());
    }
  };

  const buscarStats = async () => {
    if (!id) return;
    setBuscando(true);
    try {
      const qs = new URLSearchParams({ data_inicio: dataInicio, data_fim: dataFim });
      if (totemId) qs.set('totem_id', totemId);
      if (listaId) qs.set('lista_id', listaId);
      const d: Estatisticas = await apiFetch(`/api/playlists/${id}/estatisticas?${qs.toString()}`);
      setStats(d);
      setCarregouStats(true);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBuscando(false);
    }
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#104a9e]"></div>
      </div>
    );
  }

  if (erro || !arquivo || !detalhe) {
    return (
      <div className="max-w-[1000px] mx-auto text-center py-16 text-zinc-500">
        <p className="text-sm mb-4">{erro || 'Arquivo não encontrado.'}</p>
        <Link to="/agency/arquivos" className="text-xs font-bold text-[#0066ff] uppercase hover:underline">
          Voltar para Arquivos
        </Link>
      </div>
    );
  }

  const resolucao =
    arquivo.largura && arquivo.altura
      ? `${arquivo.largura}x${arquivo.altura}`
      : videoMeta
        ? `${videoMeta.w}x${videoMeta.h}`
        : '—';

  const duracao = arquivo.tipo_midia === 'video' ? fmtDuracao(videoMeta?.dur) : '—';

  const abas: { chave: Aba; rotulo: string }[] = [
    { chave: 'config', rotulo: 'Configurações e Informações' },
    { chave: 'arquivo', rotulo: 'Visualizar / Substituir Arquivo' },
    { chave: 'stats', rotulo: 'Estatísticas do Arquivo' },
  ];

  return (
    <div className="max-w-[1000px] mx-auto text-zinc-600 font-sans min-h-full pb-20 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase text-zinc-400">
        <Link to="/agency/arquivos" className="flex items-center gap-1 hover:text-[#104a9e] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Arquivos
        </Link>
        <span>/</span>
        <span className="text-[#104a9e] truncate max-w-[400px]">{arquivo.titulo}</span>
      </div>

      {/* Cabeçalho com miniatura */}
      <div className="bg-white border border-zinc-200 rounded-lg p-6 flex items-center gap-5">
        <div className="w-24 h-16 rounded border border-zinc-200 bg-zinc-50 flex items-center justify-center overflow-hidden shrink-0">
          {arquivo.tipo_midia === 'imagem' ? (
            <img src={arquivo.arquivo_url} alt={arquivo.titulo} className="max-w-full max-h-full object-contain" />
          ) : (
            <div className="w-full h-full bg-[#0066ff] flex items-center justify-center">
              <Play className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-[#104a9e] uppercase truncate">{arquivo.titulo}</h2>
          <p className="text-[11px] text-zinc-400 mt-1">
            {arquivo.tipo_midia === 'imagem' ? 'Imagem' : 'Vídeo'} · {fmtBytes(arquivo.size_bytes)}
            {detalhe.total_listas > 0 ? ` · ${detalhe.total_listas} lista(s) · ${detalhe.total_tv} TV(s)` : ' · Ainda não está em nenhuma lista'}
          </p>
        </div>
      </div>

      {/* Abas */}
      <div className="border-b border-zinc-200 flex gap-6 overflow-x-auto">
        {abas.map(a => (
          <button
            key={a.chave}
            onClick={() => setAba(a.chave)}
            className={`pb-3 text-[11px] font-bold uppercase whitespace-nowrap border-b-2 transition-colors ${aba === a.chave
              ? 'text-[#104a9e] border-[#0066ff]'
              : 'text-zinc-400 border-transparent hover:text-zinc-600'
            }`}
          >
            {a.rotulo}
          </button>
        ))}
      </div>

      {/* ============================ ABA 1: CONFIGURAÇÕES ============================ */}
      {aba === 'config' && (
        <div className="bg-white border border-zinc-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-bold text-[#104a9e] uppercase">
              {editando ? 'Editando arquivo' : 'Configurações e Informações'}
            </h3>
            {!editando && (
              <button
                onClick={() => setEditando(true)}
                className="flex items-center gap-1.5 border border-[#0066ff] text-[#0066ff] hover:bg-[#0066ff] hover:text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded transition-colors"
              >
                <Pencil className="w-3 h-3" />
                Habilitar Edição
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Nome</label>
              {editando ? (
                <input
                  type="text"
                  value={tituloForm}
                  onChange={e => setTituloForm(e.target.value)}
                  className="w-full border border-dashed border-[#0066ff] rounded px-3 py-2 text-xs text-zinc-700 focus:outline-none"
                />
              ) : (
                <div className="text-xs text-zinc-700 bg-zinc-50 border border-zinc-200 rounded px-3 py-2 break-words">
                  {arquivo.titulo || '—'}
                </div>
              )}
            </div>

            {/* Agendamento */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Agendamento
                </span>
              </label>
              {!editando ? (
                <div className="text-xs text-zinc-700 bg-zinc-50 border border-zinc-200 rounded px-3 py-2">
                  {janelasInput.length === 0 ? (
                    <span className="text-zinc-400">Sem agendamento — disponível o tempo todo</span>
                  ) : (
                    janelasInput.map((j, i) => (
                      <div key={i}>{rotuloJanela(j)}</div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {janelasInput.length === 0 && (
                    <p className="text-[11px] text-zinc-400 border border-dashed border-zinc-300 rounded px-3 py-2">
                      Nenhuma janela. O arquivo fica disponível o tempo todo.
                    </p>
                  )}
                  {janelasInput.map((j, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 border border-zinc-200 bg-zinc-50 rounded px-3 py-2">
                      <span className="text-[11px] text-zinc-600 truncate">{rotuloJanela(j)}</span>
                      <button
                        onClick={() => setJanelasInput(prev => prev.filter((_, idx) => idx !== i))}
                        className="p-1 text-zinc-400 hover:text-rose-500 transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setModalAgendamento(true)}
                    className="w-full border-2 border-dashed border-amber-400 text-amber-600 hover:bg-amber-50 text-[10px] font-bold uppercase py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Adicionar agendamento
                  </button>
                </div>
              )}
            </div>

            {/* Etiquetas / Pastas */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">
                <span className="inline-flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Etiquetas / Pastas
                </span>
              </label>
              <div className={`text-xs rounded px-3 py-2 border min-h-[38px] flex flex-wrap items-center gap-1.5 ${editando ? 'border-dashed border-[#0066ff] bg-white' : 'border-zinc-200 bg-zinc-50'}`}>
                {etiquetas.length === 0 ? (
                  <span className="text-zinc-400">—</span>
                ) : (
                  etiquetas.map(t => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-[#104a9e] border border-blue-100">
                      {t}
                    </span>
                  ))
                )}
                {editando && (
                  <button
                    onClick={() => setModalEtiquetas(true)}
                    className="text-[10px] font-bold uppercase text-[#0066ff] hover:underline ml-1"
                  >
                    Editar
                  </button>
                )}
              </div>
            </div>

            {/* Informações */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Informações</label>
              <div className="border border-zinc-200 bg-zinc-50 rounded px-3 py-2 text-[11px] text-zinc-600 space-y-1">
                <div className="flex justify-between"><span className="text-zinc-400">Resolução</span><span>{resolucao}</span></div>
                <div className="flex justify-between"><span className="text-zinc-400">Duração</span><span>{duracao}</span></div>
                <div className="flex justify-between"><span className="text-zinc-400">Tamanho</span><span>{fmtBytes(arquivo.size_bytes)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-400">Data de envio</span><span>{fmtDataHora(arquivo.data_envio)}</span></div>
              </div>
            </div>
          </div>

          {/* Onde este arquivo é veiculado */}
          <div className="mt-8 pt-6 border-t border-zinc-200">
            <h4 className="text-[10px] font-bold text-zinc-400 uppercase mb-3">
              Onde este arquivo é veiculado
            </h4>

            <div className="flex gap-4 mb-4">
              <div className="border border-[#0066ff] rounded-lg px-4 py-2 text-center">
                <div className="text-lg font-bold text-[#0066ff]">{detalhe.total_listas}</div>
                <div className="text-[9px] font-bold text-zinc-400 uppercase">Listas [{detalhe.total_listas}]</div>
              </div>
              <div className="border border-[#0066ff] rounded-lg px-4 py-2 text-center">
                <div className="text-lg font-bold text-[#0066ff]">{detalhe.total_tv}</div>
                <div className="text-[9px] font-bold text-zinc-400 uppercase">TVs [{detalhe.total_tv}]</div>
              </div>
            </div>

            {detalhe.listas.length === 0 ? (
              <p className="text-xs text-zinc-400">
                Este arquivo ainda não está em nenhuma lista de reprodução. Use a opção{' '}
                <strong>"Inserir em Lista de Reprodução"</strong> na tela de Arquivos.
              </p>
            ) : (
              <div className="space-y-3">
                {detalhe.listas.map(lista => (
                  <div key={lista.id} className="border border-zinc-200 rounded-lg p-3 bg-zinc-50">
                    <div className="flex items-center justify-between mb-2">
                      <Link
                        to={`/agency/listas/${lista.id}`}
                        className="text-xs font-bold text-[#104a9e] hover:underline"
                      >
                        {lista.nome}
                      </Link>
                      <span className="text-[10px] text-zinc-400">{lista.totens.length} TV(s)</span>
                    </div>
                    {lista.totens.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {lista.totens.map(t => (
                          <span key={t.id} className="text-[10px] px-2 py-0.5 rounded bg-white border border-zinc-200 text-zinc-600">
                            {t.nome}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="mt-8 pt-4 border-t border-zinc-200 flex items-center justify-between">
            <div />
            {editando ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setEditando(false);
                    setTituloForm(arquivo.titulo || '');
                    setJanelasInput(
                      (arquivo.janelas || []).map(j => ({
                        inicio: j.inicio ? String(j.inicio).replace(' ', 'T').slice(0, 16) : '',
                        fim: j.fim ? String(j.fim).replace(' ', 'T').slice(0, 16) : '',
                      }))
                    );
                    setEtiquetas(arquivo.etiquetas || []);
                  }}
                  className="px-4 py-2 text-[10px] font-bold uppercase text-zinc-500 hover:text-zinc-700 transition-colors"
                >
                  Cancelar Edição
                </button>
                <button
                  onClick={salvar}
                  disabled={salvando}
                  className="flex items-center gap-1.5 bg-[#0066ff] hover:bg-[#0052cc] disabled:opacity-60 text-white text-[10px] font-bold uppercase px-5 py-2 rounded transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            ) : (
              <button
                onClick={excluir}
                className="flex items-center gap-1.5 border border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white text-[10px] font-bold uppercase px-4 py-2 rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Apagar Arquivo
              </button>
            )}
          </div>
          {editando && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={excluir}
                className="flex items-center gap-1.5 border border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white text-[10px] font-bold uppercase px-4 py-2 rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Apagar Arquivo
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============================ ABA 2: SUBSTITUIR ARQUIVO ============================ */}
      {aba === 'arquivo' && (
        <div className="bg-white border border-zinc-200 rounded-lg p-6">
          <h3 className="text-xs font-bold text-[#104a9e] uppercase mb-6">Visualizar / Substituir Arquivo</h3>

          <div className="border border-zinc-200 rounded-lg bg-zinc-50 p-4 flex items-center justify-center min-h-[240px]">
            {arquivo.tipo_midia === 'imagem' ? (
              <img src={arquivo.arquivo_url} alt={arquivo.titulo} className="max-h-[360px] max-w-full object-contain rounded shadow-sm" />
            ) : (
              <video src={arquivo.arquivo_url} controls className="max-h-[360px] max-w-full rounded shadow-sm" />
            )}
          </div>

          <div className="mt-6 border-t border-zinc-200 pt-6">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-2">
              Substituir por um novo arquivo
            </label>
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <input
                type="file"
                ref={substituirInputRef}
                className="hidden"
                accept={[...IMAGE_EXTS, ...VIDEO_EXTS].join(',')}
                onChange={e => {
                  const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                  setNovoArquivo(f);
                }}
              />
              <button
                onClick={() => substituirInputRef.current?.click()}
                className="flex items-center gap-1.5 border border-zinc-300 text-zinc-600 hover:border-[#0066ff] hover:text-[#0066ff] text-[10px] font-bold uppercase px-4 py-2 rounded transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Escolher Arquivo
              </button>
              <span className="text-xs text-zinc-500 truncate">
                {novoArquivo ? novoArquivo.name : 'Nenhum arquivo selecionado'}
              </span>
              <button
                onClick={substituirArquivo}
                disabled={!novoArquivo || substituindo}
                className="md:ml-auto flex items-center gap-1.5 bg-[#0066ff] hover:bg-[#0052cc] disabled:opacity-50 text-white text-[10px] font-bold uppercase px-5 py-2 rounded transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                {substituindo ? 'Enviando...' : 'Substituir Arquivo'}
              </button>
            </div>
            <p className="mt-3 text-[11px] text-zinc-400">
              Tipos aceitos: JPG, JPEG, GIF, PNG, MP4, FLV, 3GP, AVI, M4V, MKV, MOV, MPG, RM, RMVB, VOB, WEBM, WMV.
              O nome, as etiquetas e o agendamento do arquivo são mantidos.
            </p>
          </div>
        </div>
      )}

      {/* ============================ ABA 3: ESTATÍSTICAS ============================ */}
      {aba === 'stats' && (
        <div className="bg-white border border-zinc-200 rounded-lg p-6">
          <h3 className="text-xs font-bold text-[#104a9e] uppercase mb-6 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Estatísticas do Arquivo
          </h3>

          {/* Filtros */}
          <div className="border border-zinc-200 rounded-lg bg-zinc-50 p-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <label className="text-[10px] font-bold text-zinc-400 uppercase">
              Período
              <select
                value={preset}
                onChange={e => mudarPreset(e.target.value)}
                className="mt-1 w-full border border-zinc-300 rounded px-2 py-2 text-xs text-zinc-700 font-normal bg-white focus:outline-none focus:border-[#0066ff]"
              >
                <option value="3">Últimos 3 dias</option>
                <option value="7">Últimos 7 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 90 dias</option>
                <option value="custom">Personalizado</option>
              </select>
            </label>
            <label className="text-[10px] font-bold text-zinc-400 uppercase">
              De
              <input
                type="date"
                value={dataInicio}
                onChange={e => { setDataInicio(e.target.value); setPreset('custom'); }}
                className="mt-1 w-full border border-zinc-300 rounded px-2 py-2 text-xs text-zinc-700 font-normal focus:outline-none focus:border-[#0066ff]"
              />
            </label>
            <label className="text-[10px] font-bold text-zinc-400 uppercase">
              Até
              <input
                type="date"
                value={dataFim}
                onChange={e => { setDataFim(e.target.value); setPreset('custom'); }}
                className="mt-1 w-full border border-zinc-300 rounded px-2 py-2 text-xs text-zinc-700 font-normal focus:outline-none focus:border-[#0066ff]"
              />
            </label>
            <label className="text-[10px] font-bold text-zinc-400 uppercase">
              TV
              <select
                value={totemId}
                onChange={e => setTotemId(e.target.value)}
                className="mt-1 w-full border border-zinc-300 rounded px-2 py-2 text-xs text-zinc-700 font-normal bg-white focus:outline-none focus:border-[#0066ff]"
              >
                <option value="">Todas</option>
                {telas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </label>
            <div className="flex gap-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase flex-1">
                Lista
                <select
                  value={listaId}
                  onChange={e => setListaId(e.target.value)}
                  className="mt-1 w-full border border-zinc-300 rounded px-2 py-2 text-xs text-zinc-700 font-normal bg-white focus:outline-none focus:border-[#0066ff]"
                >
                  <option value="">Todas</option>
                  {listas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <button
              onClick={buscarStats}
              disabled={buscando}
              className="flex items-center gap-1.5 bg-[#0066ff] hover:bg-[#0052cc] disabled:opacity-60 text-white text-[10px] font-bold uppercase px-5 py-2 rounded transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              {buscando ? 'Buscando...' : 'Pesquisar'}
            </button>
          </div>

          {/* Resultado */}
          {!carregouStats && !buscando ? (
            <div className="mt-8 text-center text-xs text-zinc-400 py-10">
              Nenhuma exibição carregada ainda. Altere o filtro acima ou apenas clique em pesquisar 🚀
            </div>
          ) : stats && stats.total === 0 ? (
            <div className="mt-8 text-center text-xs text-zinc-400 py-10">
              Nenhuma exibição encontrada para o período selecionado. Altere o filtro acima ou apenas clique em pesquisar 🚀
            </div>
          ) : stats ? (
            <div className="mt-6 space-y-6">
              <div className="border border-[#0066ff] rounded-lg px-5 py-4 inline-flex items-baseline gap-3">
                <span className="text-2xl font-bold text-[#0066ff]">{stats.total}</span>
                <span className="text-[10px] font-bold text-zinc-400 uppercase">exibições no período</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Por dia */}
                <div className="border border-zinc-200 rounded-lg overflow-hidden">
                  <div className="bg-zinc-50 border-b border-zinc-200 px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase">
                    Por dia
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="text-[10px] text-zinc-400 uppercase sticky top-0 bg-white">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Data</th>
                          <th className="px-3 py-2 font-semibold text-right">Exibições</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {stats.por_dia.length === 0 ? (
                          <tr><td colSpan={2} className="px-3 py-4 text-center text-zinc-400">Sem dados</td></tr>
                        ) : (
                          stats.por_dia.map((d, i) => (
                            <tr key={i}>
                              <td className="px-3 py-2 text-zinc-600">{fmtData(d.data_exibicao)}</td>
                              <td className="px-3 py-2 text-right font-medium text-zinc-700">{d.exibicoes}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Por tela */}
                <div className="border border-zinc-200 rounded-lg overflow-hidden">
                  <div className="bg-zinc-50 border-b border-zinc-200 px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase">
                    Por tela
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="text-[10px] text-zinc-400 uppercase sticky top-0 bg-white">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Tela</th>
                          <th className="px-3 py-2 font-semibold text-right">Exibições</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {stats.por_tela.length === 0 ? (
                          <tr><td colSpan={2} className="px-3 py-4 text-center text-zinc-400">Sem dados</td></tr>
                        ) : (
                          stats.por_tela.map((t, i) => (
                            <tr key={i}>
                              <td className="px-3 py-2 text-zinc-600 truncate max-w-[120px]">{t.nome || `Tela ${t.totem_id ?? '—'}`}</td>
                              <td className="px-3 py-2 text-right font-medium text-zinc-700">{t.exibicoes}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Por lista */}
                <div className="border border-zinc-200 rounded-lg overflow-hidden">
                  <div className="bg-zinc-50 border-b border-zinc-200 px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase">
                    Por lista
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="text-[10px] text-zinc-400 uppercase sticky top-0 bg-white">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Lista</th>
                          <th className="px-3 py-2 font-semibold text-right">Exibições</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {stats.por_lista.length === 0 ? (
                          <tr><td colSpan={2} className="px-3 py-4 text-center text-zinc-400">Sem dados</td></tr>
                        ) : (
                          stats.por_lista.map((l, i) => (
                            <tr key={i}>
                              <td className="px-3 py-2 text-zinc-600 truncate max-w-[120px]">{l.playlist_nome || `Lista ${l.playlist_id ?? '—'}`}</td>
                              <td className="px-3 py-2 text-right font-medium text-zinc-700">{l.exibicoes}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Metadata oculta de vídeo (resolução/duração) */}
      {arquivo.tipo_midia === 'video' && (
        <video
          src={arquivo.arquivo_url}
          preload="metadata"
          className="hidden"
          onLoadedMetadata={e => {
            const v = e.currentTarget;
            setVideoMeta({ w: v.videoWidth, h: v.videoHeight, dur: v.duration });
          }}
        />
      )}

      {/* Modais */}
      <AgendamentoModal
        aberto={modalAgendamento}
        janelasIniciais={janelasInput.length > 0 ? janelasInput : [{ inicio: hojeInput(), fim: '' }]}
        onSalvar={js => {
          setJanelasInput(js);
          setModalAgendamento(false);
        }}
        onFechar={() => setModalAgendamento(false)}
        salvando={salvando}
      />

      <EtiquetasModal
        aberto={modalEtiquetas}
        etiquetasAtuais={etiquetas}
        onSalvar={salvarEtiquetas}
        onFechar={() => setModalEtiquetas(false)}
      />
    </div>
  );
}
