
import React, { useState } from 'react';
import { Produto, Venda, Conta } from '../types';
import { askIA } from '../services/geminiService';

interface AssistenteIAProps {
  produtos: Produto[];
  vendasHoje: Venda[];
  contas: Conta[];
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
    <div className="relative h-full overflow-hidden bg-slate-50/50">
      {/* Background Content (Visible Mock) */}
      <div className="space-y-6 flex flex-col h-full opacity-100 pointer-events-none select-none" aria-hidden="true">
        <div className="text-center space-y-2 pt-4">
          <div className="w-16 h-16 bg-white text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Assistente <span className="text-blue-600">Pro</span></h2>
          <p className="text-slate-500 text-sm font-medium">Sua inteligência de negócios.</p>
        </div>

        {/* Mock Chat Content for "Desire Generation" */}
        <div className="flex-1 space-y-6 overflow-y-auto px-4 pb-24">
          {/* User Message 1 */}
          <div className="flex justify-end">
            <div className="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-[4px] shadow-sm max-w-[85%]">
              <p className="font-medium text-sm">Qual meu lucro estimado para essa semana?</p>
            </div>
          </div>

          {/* AI Response 1 */}
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200/60 p-5 rounded-2xl rounded-tl-[4px] max-w-[90%] shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-4">
              <p className="text-slate-600 text-sm font-medium leading-relaxed">
                Com base nos <span className="text-blue-600 font-bold">12 agendamentos</span>, sua previsão é:
              </p>
              <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-100/50 flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                </div>
                <div>
                  <p className="text-[10px] text-emerald-600 font-black uppercase tracking-wider mb-0.5">Lucro Líquido</p>
                  <p className="text-2xl font-black text-slate-800 tracking-tight">R$ 3.200,00</p>
                </div>
              </div>
            </div>
          </div>

          {/* User Message 2 */}
          <div className="flex justify-end">
            <div className="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-[4px] shadow-sm max-w-[85%]">
              <p className="font-medium text-sm">O que devo comprar hoje?</p>
            </div>
          </div>

          {/* AI Response 2 */}
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200/60 p-5 rounded-2xl rounded-tl-[4px] max-w-[90%] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <p className="text-slate-600 text-sm font-medium leading-relaxed mb-3">
                Atenção! O <strong className="text-slate-900">Insulfilm G5</strong> está acabando (2un).
              </p>
              <button className="text-xs bg-white text-red-600 font-bold px-4 py-3 rounded-xl border border-red-100 w-full text-left flex items-center gap-2 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Repor Agora - R$ 450,00
              </button>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent pt-8 pb-4 px-4 opacity-50">
          {/* Input disabled visual */}
          <div className="flex gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm items-center">
            <div className="flex-1 p-3 bg-slate-50 rounded-xl text-slate-400 text-sm font-medium">Aguardando disponibilidade...</div>
          </div>
        </div>
      </div>

      {/* Overlay Card - Premium Glassmorphism */}
      <div className="absolute inset-x-4 bottom-6 top-auto z-10 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-8 duration-700 sm:inset-0 sm:top-0">
        <div className="relative overflow-hidden bg-white/95 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(15,23,42,0.15)] border border-white/50 w-full max-w-sm ring-1 ring-slate-900/5">
          {/* Subtle Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/30 via-transparent to-purple-50/30 opacity-50 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 text-white shrink-0 ring-4 ring-blue-50">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
              </div>
              <div className="flex-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-extrabold uppercase tracking-wider text-blue-600 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  Em Breve
                </span>
                <h2 className="text-xl font-black text-slate-800 leading-tight">Mente da Loja</h2>
              </div>
            </div>

            <p className="text-slate-600 mb-8 text-sm leading-relaxed font-medium">
              Esta funcionalidade estará disponível em breve. Precisa de ajuda ou tem alguma dúvida agora? Nossa equipe está pronta para te atender.
            </p>

            <button
              onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
              className="w-full group relative overflow-hidden bg-slate-900 text-white font-bold py-4 rounded-xl shadow-xl shadow-slate-900/10 active:scale-[0.98] transition-all hover:bg-slate-800"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <div className="flex items-center justify-center gap-2 relative z-10">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-emerald-400"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                <span>Chamar no WhatsApp</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistenteIA;
