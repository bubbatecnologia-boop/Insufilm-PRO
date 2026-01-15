
import React from 'react';
import { ContaFixa } from '../types';
import { db } from '../lib/database';

interface ContasProps {
  contas: ContaFixa[];
  onUpdate: () => void;
}

const Contas: React.FC<ContasProps> = ({ contas, onUpdate }) => {
  const togglePago = (id: string) => {
    db.toggleContaPaga(id);
    onUpdate();
  };

  const aPagar = contas.filter(c => !c.pago);
  const pagas = contas.filter(c => c.pago);

  return (
    <div className="space-y-6 pb-4">
      <h2 className="text-2xl font-bold text-slate-800">Financeiro</h2>

      <div className="space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">A Pagar</h3>
        {aPagar.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Nenhuma conta pendente. Bom trabalho!</p>
        ) : (
          <div className="space-y-2">
            {aPagar.map(c => (
              <div key={c.id} className="bg-white p-4 rounded-2xl border border-amber-100 flex items-center justify-between shadow-sm">
                <div>
                  <h4 className="font-bold text-slate-800">{c.nome}</h4>
                  <p className="text-xs text-slate-400">Vence em {new Date(c.data_vencimento).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-black text-slate-700">R$ {c.valor.toFixed(2)}</span>
                  <button 
                    onClick={() => togglePago(c.id)}
                    className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4 pt-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Pagas recentemente</h3>
        <div className="space-y-2">
          {pagas.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Nenhuma conta paga recentemente.</p>
          ) : (
            pagas.map(c => (
              <div key={c.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between opacity-60">
                <div>
                  <h4 className="font-bold text-slate-500 line-through">{c.nome}</h4>
                  <p className="text-xs text-slate-400">Confirmado</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-slate-500">R$ {c.valor.toFixed(2)}</span>
                  <button 
                    onClick={() => togglePago(c.id)}
                    className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Contas;
