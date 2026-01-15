
import React, { useState } from 'react';
import { Produto, UnidadeMedida } from '../types';
import { db } from '../lib/database';

interface EstoqueProps {
  produtos: Produto[];
  onUpdate: () => void;
}

const Estoque: React.FC<EstoqueProps> = ({ produtos, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New States for Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todos');

  const [formData, setFormData] = useState({
    nome: '',
    categoria: 'Acessórios',
    quantidade_atual: 0,
    preco_venda: 0,
    preco_custo: 0,
    alerta_minimo: 5,
    unidade: 'UN' as UnidadeMedida
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      db.updateProduto(editingId, formData);
      setEditingId(null);
    } else {
      db.addProduto(formData);
    }

    onUpdate();
    setIsAdding(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ nome: '', categoria: 'Acessórios', quantidade_atual: 0, preco_venda: 0, preco_custo: 0, alerta_minimo: 5, unidade: 'UN' });
    setEditingId(null);
  };

  const handleEdit = (produto: Produto) => {
    setFormData({
      nome: produto.nome,
      categoria: produto.categoria,
      quantidade_atual: produto.quantidade_atual,
      preco_venda: produto.preco_venda,
      preco_custo: produto.preco_custo,
      alerta_minimo: produto.alerta_minimo,
      unidade: produto.unidade
    });
    setEditingId(produto.id);
    setIsAdding(true);
  };

  // Filter Logic
  const filteredProdutos = produtos.filter(p => {
    const matchesSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'Todos' ||
      (activeFilter === 'Películas' && (p.categoria === 'Películas' || p.nome.toLowerCase().includes('insulfilm'))) ||
      (activeFilter === 'Eletrônicos' && p.categoria === 'Eletrônicos') ||
      (activeFilter === 'Outros' && !['Películas', 'Eletrônicos'].includes(p.categoria) && !p.nome.toLowerCase().includes('insulfilm'));
    return matchesSearch && matchesFilter;
  });

  const lowStock = produtos.filter(p => p.quantidade_atual <= p.alerta_minimo);

  return (
    <div className="space-y-6 pb-24">
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
          {['Todos', 'Películas', 'Eletrônicos', 'Outros'].map(filter => (
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

      {/* 2. Low Stock Section (Redesigned) */}
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
                  <h4 className="font-bold text-red-900">{p.nome}</h4>
                  <p className="text-xs font-bold text-red-400 mt-0.5">RESTAM {p.quantidade_atual} {p.unidade}</p>
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

      {/* 3. Main Product List (Redesigned) */}
      <div className="space-y-3">
        {filteredProdutos.length === 0 ? (
          <div className="text-center py-12 opacity-50">
            <p className="font-medium text-slate-400">Nenhum produto encontrado</p>
          </div>
        ) : (
          filteredProdutos.map(p => (
            <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 active:scale-[0.99] transition-transform" onClick={() => handleEdit(p)}>

              {/* Large Icon */}
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex-shrink-0 flex items-center justify-center text-slate-400 border border-slate-100">
                {p.unidade === 'MT' ? (
                  // Ruler/Roll Icon for Meters
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" /><path d="m14.5 12.5 2-2" /><path d="m11.5 9.5 2-2" /><path d="m8.5 6.5 2-2" /><path d="m17.5 15.5 2-2" /></svg>
                ) : (
                  // Cube/Box Icon for Units
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-800 text-base truncate">{p.nome}</h3>
                <p className="text-xs text-slate-500 font-medium">R$ {p.preco_venda.toFixed(2)}</p>
              </div>

              {/* Quantity Highlight */}
              <div className="text-right flex flex-col items-end">
                <span className="text-2xl font-bold text-slate-800 leading-none">{p.quantidade_atual}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{p.unidade}</span>
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
        className="fixed bottom-24 right-6 w-14 h-14 bg-blue-600 rounded-full text-white shadow-xl shadow-blue-300 flex items-center justify-center hover:bg-blue-700 active:scale-90 transition-all z-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
      </button>

      {/* Modal Form logic stays similar, rendered centrally */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in">
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
                value={formData.nome}
                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome do item..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Qtd Atual</label>
                <input
                  type="number"
                  required
                  className="w-full p-3 mt-1 bg-slate-50 text-center font-bold text-slate-700 rounded-xl outline-none focus:ring-2 ring-blue-100"
                  value={formData.quantidade_atual}
                  onChange={e => setFormData({ ...formData, quantidade_atual: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unidade</label>
                <div className="flex bg-slate-100 p-1 rounded-xl mt-1">
                  {['UN', 'MT'].map(u => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setFormData({ ...formData, unidade: u as UnidadeMedida })}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${formData.unidade === u ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Preço Custo</label>
                <input
                  type="number"
                  className="w-full p-3 mt-1 bg-slate-50 rounded-xl outline-none text-slate-600 font-medium"
                  value={formData.preco_custo}
                  onChange={e => setFormData({ ...formData, preco_custo: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Preço Venda</label>
                <input
                  type="number"
                  className="w-full p-3 mt-1 bg-slate-50 rounded-xl outline-none text-slate-800 font-bold"
                  value={formData.preco_venda}
                  onChange={e => setFormData({ ...formData, preco_venda: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="pt-2">
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-blue-200 active:scale-95 transition-all">
                Salvar Item
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Estoque;
