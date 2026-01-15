import React, { useState, useEffect } from 'react';
import { View, Transaction, Product } from '../types';
import NewSaleBottomSheet from '../components/NewSaleBottomSheet';
import FinancialChart from '../components/FinancialChart';
import { db } from '../lib/database';
import { supabase } from '../lib/supabase';

interface HomeProps {
  onNavigate: (view: View) => void;
  onUpdate?: () => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate, onUpdate }) => {
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    // Load Transactions for current month
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const monthStr = `${year}-${month}`;

    const txs = await db.getTransactions(monthStr);
    setTransactions(txs);

    const prods = await db.getProducts();
    setProducts(prods);
    setLoading(false);
  };

  const salesToday = transactions.filter(t => {
    // Assuming 'income' is a sale. 
    // Filter by today's date
    const todayStr = new Date().toISOString().split('T')[0];
    return t.type === 'income' && t.date === todayStr;
  });

  const pendingBills = transactions.filter(t => t.type === 'expense' && t.status === 'pending');

  const incomeToday = salesToday.reduce((acc, t) => acc + t.amount, 0);
  // We can calculate profit if we store cost, but Transaction currently only has amount. 
  // For now, let's just show Revenue. Or we can assume specific margin? 
  // Let's just show Revenue for "Vendas Hoje" and maybe total stats for the month.

  const monthIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const monthExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

  const handleSaleConfirm = async (produtoId: string, quantidade: number, formaPagamento: 'Dinheiro' | 'Pix' | 'Cartão') => {
    const produto = products.find(p => p.id === produtoId);
    if (!produto) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
    if (!profile) return;

    // 1. Create Transaction (Income)
    await db.addTransaction({
      organization_id: profile.organization_id,
      description: `Venda: ${produto.name} (${quantidade}x)`,
      amount: produto.sale_price * quantidade,
      type: 'income',
      category: 'Vendas',
      date: new Date().toISOString().split('T')[0],
      status: 'completed'
    });

    // 2. Decrement Stock
    if (produto.stock_quantity >= quantidade) {
      await db.updateProduct(produto.id, {
        stock_quantity: produto.stock_quantity - quantidade
      });
    }

    setIsNewSaleOpen(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    loadData();
    if (onUpdate) onUpdate();
  };

  return (
    <div className="space-y-6 relative pb-20">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-full shadow-lg z-[60] flex items-center gap-2 animate-fade-in-down">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          <span className="font-semibold">Venda registrada!</span>
        </div>
      )}

      {/* Resumo Financeiro */}
      <section className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-slate-500 text-sm font-medium">Vendas Hoje</p>
            <span className="text-2xl font-bold text-slate-800 block">R$ {incomeToday.toFixed(2)}</span>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-100">
            <p className="text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">Mês (Entradas)</p>
            <span className="text-xl font-black text-emerald-700 block">R$ {monthIncome.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <div className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap">
            {salesToday.length} Vendas hoje
          </div>
          <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap">
            {pendingBills.length} Contas a pagar
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
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          <span className="font-bold">Pagar Contas</span>
        </button>
      </div>

      {/* Gráfico Mensal */}
      <FinancialChart entradas={monthIncome} saidas={monthExpense} />

      <NewSaleBottomSheet
        isOpen={isNewSaleOpen}
        onClose={() => setIsNewSaleOpen(false)}
        products={products}
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
