
import React, { useState } from 'react';
import { Produto, Venda, Conta, View } from '../types';
import NewSaleBottomSheet from '../components/NewSaleBottomSheet';
import FinancialChart from '../components/FinancialChart';
import { db } from '../lib/database';

interface HomeProps {
  onNavigate: (view: View) => void;
  onUpdate?: () => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate, onUpdate }) => {
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const vendasHoje = db.getVendasHoje();
  const contas = db.getContas();
  const produtos = db.getProdutos();

  const faturamentoHoje = vendasHoje.reduce((acc, v) => acc + v.valor_total, 0);
  const lucroHoje = vendasHoje.reduce((acc, v) => acc + (v.lucro || 0), 0);
  const contasPendentes = contas.filter(c => !c.pago);

  const handleSaleConfirm = (produtoId: string, quantidade: number, formaPagamento: 'Dinheiro' | 'Pix' | 'Cartão') => {
    const produto = produtos.find(p => p.id === produtoId);
    if (!produto) return;

    db.registrarVenda({
      produto_id: produtoId,
      produto_nome: produto.nome,
      quantidade: quantidade,
      valor_total: produto.preco_venda * quantidade,
      forma_pagamento: formaPagamento
    });

    setIsNewSaleOpen(false);

    // Show toast
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);

    // Refresh data
    if (onUpdate) onUpdate();
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-full shadow-lg z-[60] flex items-center gap-2 animate-fade-in-down">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          <span className="font-semibold">Sucesso! Estoque atualizado.</span>
        </div>
      )}

      {/* Resumo Financeiro */}
      <section className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-slate-500 text-sm font-medium">Vendas Hoje</p>
            <span className="text-2xl font-bold text-slate-800 block">R$ {faturamentoHoje.toFixed(2)}</span>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-100">
            <p className="text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">Lucro Líquido</p>
            <span className="text-xl font-black text-emerald-700 block">R$ {lucroHoje.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <div className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap">
            {vendasHoje.length} Vendas realizadas
          </div>
          <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap">
            {contasPendentes.length} Contas a pagar
          </div>
        </div>
      </section>

      {/* Atalhos Rápidos */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setIsNewSaleOpen(true)}
          className="bg-blue-600 text-white p-5 rounded-3xl flex flex-col items-center justify-center gap-2 shadow-lg shadow-blue-100 active:scale-95 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
          <span className="font-bold">Nova Venda</span>
        </button>
        <button
          onClick={() => onNavigate('contas')}
          className="bg-white text-slate-700 p-5 rounded-3xl flex flex-col items-center justify-center gap-2 border border-slate-200 shadow-sm active:scale-95 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" x2="19" y1="8" y2="14" /><line x1="22" x2="16" y1="11" y2="11" /></svg>
          <span className="font-bold">Pagar Contas</span>
        </button>
      </div>

      {/* Gráfico Mensal */}
      <FinancialChart entradas={12500} saidas={4200} />





      <NewSaleBottomSheet
        isOpen={isNewSaleOpen}
        onClose={() => setIsNewSaleOpen(false)}
        products={produtos}
        onConfirm={handleSaleConfirm}
      />

      <style>{`
        @keyframes fade-in-down {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Home;
