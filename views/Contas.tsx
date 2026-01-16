
import React, { useState, useEffect, useRef } from 'react';
import { Transaction } from '../types';
import { db } from '../lib/database';
import { supabase } from '../lib/supabase';
import { useFinance } from '../contexts/FinanceContext';
import PageTransition from '../components/PageTransition';

interface ContasProps {
  onUpdate: () => void;
}

const Contas: React.FC<ContasProps> = ({ onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'pagar' | 'historico'>('pagar');
  const [isAddingBill, setIsAddingBill] = useState(false); // Nova Conta (Future)
  const [isAddingExpense, setIsAddingExpense] = useState(false); // Gasto (Now)

  const formSectionRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    setTimeout(() => {
      formSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }, 100);
  };

  // States for "Nova Conta" (Pending Bill)
  const [newBill, setNewBill] = useState({
    description: '',
    amount: '',
    dueDateDay: 10,
    category: 'Outros',
    type: 'Fixa' as 'Fixa' | 'Variavel' // Added Type: Fixed or Variable
  });

  // States for "Lançar Gasto" (Immediate Expense)
  const [newExpense, setNewExpense] = useState({
    amount: '',
    description: '',
    category: 'Alimentação'
  });

  const { transactions: ctxTransactions, refreshTransactions, loading: ctxLoading } = useFinance();
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    setLocalTransactions(ctxTransactions);
  }, [ctxTransactions]);

  // Use localTransactions for rendering instead of 'transactions' state
  // We can keep 'transactions' state for consistency if other functions use it,
  // OR strictly alias it. Let's alias it for minimal refactor impact:
  const transactions = localTransactions;
  const loading = ctxLoading;

  // loadTransactions is now effectively refreshTransactions from context
  const loadTransactions = refreshTransactions;

  const [animatingPaymentId, setAnimatingPaymentId] = useState<string | null>(null);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  // States for Editing Value of Pending "Variable" bills
  const [editingValueId, setEditingValueId] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');

  useEffect(() => {
    loadTransactions();
  }, []);

  const getOrgId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
    return data?.organization_id;
  }

  const togglePago = async (t: Transaction) => {
    setAnimatingPaymentId(t.id);
    await new Promise(resolve => setTimeout(resolve, 500));
    await new Promise(resolve => setTimeout(resolve, 500));
    // Use 'paid' for consistency with transactions from Home/Sales
    await db.updateTransaction(t.id, { status: 'paid' });
    await loadTransactions();
    onUpdate();
    setAnimatingPaymentId(null);
  };

  const handleUpdateValor = async (id: string) => {
    if (!tempValue) return;
    await db.updateTransaction(id, { amount: parseFloat(tempValue) });
    setEditingValueId(null);
    setTempValue('');
    loadTransactions();
    onUpdate();
  }

  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    const orgId = await getOrgId();
    if (!orgId) return;

    const today = new Date();
    const targetMonth = today.getMonth();
    const targetYear = today.getFullYear();
    const dueDate = new Date(targetYear, targetMonth, newBill.dueDateDay);

    const year = dueDate.getFullYear();
    const month = String(dueDate.getMonth() + 1).padStart(2, '0');
    const day = String(dueDate.getDate()).padStart(2, '0');
    const dateStr = `${year} -${month} -${day} `;

    // Logic: If Variable, amount is 0 (signaling "Needs Value")
    const finalAmount = newBill.type === 'Fixa' ? (parseFloat(newBill.amount) || 0) : 0;

    await db.addTransaction({
      organization_id: orgId,
      description: newBill.description,
      amount: finalAmount,
      type: 'expense',
      category: newBill.category,
      date: dateStr,
      status: 'pending'
    });

    await loadTransactions();
    onUpdate();
    setIsAddingBill(false);
    setNewBill({ description: '', amount: '', dueDateDay: 10, category: 'Outros', type: 'Fixa' });
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.amount || !newExpense.description) return;

    const orgId = await getOrgId();
    if (!orgId) return;

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year} -${month} -${day} `;

    await db.addTransaction({
      organization_id: orgId,
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      type: 'expense',
      category: newExpense.category,
      date: dateStr,
      status: 'paid'
    });

    await loadTransactions();
    onUpdate();
    setIsAddingExpense(false);
    setNewExpense({ amount: '', description: '', category: 'Alimentação' });
    setActiveTab('historico');
  };

  const handleDeleteClick = (id: string) => {
    setTransactionToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (transactionToDelete) {
      await db.deleteTransaction(transactionToDelete);
      setDeleteModalOpen(false);
      setTransactionToDelete(null);
      loadTransactions();
      onUpdate();
    }
  };

  const pending = transactions.filter(t => t.status === 'pending');
  // Include both 'completed' (old bills) and 'paid' (sales/new bills) in History, sorted by date DESC
  const completed = transactions
    .filter(t => t.status === 'completed' || t.status === 'paid')
    .sort((a, b) => {
      // Primary sort: Date Descending (Newest first)
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      // Secondary sort: Created At Descending (Newest created first for same date)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <PageTransition>
      <div className="space-y-6 pb-20">

        {/* 1. Header de Ações */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => {
              if (!isAddingExpense) scrollToForm();
              setIsAddingExpense(!isAddingExpense);
            }}
            className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
          >
            <div className="bg-amber-100 text-amber-600 p-1.5 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></svg>
            </div>
            Lançar Gasto
          </button>
          <button
            onClick={() => {
              if (!isAddingBill) scrollToForm();
              setIsAddingBill(!isAddingBill);
            }}
            className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-200 active:scale-95 transition-transform"
          >
            <div className="bg-white/20 p-1.5 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
            </div>
            Nova Conta
          </button>
        </div>

        {/* 2. Abas Segmented Control */}
        <div className="bg-slate-100 p-1 rounded-2xl flex gap-1">
          <button
            onClick={() => setActiveTab('pagar')}
            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'pagar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <span>Em Aberto</span>
            {pending.length > 0 && <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded-md text-[10px]">{pending.length}</span>}
          </button>
          <button
            onClick={() => setActiveTab('historico')}
            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'historico' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <span>Histórico</span>
          </button>
        </div>



        <div ref={formSectionRef} className="scroll-mt-4">
          {/* Expense Modal (Form) */}
          {isAddingExpense && (
            <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-xl space-y-5 animate-in slide-in-from-top-4 relative overflow-hidden max-w-md mx-auto w-full">
              {/* ... (Expense Form UI remains same) ... */}
              <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400"></div>
              <h3 className="font-bold text-slate-700 flex items-center gap-2 text-lg">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Novo Gasto Extra
              </h3>
              <form onSubmit={handleAddExpense} className="space-y-5">
                {/* ... Inputs ... */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quanto custou? (R$)</label>
                  <input autoFocus type="number" step="0.01" required className="w-full text-4xl font-black text-slate-800 placeholder-slate-200 outline-none border-b-2 border-slate-100 pb-2 focus:border-amber-400 transition-colors mt-1" placeholder="0,00" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">O que você comprou?</label>
                  <input required className="w-full p-3 mt-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-medium text-slate-700 placeholder-slate-300" placeholder="Ex: Almoço..." value={newExpense.description} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-3 block tracking-wider">Tipo de Gasto</label>
                  <div className="flex flex-wrap gap-2">
                    {['Alimentação', 'Material', 'Transporte', 'Outros'].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewExpense({ ...newExpense, category: cat })}
                        className={`px-4 py-2 rounded-full text-xs font-bold border transition-all active:scale-95 ${newExpense.category === cat ? 'bg-amber-100 text-amber-900 border-amber-200 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-amber-200 hover:text-amber-600'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsAddingExpense(false)} className="flex-1 py-3.5 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-xl transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 bg-amber-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-amber-200 active:scale-95 transition-all hover:bg-amber-600">Salvar Gasto</button>
                </div>
              </form>
            </div>
          )}

          {/* Bill Modal (Form with Features Restored) */}
          {isAddingBill && (
            <form onSubmit={handleAddBill} className="bg-white p-6 rounded-3xl border border-blue-50 shadow-xl space-y-5 animate-in slide-in-from-top-4 relative overflow-hidden max-w-md mx-auto w-full">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
              <h3 className="font-bold text-slate-700 flex items-center gap-2 text-lg">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Nova Conta a Pagar
              </h3>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Descrição</label>
                <input
                  required
                  className="w-full p-3 mt-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium text-slate-700 placeholder-slate-300"
                  value={newBill.description}
                  onChange={e => setNewBill({ ...newBill, description: e.target.value })}
                  placeholder="Ex: Aluguel, Internet..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-3 block tracking-wider">O valor muda todo mês?</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewBill({ ...newBill, type: 'Fixa' })}
                    className={`p-3 rounded-xl border-2 text-left transition-all relative overflow-hidden ${newBill.type === 'Fixa' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
                  >
                    <span className={`block text-xs font-bold mb-0.5 ${newBill.type === 'Fixa' ? 'text-blue-600' : 'text-slate-400'}`}>Valor Fixo</span>
                    <span className="block text-sm font-bold text-slate-700">Não muda</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewBill({ ...newBill, type: 'Variavel' })}
                    className={`p-3 rounded-xl border-2 text-left transition-all relative overflow-hidden ${newBill.type === 'Variavel' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
                  >
                    <span className={`block text-xs font-bold mb-0.5 ${newBill.type === 'Variavel' ? 'text-blue-600' : 'text-slate-400'}`}>Valor Variável</span>
                    <span className="block text-sm font-bold text-slate-700">Muda todo mês</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dia Venc.</label>
                  <input
                    type="number"
                    min="1" max="31"
                    required
                    className="w-full p-3 mt-2 bg-white border-2 border-slate-100 rounded-xl outline-none focus:border-blue-500 transition-colors font-black text-slate-700 text-center text-xl"
                    value={newBill.dueDateDay}
                    onChange={e => setNewBill({ ...newBill, dueDateDay: parseInt(e.target.value) })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {newBill.type === 'Fixa' ? 'Valor Padrão (R$)' : 'Estimativa (Opcional)'}
                  </label>
                  <div className="relative mt-2">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                    <input
                      type="number"
                      disabled={newBill.type === 'Variavel'}
                      className={`w-full p-4 pl-12 rounded-xl outline-none transition-colors font-black text-2xl ${newBill.type === 'Variavel' ? 'bg-slate-50 text-slate-300 border-2 border-slate-100 cursor-not-allowed' : 'bg-white text-slate-800 border-2 border-blue-100 focus:border-blue-500 shadow-sm'}`}
                      value={newBill.amount}
                      onChange={e => setNewBill({ ...newBill, amount: e.target.value })}
                      placeholder={newBill.type === 'Variavel' ? '---' : '0.00'}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsAddingBill(false)} className="flex-1 py-3.5 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 bg-slate-900 text-white py-3.5 rounded-xl font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all">Salvar Conta</button>
              </div>
            </form>

          )
          }
        </div >

        {/* 3. Cards de Contas */}
        {
          activeTab === 'pagar' && (
            <div className="space-y-4">
              {pending.length === 0 ? (
                <div className="text-center py-10 opacity-50 flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                  </div>
                  <p className="text-sm font-bold text-slate-400">Tudo pago por aqui!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pending.sort((a, b) => a.date.localeCompare(b.date)).map(c => {
                    const hoje = new Date().toISOString().split('T')[0];
                    const vencida = c.date < hoje;
                    const isHoje = c.date === hoje;
                    const isVariableNeedValue = c.amount === 0;

                    // Semantic Logic
                    let accentBorder = "border-slate-300"; // Default Future
                    let statusColor = "text-slate-500";

                    if (isVariableNeedValue) {
                      accentBorder = "border-amber-400";
                      statusColor = "text-amber-600";
                    } else if (vencida) {
                      accentBorder = "border-red-600";
                      statusColor = "text-red-600";
                    } else if (isHoje) {
                      accentBorder = "border-orange-500";
                      statusColor = "text-orange-600";
                    } else {
                      accentBorder = "border-blue-500";
                      statusColor = "text-blue-600";
                    }

                    const isAnimating = animatingPaymentId === c.id;

                    return (
                      <div
                        key={c.id}
                        className={`bg - white p - 5 rounded - r - xl rounded - l - md shadow - sm flex items - center justify - between border - l - [6px] ${accentBorder} transition - all duration - 500 ${isAnimating ? 'scale-105 bg-green-50 border-green-500 opacity-0 translate-x-full' : 'opacity-100 hover:shadow-md'} `}
                      >

                        {/* Left: Info */}
                        <div>
                          <h4 className={`font - bold text - base transition - colors ${isAnimating ? 'text-green-700' : 'text-slate-800'} `}>
                            {isAnimating ? 'PAGO COM SUCESSO!' : c.description}
                          </h4>
                          <p className={`text - xs font - bold mt - 1 uppercase tracking - wide flex items - center gap - 1.5 ${isAnimating ? 'hidden' : statusColor} `}>
                            {!isAnimating && vencida && !isVariableNeedValue && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>}
                            {!isAnimating && isHoje && !isVariableNeedValue && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}

                            {!isAnimating && (
                              isVariableNeedValue ? 'Aguardando Valor' :
                                isHoje ? 'Vence Hoje!' :
                                  vencida ? `Venceu dia ${new Date(c.date).getUTCDate()}/${new Date(c.date).getUTCMonth() + 1}` :
                                    `Vence dia ${new Date(c.date).getUTCDate()}/${new Date(c.date).getUTCMonth() + 1}`
                            )}
                          </p >
                        </div >

                        {/* Right: Actions */}
                        < div className="flex items-center gap-4" >

                          {/* Case 1: Variable / Needs Value */}
                          {
                            isVariableNeedValue ? (
                              editingValueId === c.id ? (
                                <div className="flex items-center gap-2 animate-in slide-in-from-right">
                                  <input
                                    autoFocus
                                    type="number"
                                    className="w-24 p-2 bg-white border-2 border-amber-200 rounded-lg text-lg outline-none font-bold text-slate-800 text-center shadow-sm focus:border-amber-400"
                                    placeholder="R$?"
                                    value={tempValue}
                                    onChange={e => setTempValue(e.target.value)}
                                  />
                                  <button onClick={() => handleUpdateValor(c.id)} className="bg-amber-500 text-white w-10 h-10 rounded-lg flex items-center justify-center shadow-md active:scale-95 transition-transform">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setEditingValueId(c.id)}
                                  className="bg-amber-50 text-amber-700 px-4 py-2 rounded-lg text-sm font-bold border border-amber-200 shadow-sm hover:bg-amber-100 hover:shadow-md transition-all active:scale-95"
                                >
                                  Definir Valor
                                </button>
                              )
                            ) : (
                              // Case 2: Defined Value
                              <>
                                {!isAnimating && (
                                  <span className={`font-black text-base ${vencida ? 'text-red-600' : 'text-slate-700'}`}>
                                    R$ {c.amount.toFixed(2)}
                                  </span>
                                )}

                                <button
                                  onClick={() => togglePago(c)}
                                  disabled={isAnimating}
                                  className={`rounded-full flex items-center justify-center text-white shadow-md transition-all duration-500 ease-out
                              ${isAnimating
                                      ? 'w-12 h-12 bg-green-500 rotate-[360deg] scale-125'
                                      : `w-10 h-10 active:scale-90 hover:scale-105 bg-emerald-500 shadow-emerald-200`
                                    }`}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width={isAnimating ? 24 : 20} height={isAnimating ? 24 : 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                </button>
                              </>
                            )
                          }
                        </div >
                      </div >
                    );
                  })}
                </div >
              )}
            </div >
          )
        }

        {/* 4. Lista Histórico */}
        {
          activeTab === 'historico' && (
            <div className="space-y-4">
              {completed.length === 0 ? (
                <div className="text-center py-10 opacity-50">
                  <p className="text-sm font-bold text-slate-400">Nenhum histórico.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {completed.map(c => {
                    const isExpense = c.type === 'expense';
                    return (
                      <div key={c.id} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isExpense ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>
                            {isExpense ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-700 text-sm">{c.description}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                              {new Date(c.date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-700 text-sm opacity-90 block">R$ {c.amount.toFixed(2)}</span>
                          <button onClick={() => handleDeleteClick(c.id)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )
        }

        {/* Delete Confirmation Modal */}
        {
          deleteModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                </div>
                <h3 className="text-lg font-bold text-center text-slate-800 mb-2">Excluir Registro?</h3>
                <p className="text-sm text-center text-slate-500 mb-6">Você tem certeza que deseja remover este item do histórico? Esta ação não pode ser desfeita.</p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteModalOpen(false)} className="flex-1 py-3 text-slate-600 font-bold bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
                    Cancelar
                  </button>
                  <button onClick={confirmDelete} className="flex-1 py-3 text-white font-bold bg-red-600 rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 active:scale-95 transition-all">
                    Sim, Excluir
                  </button>
                </div>
              </div>
            </div>
          )
        }

      </div >
    </PageTransition >
  );
};

export default Contas;

