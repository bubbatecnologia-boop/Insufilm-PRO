
import React, { useState } from 'react';
import { Conta, ContaTemplate } from '../types';
import { db } from '../lib/database';

interface ContasProps {
  contas: Conta[];
  onUpdate: () => void;
}

const Contas: React.FC<ContasProps> = ({ contas, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'pagar' | 'historico'>('pagar');
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [isAddingExpense, setIsAddingExpense] = useState(false);

  // States for Template Form
  const [newTemplate, setNewTemplate] = useState({
    nome: '',
    dia_vencimento: 10,
    categoria: 'Outros',
    tipo: 'Fixa' as 'Fixa' | 'Variavel',
    valor_padrao: 0
  });

  // States for Expense Form
  const [newExpense, setNewExpense] = useState({
    valor: '',
    descricao: '',
    categoria: 'Alimentação'
  });

  const [editingValueId, setEditingValueId] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [animatingPaymentId, setAnimatingPaymentId] = useState<string | null>(null);

  const togglePago = async (id: string) => {
    // 1. Start Animation
    setAnimatingPaymentId(id);

    // 2. Wait for animation
    await new Promise(resolve => setTimeout(resolve, 500));

    // 3. Update DB
    db.toggleContaPaga(id);
    onUpdate();

    // 4. Reset
    setAnimatingPaymentId(null);
  };

  const handleUpdateValor = (id: string) => {
    if (!tempValue) return;
    db.updateValorConta(id, parseFloat(tempValue));
    onUpdate();
    setEditingValueId(null);
    setTempValue('');
  };

  const handleAddTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    db.addContaTemplate({
      nome: newTemplate.nome,
      dia_vencimento: newTemplate.dia_vencimento,
      categoria: newTemplate.categoria,
      tipo: newTemplate.tipo,
      valor_padrao: newTemplate.tipo === 'Fixa' ? newTemplate.valor_padrao : undefined
    });
    onUpdate();
    setIsAddingTemplate(false);
    setNewTemplate({ nome: '', dia_vencimento: 10, categoria: 'Outros', tipo: 'Fixa', valor_padrao: 0 });
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.valor || !newExpense.descricao) return;

    db.registrarDespesa({
      nome: newExpense.descricao,
      valor: parseFloat(newExpense.valor),
      categoria: newExpense.categoria
    });

    onUpdate();
    setIsAddingExpense(false);
    setNewExpense({ valor: '', descricao: '', categoria: 'Alimentação' });
    setActiveTab('historico'); // Go to history to see the new expense
  };

  const aPagar = contas.filter(c => !c.pago);
  const historico = contas.filter(c => c.pago).sort((a, b) => new Date(b.data_vencimento).getTime() - new Date(a.data_vencimento).getTime());

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este registro?')) {
      db.deleteConta(id);
      onUpdate();
    }
  };

  return (
    <div className="space-y-6 pb-20">

      {/* 1. Header de Ações (Clean & Modern) */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => setIsAddingExpense(!isAddingExpense)}
          className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
        >
          <div className="bg-amber-100 text-amber-600 p-1.5 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></svg>
          </div>
          Lançar Gasto
        </button>
        <button
          onClick={() => setIsAddingTemplate(!isAddingTemplate)}
          className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-200 active:scale-95 transition-transform"
        >
          <div className="bg-white/20 p-1.5 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
          </div>
          Nova Conta
        </button>
      </div>

      {/* 2. Abas Segmented Control (Clean) */}
      <div className="bg-slate-100 p-1 rounded-2xl flex gap-1">
        <button
          onClick={() => setActiveTab('pagar')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex flex-col items-center gap-0.5 ${activeTab === 'pagar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <span>Em Aberto</span>
          {aPagar.length > 0 && <span className="bg-red-50 text-red-600 px-1.5 rounded-md text-[10px]">{aPagar.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('historico')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex flex-col items-center gap-0.5 ${activeTab === 'historico' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <span>Histórico</span>
          <span className="text-[10px] opacity-0 h-4">.</span>
        </button>
      </div>

      {/* Expense Modal (Form) */}
      {isAddingExpense && (
        <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-xl space-y-5 animate-in slide-in-from-top-4 relative overflow-hidden max-w-md mx-auto w-full">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400"></div>
          <h3 className="font-bold text-slate-700 flex items-center gap-2 text-lg">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Novo Gasto Extra
          </h3>

          <form onSubmit={handleAddExpense} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quanto custou? (R$)</label>
              <input
                autoFocus
                type="number"
                step="0.01"
                required
                className="w-full text-4xl font-black text-slate-800 placeholder-slate-200 outline-none border-b-2 border-slate-100 pb-2 focus:border-amber-400 transition-colors mt-1"
                placeholder="0,00"
                value={newExpense.valor}
                onChange={e => setNewExpense({ ...newExpense, valor: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">O que você comprou?</label>
              <input
                required
                className="w-full p-3 mt-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-medium text-slate-700 placeholder-slate-300"
                placeholder="Ex: Almoço, Peça do carro..."
                value={newExpense.descricao}
                onChange={e => setNewExpense({ ...newExpense, descricao: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-3 block tracking-wider">Tipo de Gasto</label>
              <div className="flex flex-wrap gap-2">
                {['Alimentação', 'Material', 'Transporte', 'Outros'].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNewExpense({ ...newExpense, categoria: cat })}
                    className={`px-4 py-2 rounded-full text-xs font-bold border transition-all active:scale-95 ${newExpense.categoria === cat ? 'bg-slate-800 text-white border-slate-800 shadow-lg shadow-slate-200' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsAddingExpense(false)}
                className="flex-1 py-3.5 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button type="submit" className="flex-1 bg-slate-900 text-white py-3.5 rounded-xl font-bold shadow-xl shadow-slate-200 active:scale-95 transition-all hover:bg-slate-800">
                Salvar Gasto
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Template Modal (Form) */}
      {isAddingTemplate && (
        <form onSubmit={handleAddTemplate} className="bg-white p-6 rounded-3xl border border-blue-50 shadow-xl space-y-5 animate-in slide-in-from-top-4 relative overflow-hidden max-w-md mx-auto w-full">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
          <h3 className="font-bold text-slate-700 flex items-center gap-2 text-lg">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Nova Conta Mensal
          </h3>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nome da Conta</label>
            <input
              required
              className="w-full p-3 mt-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium text-slate-700 placeholder-slate-300"
              value={newTemplate.nome}
              onChange={e => setNewTemplate({ ...newTemplate, nome: e.target.value })}
              placeholder="Ex: Aluguel, Internet..."
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase mb-3 block tracking-wider">O valor muda todo mês?</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setNewTemplate({ ...newTemplate, tipo: 'Fixa' })}
                className={`p-3 rounded-xl border-2 text-left transition-all relative overflow-hidden ${newTemplate.tipo === 'Fixa' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
              >
                <span className={`block text-xs font-bold mb-0.5 ${newTemplate.tipo === 'Fixa' ? 'text-blue-600' : 'text-slate-400'}`}>Valor Fixo</span>
                <span className="block text-sm font-bold text-slate-700">Não muda</span>
              </button>

              <button
                type="button"
                onClick={() => setNewTemplate({ ...newTemplate, tipo: 'Variavel' })}
                className={`p-3 rounded-xl border-2 text-left transition-all relative overflow-hidden ${newTemplate.tipo === 'Variavel' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
              >
                <span className={`block text-xs font-bold mb-0.5 ${newTemplate.tipo === 'Variavel' ? 'text-blue-600' : 'text-slate-400'}`}>Valor Variável</span>
                <span className="block text-sm font-bold text-slate-700">Muda todo mês</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dia Venc.</label>
              <input
                type="number"
                min="1" max="31"
                required
                className="w-full p-3 mt-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-colors font-bold text-slate-700 text-center"
                value={newTemplate.dia_vencimento}
                onChange={e => setNewTemplate({ ...newTemplate, dia_vencimento: parseInt(e.target.value) })}
              />
            </div>
            <div className="col-span-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Valor Padrão</label>
              <input
                type="number"
                disabled={newTemplate.tipo === 'Variavel'}
                className={`w-full p-3 mt-2 border rounded-xl outline-none transition-colors font-bold text-center ${newTemplate.tipo === 'Variavel' ? 'bg-slate-50 text-slate-300 border-slate-100' : 'bg-white text-slate-700 border-slate-200 focus:border-blue-500'}`}
                value={newTemplate.valor_padrao}
                onChange={e => setNewTemplate({ ...newTemplate, valor_padrao: parseFloat(e.target.value) })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setIsAddingTemplate(false)} className="flex-1 py-3.5 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-xl transition-colors">Cancelar</button>
            <button type="submit" className="flex-1 bg-slate-900 text-white py-3.5 rounded-xl font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all">Salvar Conta</button>
          </div>
        </form>
      )}

      {/* 3. Cards de Contas (Redesign) */}
      {activeTab === 'pagar' && (
        <div className="space-y-4">
          {aPagar.length === 0 ? (
            <div className="text-center py-10 opacity-50 flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              </div>
              <p className="text-sm font-bold text-slate-400">Tudo pago por aqui!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {aPagar.sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento)).map(c => {
                const hoje = new Date().toISOString().split('T')[0];
                const vencida = c.data_vencimento < hoje;
                const isHoje = c.data_vencimento === hoje;

                // Semantic Logic
                let accentBorder = "border-slate-300"; // Default Future
                let statusColor = "text-slate-500";

                if (c.necessita_valor) {
                  accentBorder = "border-amber-400";
                  statusColor = "text-amber-600";
                } else if (vencida) {
                  accentBorder = "border-red-600";
                  statusColor = "text-red-600";
                } else if (isHoje) {
                  accentBorder = "border-orange-500";
                  statusColor = "text-orange-600";
                } else {
                  // Future bills
                  accentBorder = "border-blue-500";
                  statusColor = "text-blue-600";
                }

                const isAnimating = animatingPaymentId === c.id;

                return (
                  <div
                    key={c.id}
                    className={`bg-white p-5 rounded-r-xl rounded-l-md shadow-sm flex items-center justify-between border-l-[6px] ${accentBorder} transition-all duration-500 ${isAnimating ? 'scale-105 bg-green-50 border-green-500 opacity-0 translate-x-full' : 'opacity-100 hover:shadow-md'}`}
                  >

                    {/* Left: Info */}
                    <div>
                      <h4 className={`font-bold text-base transition-colors ${isAnimating ? 'text-green-700' : 'text-slate-800'}`}>
                        {isAnimating ? 'PAGO COM SUCESSO!' : c.nome}
                      </h4>
                      <p className={`text-xs font-bold mt-1 uppercase tracking-wide flex items-center gap-1.5 ${isAnimating ? 'hidden' : statusColor}`}>
                        {!isAnimating && vencida && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>}
                        {!isAnimating && isHoje && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}

                        {!isAnimating && (
                          isHoje ? 'Vence Hoje!' :
                            vencida ? `Venceu dia ${new Date(c.data_vencimento).getUTCDate()}/${new Date(c.data_vencimento).getUTCMonth() + 1}` :
                              `Vence dia ${new Date(c.data_vencimento).getUTCDate()}/${new Date(c.data_vencimento).getUTCMonth() + 1}`
                        )}
                      </p>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-4">

                      {/* Case 1: Needs Value */}
                      {c.necessita_valor ? (
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
                        // Case 2: Ready to Pay
                        <>
                          {!isAnimating && (
                            <span className={`font-black text-base ${vencida ? 'text-red-600' : 'text-slate-700'}`}>
                              R$ {c.valor.toFixed(2)}
                            </span>
                          )}

                          <button
                            onClick={() => togglePago(c.id)}
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
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. Lista Histórico (Clean) */}
      {activeTab === 'historico' && (
        <div className="space-y-4">
          {historico.length === 0 ? (
            <div className="text-center py-10 opacity-50">
              <p className="text-sm font-bold text-slate-400">Nenhum histórico.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {historico.map(c => {
                const isDespesa = c.tipo === 'Despesa';
                return (
                  <div key={c.id} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDespesa ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>
                        {isDespesa ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-700 text-sm">{c.nome}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                          {new Date(c.data_pagamento || c.data_vencimento).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-700 text-sm opacity-90 block">R$ {c.valor.toFixed(2)}</span>

                      <button
                        onClick={() => handleDelete(c.id)}
                        className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Contas;
