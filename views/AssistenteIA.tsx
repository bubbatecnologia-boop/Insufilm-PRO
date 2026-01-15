
import React, { useState } from 'react';
import { Produto, Venda, ContaFixa } from '../types';
import { askIA } from '../services/geminiService';

interface AssistenteIAProps {
  produtos: Produto[];
  vendasHoje: Venda[];
  contas: ContaFixa[];
}

const AssistenteIA: React.FC<AssistenteIAProps> = ({ produtos, vendasHoje, contas }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async (text?: string) => {
    const q = text || question;
    if (!q.trim()) return;

    setLoading(true);
    setAnswer(null);
    
    const context = {
      produtos: produtos.map(p => ({ nome: p.nome, qtd: p.quantidade_atual, alerta: p.alerta_minimo })),
      totalVendasHoje: vendasHoje.reduce((acc, v) => acc + v.valor_total, 0),
      contasPendentes: contas.filter(c => !c.pago).length
    };

    const res = await askIA(q, context);
    setAnswer(res);
    setLoading(false);
    setQuestion('');
  };

  const suggestions = [
    "O que devo comprar hoje?",
    "Como está o meu lucro de hoje?",
    "Me dê um conselho para vender mais",
  ];

  return (
    <div className="space-y-6 flex flex-col h-full animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
        </div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Assistente <span className="text-blue-600">Pro</span></h2>
        <p className="text-slate-500 text-sm">Tire dúvidas sobre seu estoque e finanças agora.</p>
      </div>

      <div className="flex-1 space-y-4">
        {answer && (
          <div className="bg-white p-5 rounded-3xl border border-blue-50 shadow-lg shadow-blue-50/50 animate-in zoom-in-95">
            <p className="text-slate-700 leading-relaxed font-medium">
              {answer}
            </p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-8">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}

        {!answer && !loading && (
          <div className="grid grid-cols-1 gap-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Sugestões</p>
            {suggestions.map((s, i) => (
              <button 
                key={i}
                onClick={() => handleAsk(s)}
                className="text-left bg-white p-4 rounded-2xl border border-slate-100 text-sm font-semibold text-slate-600 active:bg-slate-50 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-slate-50 pt-2">
        <div className="flex gap-2 bg-white p-2 rounded-2xl border shadow-sm items-center">
          <input 
            type="text" 
            placeholder="Pergunte qualquer coisa..." 
            className="flex-1 p-3 outline-none font-medium text-slate-700"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          />
          <button 
            disabled={loading || !question.trim()}
            onClick={() => handleAsk()}
            className="bg-blue-600 text-white p-3 rounded-xl disabled:opacity-50 active:scale-95 transition-transform"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssistenteIA;
