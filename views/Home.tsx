
import React from 'react';
import { Produto, Venda, ContaFixa, View } from '../types';

interface HomeProps {
  produtos: Produto[];
  vendasHoje: Venda[];
  contas: ContaFixa[];
  onNavigate: (view: View) => void;
}

const Home: React.FC<HomeProps> = ({ produtos, vendasHoje, contas, onNavigate }) => {
  const faturamentoHoje = vendasHoje.reduce((acc, v) => acc + v.valor_total, 0);
  const produtosAlerta = produtos.filter(p => p.quantidade_atual <= p.alerta_minimo);
  const contasPendentes = contas.filter(c => !c.pago);

  return (
    <div className="space-y-6">
      {/* Resumo Financeiro */}
      <section className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
        <p className="text-slate-500 text-sm font-medium">Vendas de Hoje</p>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-3xl font-bold text-slate-800">R$ {faturamentoHoje.toFixed(2)}</span>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap">
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
          onClick={() => onNavigate('vendas')}
          className="bg-blue-600 text-white p-5 rounded-3xl flex flex-col items-center justify-center gap-2 shadow-lg shadow-blue-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          <span className="font-bold">Nova Venda</span>
        </button>
        <button 
          onClick={() => onNavigate('contas')}
          className="bg-white text-slate-700 p-5 rounded-3xl flex flex-col items-center justify-center gap-2 border border-slate-200 shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
          <span className="font-bold">Pagar Contas</span>
        </button>
      </div>

      {/* Alertas de Estoque */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">Estoque Baixo</h2>
          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-md font-bold uppercase">{produtosAlerta.length}</span>
        </div>
        
        {produtosAlerta.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-dashed border-slate-200 text-center">
            <p className="text-slate-400 text-sm">Tudo em dia com o estoque! ✅</p>
          </div>
        ) : (
          <div className="space-y-2">
            {produtosAlerta.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-red-50 shadow-sm">
                <div>
                  <h3 className="font-semibold text-slate-800">{p.nome}</h3>
                  <p className="text-xs text-red-500 font-bold uppercase">Restam {p.quantidade_atual} {p.unidade}</p>
                </div>
                <button 
                  onClick={() => onNavigate('estoque')}
                  className="bg-slate-100 p-2 rounded-xl text-slate-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
