
import React, { useState } from 'react';
import { Produto, Venda } from '../types';
import { db } from '../lib/database';

interface VendasProps {
  produtos: Produto[];
  onVendaRealizada: () => void;
}

const Vendas: React.FC<VendasProps> = ({ produtos, onVendaRealizada }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<Venda['forma_pagamento']>('Pix');
  const [search, setSearch] = useState('');

  const filteredProducts = produtos.filter(p => 
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    p.categoria.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectProduct = (p: Produto) => {
    setSelectedProduct(p);
    setQuantity(p.unidade === 'UN' ? 1 : 1.0);
    setStep(2);
  };

  const handleFinish = () => {
    if (!selectedProduct) return;
    
    db.registrarVenda({
      produto_id: selectedProduct.id,
      produto_nome: selectedProduct.nome,
      quantidade: quantity,
      valor_total: selectedProduct.preco_venda * quantity,
      forma_pagamento: paymentMethod
    });

    onVendaRealizada();
    setStep(3);
    
    setTimeout(() => {
      reset();
    }, 2000);
  };

  const reset = () => {
    setStep(1);
    setSelectedProduct(null);
    setQuantity(1);
    setPaymentMethod('Pix');
    setSearch('');
  };

  if (step === 1) {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
        <div className="bg-white p-2 rounded-2xl flex items-center gap-2 border shadow-sm sticky top-0 z-10">
          <svg className="text-slate-400 ml-2" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input 
            type="text" 
            placeholder="Qual produto vendeu?" 
            className="w-full p-3 outline-none text-lg font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-2">
          {filteredProducts.map(p => (
            <button 
              key={p.id}
              onClick={() => handleSelectProduct(p)}
              className="bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-100 shadow-sm active:scale-95 transition-transform text-left"
            >
              <div>
                <p className="font-bold text-slate-800">{p.nome}</p>
                <p className="text-xs text-slate-400 uppercase font-semibold">{p.categoria} • R$ {p.preco_venda.toFixed(2)}/{p.unidade}</p>
              </div>
              <div className={`text-xs px-2 py-1 rounded-md font-bold ${p.quantidade_atual > p.alerta_minimo ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-600'}`}>
                {p.quantidade_atual} {p.unidade}
              </div>
            </button>
          ))}
          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-slate-400">Nenhum produto encontrado.</div>
          )}
        </div>
      </div>
    );
  }

  if (step === 2 && selectedProduct) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
        <div className="flex items-center gap-4">
          <button onClick={() => setStep(1)} className="p-2 bg-slate-100 rounded-xl text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h2 className="text-xl font-bold">Detalhes da Venda</h2>
        </div>

        <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Produto</label>
            <p className="text-lg font-bold text-slate-800">{selectedProduct.nome}</p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-3">Quantidade ({selectedProduct.unidade})</label>
            <div className="flex items-center gap-4">
              {selectedProduct.unidade === 'UN' ? (
                <>
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl font-bold text-slate-600"
                  >–</button>
                  <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-2xl font-bold text-white"
                  >+</button>
                </>
              ) : (
                <input 
                  type="number" 
                  step="0.1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  className="w-full p-4 bg-slate-50 rounded-2xl text-2xl font-bold outline-none border-2 border-transparent focus:border-blue-400"
                />
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-3">Forma de Pagamento</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Pix', 'Dinheiro', 'Cartão'] as const).map(method => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                    paymentMethod === method 
                      ? 'bg-blue-50 border-blue-600 text-blue-600' 
                      : 'bg-white border-slate-100 text-slate-400'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-dashed">
            <div className="flex justify-between items-center mb-6">
              <span className="text-slate-500 font-medium">Total</span>
              <span className="text-2xl font-black text-slate-800">R$ {(selectedProduct.preco_venda * quantity).toFixed(2)}</span>
            </div>
            <button 
              onClick={handleFinish}
              className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-blue-100 active:scale-95 transition-transform"
            >
              Finalizar Venda
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-in zoom-in-95">
      <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
      </div>
      <h2 className="text-2xl font-black text-slate-800">Venda Realizada!</h2>
      <p className="text-slate-500 mt-2">O estoque foi atualizado automaticamente.</p>
      <button 
        onClick={reset}
        className="mt-8 text-blue-600 font-bold"
      >
        Fazer outra venda
      </button>
    </div>
  );
};

export default Vendas;
