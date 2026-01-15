
import React, { useState } from 'react';
import { Produto, UnidadeMedida } from '../types';
import { db } from '../lib/database';

interface EstoqueProps {
  produtos: Produto[];
  onUpdate: () => void;
}

const Estoque: React.FC<EstoqueProps> = ({ produtos, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    categoria: 'Acessórios',
    quantidade_atual: 0,
    preco_venda: 0,
    alerta_minimo: 5,
    unidade: 'UN' as UnidadeMedida
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    db.addProduto(formData);
    onUpdate();
    setIsAdding(false);
    setFormData({ nome: '', categoria: 'Acessórios', quantidade_atual: 0, preco_venda: 0, alerta_minimo: 5, unidade: 'UN' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Estoque</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
        >
          {isAdding ? 'Cancelar' : 'Cadastrar'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border shadow-sm space-y-4 animate-in slide-in-from-top-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">Nome do Produto</label>
            <input 
              required
              className="w-full p-3 mt-1 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-blue-100"
              value={formData.nome}
              onChange={e => setFormData({...formData, nome: e.target.value})}
              placeholder="Ex: Insulfilm G20"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Preço Venda</label>
              <input 
                type="number"
                required
                className="w-full p-3 mt-1 bg-slate-50 rounded-xl outline-none"
                value={formData.preco_venda}
                onChange={e => setFormData({...formData, preco_venda: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Unidade</label>
              <select 
                className="w-full p-3 mt-1 bg-slate-50 rounded-xl outline-none"
                value={formData.unidade}
                onChange={e => setFormData({...formData, unidade: e.target.value as UnidadeMedida})}
              >
                <option value="UN">Unidade (Peça)</option>
                <option value="MT">Metro (Rolo)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Qtd Inicial</label>
              <input 
                type="number"
                required
                className="w-full p-3 mt-1 bg-slate-50 rounded-xl outline-none"
                value={formData.quantidade_atual}
                onChange={e => setFormData({...formData, quantidade_atual: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Alerta Abaixo de</label>
              <input 
                type="number"
                required
                className="w-full p-3 mt-1 bg-slate-50 rounded-xl outline-none"
                value={formData.alerta_minimo}
                onChange={e => setFormData({...formData, alerta_minimo: parseFloat(e.target.value)})}
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold mt-4 shadow-lg shadow-blue-50">
            Salvar Produto
          </button>
        </form>
      )}

      <div className="space-y-3">
        {produtos.map(p => (
          <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                {p.unidade === 'MT' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0V3"/><path d="M3 12h18"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">{p.nome}</h3>
                <p className="text-xs text-slate-400">R$ {p.preco_venda.toFixed(2)} por {p.unidade}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-black text-sm ${p.quantidade_atual <= p.alerta_minimo ? 'text-red-500' : 'text-slate-600'}`}>
                {p.quantidade_atual} {p.unidade}
              </p>
              <p className="text-[10px] uppercase font-bold text-slate-300">Em Estoque</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Estoque;
