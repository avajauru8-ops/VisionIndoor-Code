import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2, HelpCircle, ChevronDown } from 'lucide-react';
import { apiFetch } from '../../lib/api';

export interface Janela {
  inicio: string;
  fim: string;
}

export interface JanelaBackend {
  inicio: string | null;
  fim: string | null;
}

export function paraInputJanela(j: { inicio?: string | null; fim?: string | null }): Janela {
  const conv = (v?: string | null) => {
    if (!v) return '';
    const s = v.replace(' ', 'T');
    return s.length >= 16 ? s.slice(0, 16) : s;
  };
  return { inicio: conv(j.inicio), fim: conv(j.fim) };
}

export function deInputJanela(j: Janela): JanelaBackend {
  const conv = (v: string) => (v ? v.replace('T', ' ').slice(0, 19) : null);
  return { inicio: conv(j.inicio), fim: conv(j.fim) };
}

export function parseEtiquetasTexto(texto: string): string[] {
  return Array.from(
    new Set(
      texto
        .split(/[,;\n]+/)
        .map(t => t.trim())
        .filter(t => t.length > 0)
    )
  );
}

function ModalShell({
  titulo,
  onFechar,
  children,
  largura = 'max-w-xl',
}: {
  titulo: string;
  onFechar: () => void;
  children: React.ReactNode;
  largura?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onFechar}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl w-full ${largura} max-h-[85vh] flex flex-col`}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between shrink-0">
          <h3 className="text-xs font-bold text-[#104a9e] uppercase tracking-wide">{titulo}</h3>
          <button
            onClick={onFechar}
            className="text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function AgendamentoModal({
  aberto,
  janelasIniciais,
  onSalvar,
  onFechar,
  salvando = false,
}: {
  aberto: boolean;
  janelasIniciais: Janela[];
  onSalvar: (janelas: Janela[]) => void;
  onFechar: () => void;
  salvando?: boolean;
}) {
  const [janelas, setJanelas] = useState<Janela[]>(janelasIniciais);
  const [ajudaAberta, setAjudaAberta] = useState(false);

  useEffect(() => {
    if (aberto) {
      setJanelas(janelasIniciais.length ? janelasIniciais : [{ inicio: '', fim: '' }]);
      setAjudaAberta(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  if (!aberto) return null;

  const atualizar = (idx: number, campo: keyof Janela, valor: string) => {
    setJanelas(prev => prev.map((j, i) => (i === idx ? { ...j, [campo]: valor } : j)));
  };

  const remover = (idx: number) => {
    setJanelas(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <ModalShell titulo="Agendamento de Exibição" onFechar={onFechar}>
      <div className="mb-4">
        <button
          onClick={() => setAjudaAberta(v => !v)}
          className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 hover:text-[#104a9e] transition-colors uppercase"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Como funciona o agendamento
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${ajudaAberta ? 'rotate-180' : ''}`} />
        </button>
        {ajudaAberta && (
          <div className="mt-2 rounded border border-zinc-200 bg-zinc-50 p-3 text-[11px] text-zinc-600 space-y-1.5">
            <p>• O arquivo só será exibido nas TVs dentro das janelas de data e hora informadas.</p>
            <p>• Você pode criar quantas janelas quiser (ex.: todos os dias das 8h às 12h, ou datas específicas).</p>
            <p>• Deixe <strong>Início</strong> ou <strong>Fim</strong> em branco para deixar o horário aberto.</p>
            <p>• Para remover todos os agendamentos, apague as janelas e salve com a lista vazia.</p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {janelas.length === 0 && (
          <p className="text-xs text-zinc-500 text-center py-4 border border-dashed border-zinc-300 rounded">
            Nenhum agendamento. Sem janelas, o arquivo fica disponível o tempo todo.
          </p>
        )}
        {janelas.map((j, idx) => (
          <div key={idx} className="border border-zinc-200 rounded-lg p-3 bg-zinc-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">
                Janela {idx + 1}
              </span>
              <button
                onClick={() => remover(idx)}
                className="p-1 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors"
                title="Remover janela"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-[10px] font-bold text-zinc-500 uppercase">
                Início
                <input
                  type="datetime-local"
                  value={j.inicio}
                  onChange={e => atualizar(idx, 'inicio', e.target.value)}
                  className="mt-1 w-full border border-zinc-300 rounded px-2 py-1.5 text-xs text-zinc-700 font-normal focus:outline-none focus:border-[#0066ff]"
                />
              </label>
              <label className="text-[10px] font-bold text-zinc-500 uppercase">
                Fim
                <input
                  type="datetime-local"
                  value={j.fim}
                  onChange={e => atualizar(idx, 'fim', e.target.value)}
                  className="mt-1 w-full border border-zinc-300 rounded px-2 py-1.5 text-xs text-zinc-700 font-normal focus:outline-none focus:border-[#0066ff]"
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setJanelas(prev => [...prev, { inicio: '', fim: '' }])}
        className="mt-4 w-full border-2 border-dashed border-amber-400 text-amber-600 hover:bg-amber-50 text-[11px] font-bold uppercase py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5"
      >
        <Plus className="w-4 h-4" />
        Adicionar agendamento
      </button>

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onFechar}
          className="px-4 py-2 text-[11px] font-bold uppercase text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={() => onSalvar(janelas)}
          disabled={salvando}
          className="px-5 py-2 text-[11px] font-bold uppercase text-white bg-[#0066ff] hover:bg-[#0052cc] disabled:opacity-60 rounded transition-colors"
        >
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </ModalShell>
  );
}

export function EtiquetasModal({
  aberto,
  etiquetasAtuais,
  onSalvar,
  onFechar,
  salvando = false,
}: {
  aberto: boolean;
  etiquetasAtuais: string[];
  onSalvar: (etiquetas: string[], modo: 'substituir' | 'adicionar') => void;
  onFechar: () => void;
  salvando?: boolean;
}) {
  const [texto, setTexto] = useState('');
  const [modo, setModo] = useState<'substituir' | 'adicionar'>('substituir');

  useEffect(() => {
    if (aberto) {
      setTexto(etiquetasAtuais.join(', '));
      setModo('substituir');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  if (!aberto) return null;

  return (
    <ModalShell titulo="Etiquetas / Pastas" onFechar={onFechar}>
      <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-[11px] text-zinc-600 space-y-1.5 mb-4">
        <p>• Separe as etiquetas por vírgula, ponto e vírgula ou quebra de linha.</p>
        <p>• Cada etiqueta deve ter de 3 a 20 caracteres.</p>
        <p>• Use etiquetas para organizar seus arquivos e encontrá-los mais rápido na pesquisa.</p>
      </div>

      <label className="text-[10px] font-bold text-zinc-500 uppercase">
        Etiquetas
        <textarea
          value={texto}
          onChange={e => setTexto(e.target.value)}
          rows={4}
          placeholder="ex.: campanha natal, produto novo, recepção"
          className="mt-1 w-full border border-zinc-300 rounded px-3 py-2 text-xs text-zinc-700 font-normal resize-none focus:outline-none focus:border-[#0066ff]"
        />
      </label>

      <label className="mt-4 block text-[10px] font-bold text-zinc-500 uppercase">
        Comportamento
        <select
          value={modo}
          onChange={e => setModo(e.target.value as 'substituir' | 'adicionar')}
          className="mt-1 w-full border border-zinc-300 rounded px-2 py-2 text-xs text-zinc-700 font-normal bg-white focus:outline-none focus:border-[#0066ff]"
        >
          <option value="substituir">Substituir todas as etiquetas</option>
          <option value="adicionar">Adicionar às etiquetas já existentes</option>
        </select>
      </label>

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onFechar}
          className="px-4 py-2 text-[11px] font-bold uppercase text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={() => onSalvar(parseEtiquetasTexto(texto), modo)}
          disabled={salvando}
          className="px-5 py-2 text-[11px] font-bold uppercase text-white bg-[#0066ff] hover:bg-[#0052cc] disabled:opacity-60 rounded transition-colors"
        >
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </ModalShell>
  );
}

interface ListaOpcao {
  id: string;
  nome: string;
}

export function InserirEmListaModal({
  aberto,
  totalArquivos,
  onInserir,
  onFechar,
  salvando = false,
}: {
  aberto: boolean;
  totalArquivos: number;
  onInserir: (listaIds: string[], posicao: string) => Promise<void> | void;
  onFechar: () => void;
  salvando?: boolean;
}) {
  const [listas, setListas] = useState<ListaOpcao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [posicao, setPosicao] = useState('automatico');

  useEffect(() => {
    if (!aberto) return;
    setSelecionadas([]);
    setPosicao('automatico');
    setCarregando(true);
    apiFetch('/api/listas')
      .then((data: ListaOpcao[]) => setListas(Array.isArray(data) ? data : []))
      .catch(() => setListas([]))
      .finally(() => setCarregando(false));
  }, [aberto]);

  if (!aberto) return null;

  const alternar = (id: string) => {
    setSelecionadas(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  return (
    <ModalShell titulo="Inserir em lista de reprodução" onFechar={onFechar}>
      <p className="text-xs text-zinc-600 mb-4">
        Você está inserindo <strong>{totalArquivos}</strong> arquivo
        {totalArquivos > 1 ? 's' : ''} nas listas selecionadas.
      </p>

      <div className="text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Listas de reprodução</div>
      <div className="border border-zinc-300 rounded-lg max-h-44 overflow-y-auto divide-y divide-zinc-100">
        {carregando ? (
          <div className="px-3 py-6 text-center text-xs text-zinc-400">Carregando listas...</div>
        ) : listas.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-zinc-400">
            Você ainda não tem listas de reprodução.
          </div>
        ) : (
          listas.map(l => (
            <label
              key={l.id}
              className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-zinc-700 hover:bg-zinc-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selecionadas.includes(l.id)}
                onChange={() => alternar(l.id)}
                className="rounded border-zinc-300 text-[#0066ff] focus:ring-[#0066ff]"
              />
              <span className="truncate">{l.nome}</span>
            </label>
          ))
        )}
      </div>

      <label className="mt-4 block text-[10px] font-bold text-zinc-500 uppercase">
        Posição
        <select
          value={posicao}
          onChange={e => setPosicao(e.target.value)}
          className="mt-1 w-full border border-zinc-300 rounded px-2 py-2 text-xs text-zinc-700 font-normal bg-white focus:outline-none focus:border-[#0066ff]"
        >
          <option value="automatico">Automático</option>
          <option value="inicio">No Início</option>
          <option value="meio">No Meio</option>
          <option value="final">No Final</option>
        </select>
      </label>

      <div className="mt-4 rounded border border-blue-200 bg-blue-50 p-3 text-[11px] text-blue-800">
        Na opção <strong>"Automático"</strong>, os arquivos serão intercalados entre os itens já
        existentes de cada lista de reprodução selecionada.
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onFechar}
          className="px-4 py-2 text-[11px] font-bold uppercase text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={() => onInserir(selecionadas, posicao)}
          disabled={salvando || selecionadas.length === 0}
          className="px-5 py-2 text-[11px] font-bold uppercase text-white bg-[#0066ff] hover:bg-[#0052cc] disabled:opacity-50 rounded transition-colors"
        >
          {salvando ? 'Inserindo...' : 'Inserir em lista de reprodução'}
        </button>
      </div>
    </ModalShell>
  );
}
