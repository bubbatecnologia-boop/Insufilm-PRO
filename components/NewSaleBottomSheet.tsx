import React, { useState } from 'react';
import { Produto } from '../types';
import { db } from '../lib/database';

interface NewSaleBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  products: Produto[];
  onConfirm: (produtoId: string, quantidade: number, formaPagamento: 'Dinheiro' | 'Pix' | 'Cartão') => void;
}

const NewSaleBottomSheet: React.FC<NewSaleBottomSheetProps> = ({ isOpen, onClose, products, onConfirm }) => {
  const [step, setStep] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'Dinheiro' | 'Pix' | 'Cartão'>('Pix');

  // Scheduling State
  const [scheduleInstall, setScheduleInstall] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [clientName, setClientName] = useState('');
  const [clientVehicle, setClientVehicle] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedProduct) {
      // 1. Register Sale (Standard)
      // Note: The onConfirm prop currently handles the DB call in Home.tsx. 
      // We should ideally move logic here or modify onConfirm.
      // For now, let's keep using onConfirm but we need to handle the scheduling separately if we can't modify onConfirm easily without breaking Home.
      // Actually, the user asked to modify NewSaleModal logic. 
      // Let's assume we can trigger side effects here.

      onConfirm(selectedProduct.id, quantity, paymentMethod);

      // 2. Cross-Flow: Create Appointment if requested
      if (scheduleInstall) {
        db.addAgendamento({
          data: scheduleDate,
          horario: scheduleTime,
          cliente: clientName || 'Cliente Balcão',
          veiculo: clientVehicle || 'Veículo Padrão',
          servico: `Instalação ${selectedProduct.nome}`,
          valor: selectedProduct.preco_venda * quantity,
          produto_id: selectedProduct.id, // Reference product
          pago: true, // Auto-mark as paid
          status: 'Pendente'
        }, false); // FALSE = Do NOT deduct stock again (Sale already did it)
      }

      reset();
    }
  };

  const reset = () => {
    setStep(1);
    setSelectedProduct(null);
    setQuantity(1);
    setScheduleInstall(false);
    setClientName('');
    setClientVehicle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Nova Venda</h3>
            <p className="text-sm text-slate-500">Passo {step} de 2</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pb-4">
              {products.map(product => (
                <button
                  key={product.id}
                  onClick={() => { setSelectedProduct(product); setStep(2); }}
                  className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <span className="block text-xs font-bold text-slate-400 uppercase mb-1">{product.categoria}</span>
                  <span className="block font-bold text-slate-800 mb-1 group-hover:text-blue-700">{product.nome}</span>
                  <span className="block text-sm font-medium text-slate-500">R$ {product.preco_venda.toFixed(2)}</span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded mt-2 inline-block ${product.quantidade_atual > product.alerta_minimo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {product.quantidade_atual} {product.unidade}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Selected Product Summary */}
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.91 8.84 8.56 2.23a1.93 1.93 0 0 0-1.81 0L3.1 4.13a2.12 2.12 0 0 0-.05 3.69l12.22 6.93a2 2 0 0 0 1.94 0L21 12.51a2.12 2.12 0 0 0-.09-3.67Z" /><path d="m3.09 8.84 12.35-6.61" /><path d="M20.91 8.84 8.56 22.23" /></svg>
              </div>
              <div>
                <h4 className="font-bold text-slate-800">{selectedProduct?.nome}</h4>
                <p className="text-sm text-slate-500">R$ {selectedProduct?.preco_venda.toFixed(2)} / {selectedProduct?.unidade}</p>
              </div>
            </div>

            {/* Quantity & Total */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Quantidade</label>
                <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-1">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-lg bg-white shadow-sm font-bold text-slate-600 hover:bg-slate-100">-</button>
                  <span className="flex-1 text-center font-bold text-slate-800">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded-lg bg-white shadow-sm font-bold text-slate-600 hover:bg-slate-100">+</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Total</label>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-center">
                  <span className="font-bold text-slate-800 text-lg">R$ {((selectedProduct?.preco_venda || 0) * quantity).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Forma de Pagamento</label>
              <div className="flex gap-2">
                {['Pix', 'Dinheiro', 'Cartão'].map(method => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method as any)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${paymentMethod === method ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'}`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Cross-Flow: Schedule Installation */}
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-blue-900 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  Agendar Instalação?
                </label>
                <button
                  onClick={() => setScheduleInstall(!scheduleInstall)}
                  className={`w-11 h-6 rounded-full relative transition-colors ${scheduleInstall ? 'bg-blue-600' : 'bg-slate-200'}`}
                >
                  <span className={`block w-4 h-4 rounded-full bg-white absolute top-1 transition-all shadow-sm ${scheduleInstall ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              {scheduleInstall && (
                <div className="mt-4 grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                  <div className="col-span-2">
                    <input
                      className="w-full text-sm p-2 rounded-lg border border-blue-200 outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Nome do Cliente"
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      className="w-full text-sm p-2 rounded-lg border border-blue-200 outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Modelo do Veículo (ex: Fit)"
                      value={clientVehicle}
                      onChange={e => setClientVehicle(e.target.value)}
                    />
                  </div>
                  <div>
                    <input
                      type="date"
                      className="w-full text-sm p-2 rounded-lg border border-blue-200 outline-none focus:ring-2 focus:ring-blue-400"
                      value={scheduleDate}
                      onChange={e => setScheduleDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <input
                      type="time"
                      className="w-full text-sm p-2 rounded-lg border border-blue-200 outline-none focus:ring-2 focus:ring-blue-400"
                      value={scheduleTime}
                      onChange={e => setScheduleTime(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(1)} className="flex-1 py-4 text-slate-500 font-bold bg-slate-50 rounded-xl hover:bg-slate-100">Voltar</button>
              <button onClick={handleConfirm} className="flex-[2] py-4 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-600 active:scale-95 transition-all">
                Finalizar Venda
              </button>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default NewSaleBottomSheet;
