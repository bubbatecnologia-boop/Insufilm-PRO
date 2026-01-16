import React, { useState, useEffect } from 'react';
import { View, Transaction, Product } from '../types';
import NewSaleBottomSheet from '../components/NewSaleBottomSheet';
import FinancialChart from '../components/FinancialChart';
import PageTransition from '../components/PageTransition';
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

  const getLocalDate = () => {
    const date = new Date();
    // Adjust for timezone offset to get correct YYYY-MM-DD for local time
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

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
    // Filter by today's date (Local Time)
    const todayStr = getLocalDate();
    return t.type === 'income' && t.date === todayStr;
  });

  const pendingBills = transactions.filter(t => t.type === 'expense' && t.status === 'pending');

  const incomeToday = salesToday.reduce((acc, t) => acc + t.amount, 0);
  const monthIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const monthCost = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + (t.cost_amount ?? 0), 0);
  const monthExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const monthNet = monthIncome - monthCost - monthExpense;

  const handleSaleConfirm = async (
    items: { product: Product; quantity: number; price: number }[],
    totalValue: number,
    paymentMethod: 'Dinheiro' | 'Pix' | 'Cartão'
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
    if (!profile) return;

    const todayStr = getLocalDate();

    // 1. Create Description from items
    const description = items.map(i => `${i.product.name} (${i.quantity}x)`).join(', ');

    // 2. Create Transaction (Income)
    // 2.1 Calculate Cost Amount (COGS)
    const totalCost = items.reduce((acc, item) => {
      return acc + (item.product.cost_price * item.quantity);
    }, 0);

    const result = await db.addTransaction({
      organization_id: profile.organization_id,
      description: `Venda: ${description}`,
      amount: totalValue,
      cost_amount: totalCost, // Storing Real Cost
      type: 'income',
      date: todayStr,
      status: 'paid'
    });

    if (!result) {
      alert("Erro ao registrar venda! Verifique se você rodou o script de banco de dados para adicionar a coluna 'cost_amount'.");
      return;
    }

    // 3. Decrement Stock for each item
    for (const item of items) {
      // Only update stock if it's a physical product trackable (though logic implies all are Products)
      if (item.product.stock_quantity >= item.quantity) {
        await db.updateProduct(item.product.id, {
          stock_quantity: item.product.stock_quantity - item.quantity
        });
      }
    }

    setIsNewSaleOpen(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);

    setTimeout(() => {
      loadData();
    }, 500);

    if (onUpdate) onUpdate();
  };

  return (
    <PageTransition>
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
              <p className="text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">Mês (Líquido)</p>
              <span className="text-xl font-black text-emerald-700 block">R$ {monthNet.toFixed(2)}</span>
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
    </PageTransition>
  );
};

export default Home;
