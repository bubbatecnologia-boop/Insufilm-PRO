import React, { useState, useMemo } from 'react';
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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-slate-800">
              {step === 1 ? 'Adicionar Produtos' : 'Revisar Pedido'}
            </h3>
            <p className="text-sm text-slate-500">
              {step === 1 ? 'Selecione os itens para venda' : `${cart.length} itens no carrinho`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {step === 1 ? (
          <>
            <div className="space-y-4 overflow-y-auto flex-1 pb-20">
              <div className="grid grid-cols-2 gap-3">
                {products.map(product => {
                  const inCart = cart.find(i => i.product.id === product.id);
                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className={`relative p-4 rounded-2xl border text-left transition-all group ${inCart ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300' : 'bg-slate-50 border-slate-100 hover:border-blue-300'}`}
                    >
                      {inCart && (
                        <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-sm animate-bounce-in">
                          {inCart.quantity}
                        </div>
                      )}

                      <span className="block text-xs font-bold text-slate-400 uppercase mb-1">
                        {product.type === 'material_metro' ? 'Películas' : 'Outros'}
                      </span>
                      <span className="block font-bold text-slate-800 mb-1 group-hover:text-blue-700 truncate">{product.name}</span>
                      <span className="block text-sm font-medium text-slate-500">R$ {product.sale_price.toFixed(2)}</span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded mt-2 inline-block ${product.stock_quantity > product.min_stock_alert ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {product.stock_quantity} {product.type === 'material_metro' ? 'MT' : 'UN'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 1 Footer */}
            {cart.length > 0 && (
              <div className="absolute bottom-6 left-6 right-6 animate-slide-up">
                <button
                  onClick={() => setStep(2)}
                  className="w-full py-4 bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-200 hover:bg-slate-900 flex items-center justify-between px-6"
                >
                  <span>{cart.length} itens selecionados</span>
                  <span className="flex items-center gap-2">
                    Ir para Pagamento
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                  </span>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-6 overflow-y-auto flex-1">

            {/* Cart Items List */}
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.product.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800 text-sm">{item.product.name}</h4>
                    <p className="text-xs text-slate-500">R$ {item.price.toFixed(2)} un</p>
                  </div>

                  <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-slate-200">
                    <button onClick={() => updateQuantity(item.product.id, -1)} className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded">-</button>
                    <span className="text-sm font-bold text-slate-800 w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, 1)} className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded">+</button>
                  </div>

                  <button onClick={() => removeFromCart(item.product.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                  </button>
                </div>
              ))}

              <button
                onClick={() => setStep(1)}
                className="w-full py-3 text-sm font-bold text-blue-600 bg-blue-50/50 rounded-xl border border-dashed border-blue-200 hover:bg-blue-50 transition-colors"
              >
                + Adicionar mais produtos
              </button>
            </div>

            <hr className="border-slate-100" />

            {/* Totals */}
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-500 text-sm">TOTAL FINAL</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm">R$</span>
                <input
                  type="number"
                  step="0.01"
                  className="w-24 text-right bg-transparent font-black text-slate-800 text-xl outline-none border-b border-dashed border-slate-300 focus:border-blue-500"
                  placeholder={calculatedTotal.toFixed(2)}
                  value={customTotal !== null ? customTotal : ''}
                  onChange={(e) => setCustomTotal(e.target.value)}
                />
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
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-4 text-slate-500 font-bold bg-slate-50 rounded-xl hover:bg-slate-100"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirm}
                className="flex-[2] py-4 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-600 active:scale-95 transition-all"
              >
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
    </div>
  );
};

export default NewSaleBottomSheet;
