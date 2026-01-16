import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Product, ProductType } from '../types';
import { db } from '../lib/database';
import { supabase } from '../lib/supabase';
import PageTransition from '../components/PageTransition';

interface EstoqueProps {
  // onUpdate is less strict now, we handle re-fetching internally, 
  // but we might keep it if App needs to know.
  produtos: never[]; // Legacy prop, ignored
  onUpdate: () => void;
}

const Estoque: React.FC<EstoqueProps> = ({ onUpdate }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // New States for Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todos');

  const [formData, setFormData] = useState({
    name: '',
    type: 'unidade' as ProductType,
    stock_quantity: 0,
    min_stock_alert: 5,
    sale_price: 0,
    cost_price: 0,
  });

  const fetchProducts = async () => {
    setLoading(true);
    const data = await db.getProducts();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Get current user org_id for insert (RLS checks it, but good to be explicit if needed)
    // Actually, our db.addProduct handles the insert. The RLS policy uses auth.uid()
    // BUT we need to provide organization_id on INSERT because the column is Not Null.
    // We can get it from the session or let the helper function do it.
    // For now, let's fetch the Org ID from the first product or a separate call?
    // BETTER: The user profile has the org_id. 
    // Let's assume for this MVP step we fetch it once or rely on a hardcoded "get my org" helper.
    // UPDATE: db.addProduct needs to know the org_id.

    // Quick Fix: Fetch Org ID from Supabase Profile on the fly or just rely on the stored session?
    // I'll fetch it inside `handleSubmit` for safety.

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Should not happen

    // Get org_id from profile
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
    if (!profile) {
      alert("Erro: Perfil sem organização.");
      return;
    }

    const payload = {
      organization_id: profile.organization_id,
      name: formData.name,
      type: formData.type,
      stock_quantity: formData.stock_quantity,
      min_stock_alert: formData.min_stock_alert,
      cost_price: formData.cost_price,
      sale_price: formData.sale_price
    };

    if (editingId) {
      await db.updateProduct(editingId, payload);
    } else {
      await db.addProduct(payload);
    }

    await fetchProducts(); // Refresh list
    onUpdate(); // Notify App (optional)
    setIsAdding(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'unidade',
      stock_quantity: 0,
      sale_price: 0,
      cost_price: 0,
      min_stock_alert: 5
    });
    setEditingId(null);
    setIsDeleting(false);
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      type: product.type,
      stock_quantity: product.stock_quantity,
      sale_price: product.sale_price,
      cost_price: product.cost_price,
      min_stock_alert: product.min_stock_alert
    });
    setEditingId(product.id);
    setIsAdding(true);
  };

  // Filter Logic
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());

    // Mapped Categories
    // 'material_metro' -> 'Películas'
    // 'unidade' -> 'Outros' / 'Acessórios'

    let matchesFilter = true;
    if (activeFilter === 'Todos') matchesFilter = true;
    else if (activeFilter === 'Películas') matchesFilter = (p.type === 'material_metro');
    else if (activeFilter === 'Acessórios') matchesFilter = (p.type === 'unidade');

    return matchesSearch && matchesFilter;
  });

  const lowStock = products.filter(p => p.stock_quantity <= p.min_stock_alert);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Carregando estoque...</div>;
  }

  return (
    <PageTransition>
      <div className="space-y-5 pb-20 relative min-h-screen">
        {/* Toast Notification */}
        {/* 1. Header with Search & Filters */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">Estoque</h2>

          {/* Search Input */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </div>
            <input
              type="text"
              placeholder="Buscar item..."
              className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm outline-none focus:border-blue-500 transition-colors font-medium text-slate-700"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {['Todos', 'Películas', 'Acessórios'].map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeFilter === filter
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Low Stock Section */}
        {lowStock.length > 0 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Reposição Necessária</h3>
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-md">{lowStock.length}</span>
            </div>
            <div className="space-y-2">
              {lowStock.map(p => (
                <div key={p.id} className="bg-red-50 p-4 rounded-3xl border border-red-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-red-900">{p.name}</h4>
                    <p className="text-xs font-bold text-red-400 mt-0.5">RESTAM {p.stock_quantity} {p.type === 'material_metro' ? 'Metros' : 'Un'}</p>
                  </div>
                  <button
                    onClick={() => handleEdit(p)}
                    className="text-sm font-bold text-red-600 hover:text-red-700 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Repor +
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Main Product List */}
        <div className="space-y-3">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 opacity-50">
              <p className="font-medium text-slate-400">Nenhum produto encontrado</p>
            </div>
          ) : (
            filteredProducts.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 active:scale-[0.99] transition-transform" onClick={() => handleEdit(p)}>

                {/* Icon */}
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex-shrink-0 flex items-center justify-center text-slate-400 border border-slate-100">
                  {p.type === 'material_metro' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" /><path d="m14.5 12.5 2-2" /><path d="m11.5 9.5 2-2" /><path d="m8.5 6.5 2-2" /><path d="m17.5 15.5 2-2" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 text-base truncate">{p.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">R$ {p.sale_price.toFixed(2)}</p>
                </div>

                {/* Quantity */}
                <div className="text-right flex flex-col items-end">
                  <span className="text-2xl font-bold text-slate-800 leading-none">{p.stock_quantity}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    {p.type === 'material_metro' ? 'MT' : 'UN'}
                  </span>
                </div>

              </div>
            ))
          )}
        </div>

        {/* 4. Floating Action Button (FAB) */}
        <button
          onClick={() => {
            if (isAdding) resetForm();
            setIsAdding(!isAdding);
          }}
          className="fixed bottom-28 right-6 w-14 h-14 bg-blue-600 rounded-full text-white shadow-xl shadow-blue-300 flex items-center justify-center hover:bg-blue-700 active:scale-90 transition-all z-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
        </button>

        {/* Modal Form - Portaled to escape stacking context */}
        {isAdding && createPortal(
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-4 animate-in fade-in">
            <form onSubmit={handleSubmit} className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom-10">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-xl text-slate-800">{editingId ? 'Editar Produto' : 'Novo Produto'}</h3>
                <button type="button" onClick={() => setIsAdding(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nome</label>
                <input
                  required
                  autoFocus
                  className="w-full text-lg font-bold border-b-2 border-slate-200 focus:border-blue-500 outline-none py-2 text-slate-800 placeholder-slate-300 transition-colors"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do item..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Qtd Atual</label>
                  <input
                    type="number"
                    required
                    step="0.01" // Enable decimals for meters
                    className="w-full p-3 mt-1 bg-slate-50 text-center font-bold text-slate-700 rounded-xl outline-none focus:ring-2 ring-blue-100"
                    value={formData.stock_quantity}
                    onChange={e => setFormData({ ...formData, stock_quantity: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl mt-1">
                    {[
                      { val: 'unidade' as ProductType, label: 'UN' },
                      { val: 'material_metro' as ProductType, label: 'MT' }
                    ].map(u => (
                      <button
                        key={u.val}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: u.val })}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${formData.type === u.val ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
                      >
                        {u.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Custo (Un/Ml)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full pl-9 pr-3 py-3 mt-1 bg-slate-50 font-bold text-slate-700 rounded-xl outline-none focus:ring-2 ring-blue-100 placeholder-slate-300"
                      placeholder="0.00"
                      value={formData.cost_price || ''}
                      onChange={e => setFormData({ ...formData, cost_price: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Venda (Un/Ml)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 text-sm font-bold">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full pl-9 pr-3 py-3 mt-1 bg-slate-50 font-bold text-slate-700 rounded-xl outline-none focus:ring-2 ring-emerald-100 placeholder-slate-300"
                      placeholder="0.00"
                      value={formData.sale_price || ''}
                      onChange={e => setFormData({ ...formData, sale_price: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alerta de Estoque Mínimo</label>
                <div className="flex items-center gap-4 mt-1 bg-slate-50 p-2 rounded-xl">
                  <input
                    type="range"
                    min="1"
                    max="50"
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    value={formData.min_stock_alert}
                    onChange={e => setFormData({ ...formData, min_stock_alert: parseInt(e.target.value) })}
                  />
                  <span className="text-sm font-bold text-slate-600 w-8 text-center">{formData.min_stock_alert}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-4">
                {isDeleting ? (
                  <div className="flex w-full gap-3 animate-in fade-in slide-in-from-bottom-2">
                    <button
                      type="button"
                      onClick={() => setIsDeleting(false)}
                      className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        console.log('Attempting delete for:', editingId);
                        const { error } = await db.deleteProduct(editingId!);
                        if (error) {
                          alert('Erro ao excluir: Produto em uso ou erro de sistema.');
                          setIsDeleting(false);
                          return;
                        }
                        await fetchProducts();
                        setIsAdding(false);
                        setIsDeleting(false);
                      }}
                      className="flex-1 py-3.5 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-colors"
                    >
                      Confirmar
                    </button>
                  </div>
                ) : (
                  <>
                    {editingId && (
                      <button
                        type="button"
                        onClick={() => setIsDeleting(true)}
                        className="p-3.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                        title="Excluir Produto"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                      </button>
                    )}

                    <button
                      type="submit"
                      className={`flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2 ${!editingId ? 'w-full' : ''}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                      {editingId ? 'Salvar Alterações' : 'Adicionar Produto'}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>,
          document.body
        )}
      </div>
    </PageTransition>
  );
};

export default Estoque;
