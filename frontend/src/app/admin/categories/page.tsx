'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, X, Save, Tag, ChevronDown, ChevronRight, FolderOpen } from 'lucide-react';
import { productsApi } from '@/lib/api';
import { useT } from '@/lib/i18n';
import toast from 'react-hot-toast';

interface Category {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  parent: number | null;
  children?: Category[];
}

const autoSlug = (name: string) =>
  name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();

function CategoryModal({
  editing, defaultParent, parents, onClose,
}: {
  editing: Category | null;
  defaultParent: number | null;
  parents: Category[];
  onClose: () => void;
}) {
  const t = useT();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name:      editing?.name      ?? '',
    slug:      editing?.slug      ?? '',
    is_active: editing?.is_active ?? true,
    parent:    editing?.parent    ?? defaultParent,
  });

  const isSubCat = form.parent !== null;

  const mut = useMutation({
    mutationFn: () => editing
      ? productsApi.updateCategory(editing.id, form)
      : productsApi.createCategory(form),
    onSuccess: () => {
      toast.success(editing ? t('adm.cat.updated') : t('adm.cat.created'));
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      onClose();
    },
    onError: () => toast.error(t('adm.cat.saveFailed')),
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card p-6 w-full max-w-md pointer-events-auto"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white flex items-center gap-2">
            {isSubCat ? <FolderOpen size={16} className="text-indigo-400"/> : <Tag size={16} className="text-indigo-400"/>}
            {editing ? t('adm.cat.edit') : t('adm.cat.new')} {isSubCat ? t('adm.cat.subCategory') : t('adm.cat.category')}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50"><X size={16}/></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1.5">
              {t('adm.cat.parentCategory')}
            </label>
            <select
              value={form.parent ?? ''}
              onChange={e => setForm(f => ({ ...f, parent: e.target.value ? Number(e.target.value) : null }))}
              className="glass-input">
              <option value="">{t('adm.cat.noParent')}</option>
              {parents.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {form.parent && (
              <p className="text-indigo-400 text-xs mt-1">
                {t('adm.cat.willAppearUnder').replace('{name}', parents.find(p => p.id === form.parent)?.name ?? '')}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1.5">
              {t('adm.cat.nameLabel')}
            </label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: autoSlug(e.target.value) }))}
              className="glass-input" placeholder="e.g. Running Shoes"/>
          </div>

          <div>
            <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1.5">
              {t('adm.cat.slugLabel')}
            </label>
            <input
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              className="glass-input font-mono text-sm" placeholder="running-shoes"/>
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" id="is_active" checked={form.is_active}
              onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
              className="w-4 h-4 rounded accent-indigo-500"/>
            <label htmlFor="is_active" className="text-sm text-white/70">{t('adm.cat.activeLabel')}</label>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="btn-glass flex-1 py-2.5 rounded-xl text-sm">
              {t('adm.cat.cancel')}
            </button>
            <button
              onClick={() => mut.mutate()}
              disabled={mut.isPending || !form.name}
              className="btn-primary flex-1 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              <Save size={14}/>{mut.isPending ? t('adm.cat.saving') : t('adm.cat.save')}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SubRow({ sub, onEdit, onDelete }: {
  sub: Category;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
}) {
  const t = useT();
  return (
    <tr className="bg-white/2 border-b border-white/5">
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2 ps-6">
          <span className="text-white/20 text-xs">└</span>
          <span className="text-white/80 text-sm">{sub.name}</span>
        </div>
      </td>
      <td className="px-4 py-2.5">
        <span className="text-white/40 text-xs font-mono">{sub.slug}</span>
      </td>
      <td className="px-4 py-2.5">
        <span className="text-white/30 text-xs">—</span>
      </td>
      <td className="px-4 py-2.5">
        <span className={`badge ${sub.is_active ? 'badge-green' : 'badge-red'}`}>
          {sub.is_active ? t('adm.cat.active') : t('adm.cat.inactive')}
        </span>
      </td>
      <td className="px-4 py-2.5">
        <div className="flex gap-1.5">
          <button onClick={() => onEdit(sub)}
            className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/30 transition-colors">
            <Pencil size={13}/>
          </button>
          <button onClick={() => onDelete(sub)}
            className="p-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/30 transition-colors">
            <Trash2 size={13}/>
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function AdminCategoriesPage() {
  const t = useT();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [modal, setModal]       = useState<{ editing: Category | null; defaultParent: number | null } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => productsApi.adminCategories().then(r => r.data),
  });

  const allCats: Category[] = (() => {
    const d = data;
    if (!d) return [];
    if (Array.isArray(d)) return d;
    if (Array.isArray(d.results)) return d.results;
    return [];
  })();

  const topLevel = allCats.filter(c => c.parent === null || c.parent === undefined);
  const subMap = allCats.reduce<Record<number, Category[]>>((acc, c) => {
    if (c.parent !== null && c.parent !== undefined) {
      acc[c.parent] = [...(acc[c.parent] ?? []), c];
    }
    return acc;
  }, {});

  const deleteMut = useMutation({
    mutationFn: (id: number) => productsApi.deleteCategory(id),
    onSuccess: () => { toast.success(t('adm.cat.deleted')); qc.invalidateQueries({ queryKey: ['admin-categories'] }); },
    onError:   () => toast.error(t('adm.cat.deleteFailed')),
  });

  const handleDelete = (c: Category) => {
    if (confirm(`Delete "${c.name}"?`)) deleteMut.mutate(c.id);
  };

  const toggleExpand = (id: number) =>
    setExpanded(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white">{t('adm.cat.title')}</h2>
        <button onClick={() => setModal({ editing: null, defaultParent: null })}
          className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm">
          <Plus size={15}/> {t('adm.cat.newCategory')}
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-white/40">{t('adm.cat.loading')}</div>
        ) : topLevel.length === 0 ? (
          <div className="p-12 text-center">
            <Tag size={32} className="text-white/20 mx-auto mb-3"/>
            <p className="text-white/40 mb-4">{t('adm.cat.empty')}</p>
            <button onClick={() => setModal({ editing: null, defaultParent: null })}
              className="btn-primary px-4 py-2 rounded-xl text-sm">{t('adm.cat.createFirst')}</button>
          </div>
        ) : (
          <table className="glass-table w-full">
            <thead>
              <tr>
                <th className="px-4 py-3 text-start">{t('adm.cat.colName')}</th>
                <th className="px-4 py-3 text-start">{t('adm.cat.colSlug')}</th>
                <th className="px-4 py-3 text-start">{t('adm.cat.colSubcats')}</th>
                <th className="px-4 py-3 text-start">{t('adm.cat.colStatus')}</th>
                <th className="px-4 py-3 text-start">{t('adm.cat.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {topLevel.map(cat => {
                const subs = subMap[cat.id] ?? [];
                const open = expanded.has(cat.id);
                return (
                  <>
                    <tr key={cat.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {subs.length > 0 ? (
                            <button onClick={() => toggleExpand(cat.id)}
                              className="p-0.5 rounded text-white/40 hover:text-white transition-colors">
                              {open ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                            </button>
                          ) : (
                            <span className="w-5"/>
                          )}
                          <span className="font-semibold text-white">{cat.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-white/50 text-xs font-mono">{cat.slug}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-white/60 text-sm">{subs.length}</span>
                          <button
                            onClick={() => { setModal({ editing: null, defaultParent: cat.id }); }}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/30 transition-colors">
                            <Plus size={10}/> {t('adm.cat.add')}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${cat.is_active ? 'badge-green' : 'badge-red'}`}>
                          {cat.is_active ? t('adm.cat.active') : t('adm.cat.inactive')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button onClick={() => setModal({ editing: cat, defaultParent: null })}
                            className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/30 transition-colors">
                            <Pencil size={13}/>
                          </button>
                          <button onClick={() => handleDelete(cat)}
                            className="p-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/30 transition-colors">
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </td>
                    </tr>

                    <AnimatePresence>
                      {open && subs.map(sub => (
                        <SubRow key={sub.id} sub={sub}
                          onEdit={s => setModal({ editing: s, defaultParent: null })}
                          onDelete={handleDelete}/>
                      ))}
                    </AnimatePresence>
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {modal && (
          <CategoryModal
            editing={modal.editing}
            defaultParent={modal.defaultParent}
            parents={topLevel}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
