import React, { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { RefreshCw, Plus, Trash2, Power, UploadCloud } from 'lucide-react';

interface AppUpdate {
  id: string;
  versao: string;
  arquivo_url?: string | null;
  descricao?: string | null;
  ativo: boolean;
  data_cadastro?: string;
}

export default function AdminAppUpdates() {
  const [updates, setUpdates] = useState<AppUpdate[]>([]);
  const [form, setForm] = useState({ versao: '', descricao: '' });
  const [apkFile, setApkFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const apkInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const data = await apiFetch('/api/admin/app-updates');
      setUpdates(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.versao.trim()) { setError('Informe a versão do aplicativo.'); return; }
    if (!apkFile) { setError('Selecione o arquivo APK do aplicativo para a atualização.'); return; }
    setSaving(true); setError('');
    try {
      const formData = new FormData();
      formData.append('versao', form.versao.trim());
      formData.append('descricao', form.descricao || '');
      formData.append('apk', apkFile);
      await apiFetch('/api/admin/app-updates', { method: 'POST', body: formData });
      setForm({ versao: '', descricao: '' });
      setApkFile(null);
      if (apkInputRef.current) { apkInputRef.current.value = ''; }
      await load();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const toggleAtivo = async (u: AppUpdate) => {
    setError('');
    try {
      await apiFetch(`/api/admin/app-updates/${u.id}`, { method: 'PUT', body: JSON.stringify({ ativo: !u.ativo }) });
      await load();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar');
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Remover esta atualização?')) return;
    setError('');
    try {
      await apiFetch(`/api/admin/app-updates/${id}`, { method: 'DELETE' });
      await load();
    } catch (err: any) {
      setError(err.message || 'Erro ao remover');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-extrabold text-[#0b462c] tracking-tight flex items-center gap-2">
          <RefreshCw className="w-6 h-6" /> Atualizações do App
        </h2>
        <p className="text-xs text-[#8b9aa5] font-medium mt-1">
          Cadastre uma nova versão do aplicativo Android. As telas com versão diferente recebem um pop-up perguntando se querem manter a versão atual ou atualizar.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-xs font-bold text-rose-600">{error}</div>
      )}

      <div className="bg-white border border-[#e8edf2] rounded-[24px] p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-[#0b462c] uppercase tracking-wider">Nova Atualização</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase">Versão *</label>
            <input
              type="text"
              value={form.versao}
              onChange={e => setForm({ ...form, versao: e.target.value })}
              placeholder="Ex.: 3.12.84"
              className="w-full h-10 border border-zinc-200 rounded-lg px-3 text-xs focus:outline-none focus:border-[#0066ff] bg-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase">Arquivo APK *</label>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-white border border-zinc-200 rounded-lg px-3 h-10 flex items-center text-xs text-zinc-600 truncate font-mono">
                {apkFile ? apkFile.name : 'Nenhum arquivo selecionado'}
              </div>
              <div className="relative shrink-0">
                <input
                  ref={apkInputRef}
                  type="file"
                  onChange={e => setApkFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".apk"
                />
                <button
                  type="button"
                  className="px-4 h-10 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-600 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <UploadCloud className="w-4 h-4" /> Selecionar APK
                </button>
              </div>
            </div>
          </div>
        </div>
        <div>
          <label className="text-[10px] font-bold text-zinc-500 uppercase">Texto explicativo do pop-up</label>
          <textarea
            value={form.descricao}
            onChange={e => setForm({ ...form, descricao: e.target.value })}
            placeholder="Ex.: Esta versão corrige a reprodução de vídeos e melhora o desempenho dos widgets."
            rows={3}
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0066ff] bg-white"
          />
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2.5 rounded-full bg-[#0b462c] hover:bg-[#082a1b] text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> {saving ? 'Salvando...' : 'Cadastrar Atualização'}
        </button>
      </div>

      <div className="bg-white border border-[#e8edf2] rounded-[24px] p-6 shadow-sm">
        <h3 className="text-sm font-extrabold text-[#0b462c] uppercase tracking-wider mb-4">Atualizações Cadastradas</h3>
        {loading ? (
          <p className="text-xs text-zinc-400 py-6 text-center">Carregando...</p>
        ) : updates.length === 0 ? (
          <p className="text-xs text-zinc-400 py-6 text-center">Nenhuma atualização cadastrada.</p>
        ) : (
          <div className="space-y-3">
            {updates.map(u => (
              <div key={u.id} className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 hover:bg-zinc-50 transition-colors">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-zinc-700">v{u.versao}</p>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-semibold ${u.ativo ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-400'}`}>
                      {u.ativo ? 'ATIVA' : 'INATIVA'}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-0.5 truncate">{u.descricao || 'Sem descrição'}</p>
                  {u.arquivo_url && <p className="text-[9px] text-zinc-300 font-mono truncate">{u.arquivo_url}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleAtivo(u)}
                    title={u.ativo ? 'Desativar' : 'Ativar'}
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${u.ativo ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => remove(u.id)}
                    title="Remover"
                    className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
