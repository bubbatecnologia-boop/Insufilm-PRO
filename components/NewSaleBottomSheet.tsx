import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Product } from '../types';
import { db } from '../lib/database';

interface CartItem {
  product: Product;
  quantity: number;
  price: number; // Unit price at moment of add
}

interface NewSaleBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onConfirm: (
    items: { product: Product; quantity: number; price: number }[],
    totalValue: number,
    formaPagamento: 'Dinheiro' | 'Pix' | 'Cartão'
  ) => void;
}

const NewSaleBottomSheet: React.FC<NewSaleBottomSheetProps> = ({ isOpen, onClose, products, onConfirm }) => {
  // Steps: 1 = Catalog, 2 = Checkout
  const [step, setStep] = useState(1);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);

  // Checkout State
  const [paymentMethod, setPaymentMethod] = useState<'Dinheiro' | 'Pix' | 'Cartão'>('Pix');
  const [customTotal, setCustomTotal] = useState<string | null>(null);

  // Scheduling State
  const [scheduleInstall, setScheduleInstall] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [clientName, setClientName] = useState('');
  const [clientVehicle, setClientVehicle] = useState('');

  // 1. Hooks MUST be called unconditionally
  const calculatedTotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [cart]);

  // Helper functions
  const getFinalTotal = () => {
    if (customTotal !== null && customTotal !== '') {
      return parseFloat(customTotal.replace(',', '.'));
    }
    return calculatedTotal;
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1, price: product.sale_price }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.product.id === productId) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const handleConfirm = () => {
    if (cart.length > 0) {
      const finalTotal = getFinalTotal();

      // 1. Register Sale
      onConfirm(cart, finalTotal, paymentMethod);

      // 2. Cross-Flow: Create Appointment
      if (scheduleInstall) {
        const mainTitle = cart.length === 1
          ? `Instalação ${cart[0].product.name}`
          : `Instalação Combo (${cart.length} itens)`;

        db.addAppointment({
          organization_id: cart[0].product.organization_id, // Assume same org
          title: mainTitle,
          start_time: `${scheduleDate}T${scheduleTime}:00`,
          end_time: `${scheduleDate}T${parseInt(scheduleTime.split(':')[0]) + 1}:00:00`,
          status: 'pending',
          price_total: finalTotal,
        } as any);
      }

      reset();
    }
  };

  const reset = () => {
    setStep(1);
    setCart([]);
    setCustomTotal(null);
    setPaymentMethod('Pix');
    setScheduleInstall(false);
    setClientName('');
    setClientVehicle('');
    onClose();
  };

  // 2. Conditional return only AFTER all hooks
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] flex flex-col">

        {/* Header - Reduced padding */}
        <div className="flex items-center justify-between p-5 pb-2 flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-800 leading-tight">
              {step === 1 ? 'Adicionar Produtos' : 'Revisar Pedido'}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {step === 1 ? 'Selecione os itens para venda' : `${cart.length} itens no carrinho`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 border border-slate-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {step === 1 ? (
          <>
            <div className="space-y-4 overflow-y-auto flex-1 p-5 pt-2 pb-24">
              <div className="grid grid-cols-2 gap-3">
                {products.map(product => {
                  const inCart = cart.find(i => i.product.id === product.id);
                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className={`relative p-3 rounded-2xl border text-left transition-all group active:scale-[0.98] ${inCart ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300 shadow-sm' : 'bg-white border-slate-100 hover:border-blue-300 shadow-sm'}`}
                    >
                      {inCart && (
                        <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-bounce-in ring-2 ring-white">
                          {inCart.quantity}
                        </div>
                      )}

                      <span className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5 tracking-wide">
                        {product.type === 'material_metro' ? 'Películas' : 'Outros'}
                      </span>
                      <h4 className="font-bold text-slate-800 mb-0.5 text-sm leading-tight group-hover:text-blue-700 truncate pr-2">
                        {product.name}
                      </h4>
                      <p className="text-xs font-semibold text-slate-500">
                        R$ {product.sale_price.toFixed(2)}
                      </p>

                      <div className={`mt-2 inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${product.stock_quantity > product.min_stock_alert ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                        {product.stock_quantity} {product.type === 'material_metro' ? 'MT' : 'UN'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 1 Footer - Refined */}
            {cart.length > 0 && (
              <div className="absolute bottom-5 left-5 right-5 animate-slide-up">
                <button
                  onClick={() => setStep(2)}
                  className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-2xl shadow-xl shadow-slate-200 hover:bg-black active:scale-[0.98] transition-all flex items-center justify-between px-5"
                >
                  <div className="flex flex-col items-start leading-none">
                    <span className="text-xs font-medium text-slate-400">Total (aprox.)</span>
                    <span className="text-lg">R$ {calculatedTotal.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl">
                    <span className="text-sm font-semibold">Revisar</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                  </div>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-6 overflow-y-auto flex-1 p-6 pt-2">

            {/* Cart Items List */}
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.product.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 text-sm truncate">{item.product.name}</h4>
                    <p className="text-xs text-slate-500 font-medium">R$ {item.price.toFixed(2)} un</p>
                  </div>

                  <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
                    <button onClick={() => updateQuantity(item.product.id, -1)} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors font-bold">-</button>
                    <span className="text-sm font-bold text-slate-800 w-6 text-center tabular-nums">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, 1)} className="w-7 h-7 flex items-center justify-center text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-bold">+</button>
                  </div>

                  <button onClick={() => removeFromCart(item.product.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                  </button>
                </div>
              ))}

              <button
                onClick={() => setStep(1)}
                className="w-full py-3 text-sm font-bold text-blue-600 bg-blue-50/50 rounded-xl border border-dashed border-blue-200 hover:bg-blue-50 transition-colors"
                title="Adicionar mais itens"
              >
                + Adicionar mais
              </button>
            </div>

            <hr className="border-slate-100" />

            {/* Totals */}
            <div className="flex items-center justify-between bg-white p-2">
              <span className="font-bold text-slate-600 text-sm">TOTAL FINAL</span>
              <div className="flex items-center gap-1">
                <span className="text-slate-400 text-sm font-bold">R$</span>
                <input
                  type="number"
                  step="0.01"
                  className="w-28 text-right bg-transparent font-black text-slate-800 text-2xl outline-none border-b-2 border-slate-100 focus:border-blue-500 transition-colors p-0"
                  placeholder={calculatedTotal.toFixed(2)}
                  value={customTotal !== null ? customTotal : ''}
                  onChange={(e) => setCustomTotal(e.target.value)}
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Forma de Pagamento</label>
              <div className="flex p-1 bg-slate-100 rounded-xl">
                {['Pix', 'Dinheiro', 'Cartão'].map(method => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method as any)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${paymentMethod === method ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Cross-Flow: Schedule Installation */}
            <div className={`p-4 rounded-2xl border transition-all ${scheduleInstall ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center justify-between" onClick={() => setScheduleInstall(!scheduleInstall)}>
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 cursor-pointer select-none">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${scheduleInstall ? 'bg-blue-200 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  </div>
                  Agendar Instalação
                </label>
                <div className={`w-10 h-6 rounded-full relative transition-colors ${scheduleInstall ? 'bg-blue-600' : 'bg-slate-300'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all shadow-sm ${scheduleInstall ? 'left-5' : 'left-1'}`} />
                </div>
              </div>

              {scheduleInstall && (
                <div className="mt-4 grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                  <div className="col-span-2">
                    <input
                      className="w-full text-sm p-3 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                      placeholder="Nome do Cliente"
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      className="w-full text-sm p-3 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                      placeholder="Veículo (ex: Fiat Toro)"
                      value={clientVehicle}
                      onChange={e => setClientVehicle(e.target.value)}
                    />
                  </div>
                  <div>
                    <input
                      type="date"
                      className="w-full text-sm p-3 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                      value={scheduleDate}
                      onChange={e => setScheduleDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <input
                      type="time"
                      className="w-full text-sm p-3 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                      value={scheduleTime}
                      onChange={e => setScheduleTime(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3.5 text-slate-500 font-bold bg-slate-100 rounded-xl hover:bg-slate-200 text-sm transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirm}
                className="flex-[2] py-3.5 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
              >
                <span>Confirmar Venda</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
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
        @keyframes bounce-in {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .animate-bounce-in {
          animation: bounce-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>,
    document.body
  );
};

export default NewSaleBottomSheet;
