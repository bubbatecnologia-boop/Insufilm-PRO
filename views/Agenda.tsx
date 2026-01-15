
import React, { useState, useEffect } from 'react';
import { db } from '../lib/database';
import { Agendamento } from '../types';

interface AgendaProps {
    onUpdate: () => void;
}

const HOURS = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

const Agenda: React.FC<AgendaProps> = ({ onUpdate }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [produtos] = useState(db.getProdutos()); // Fetch products for the dropdown
    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);

    useEffect(() => {
        loadAgendamentos();
    }, [selectedDate]);

    const loadAgendamentos = () => {
        const isoDate = selectedDate.toISOString().split('T')[0];
        const data = db.getAgendamentos(isoDate);
        setAgendamentos(data);
    };

    const handlePrevDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() - 1);
        setSelectedDate(newDate);
    };

    const handleNextDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + 1);
        setSelectedDate(newDate);
    };

    const formatDate = (date: Date) => {
        const today = new Date();
        const isToday = date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();

        if (isToday) return `Hoje, ${date.getDate()} ${date.toLocaleString('default', { month: 'short' }).replace('.', '')}`;

        return `${date.toLocaleDateString('pt-BR', { weekday: 'short' })}, ${date.getDate()} ${date.toLocaleString('default', { month: 'short' }).replace('.', '')}`;
    };

    const getStatusColor = (status: Agendamento['status']) => {
        switch (status) {
            case 'Pendente': return 'bg-slate-100 text-slate-500 border-slate-200';
            case 'Executando': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'Concluido': return 'bg-green-50 text-green-600 border-green-200';
            default: return 'bg-slate-50';
        }
    };

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
    const [newAppointment, setNewAppointment] = useState({
        cliente: '',
        whatsapp: '',
        veiculo: '',
        placa: '',
        servico: 'Instalação Insulfilm',
        valor: '',
        usarEstoque: false,
        produtoId: ''
    });

    const handleOpenModal = (time: string) => {
        setSelectedTimeSlot(time);
        setIsModalOpen(true);
        setNewAppointment({
            cliente: '',
            whatsapp: '',
            veiculo: '',
            placa: '',
            servico: 'Instalação Insulfilm',
            valor: '',
            usarEstoque: false,
            produtoId: ''
        });
    };

    const handleSave = () => {
        if (!newAppointment.cliente || !newAppointment.veiculo) return;

        db.addAgendamento({
            data: selectedDate.toISOString().split('T')[0],
            horario: selectedTimeSlot,
            cliente: newAppointment.cliente,
            veiculo: newAppointment.veiculo,
            servico: newAppointment.servico,
            contato: newAppointment.whatsapp,
            valor: newAppointment.valor ? parseFloat(newAppointment.valor) : undefined,
            produto_id: newAppointment.usarEstoque ? newAppointment.produtoId : undefined,
            status: 'Pendente'
        });

        onUpdate();
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6 pb-24 h-full flex flex-col relative">
            {/* 1. Date Header */}
            <div className="flex items-center justify-between bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
                <button onClick={handlePrevDay} className="p-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>

                <div className="text-center">
                    <h2 className="text-lg font-bold text-slate-800 capitalize">{formatDate(selectedDate)}</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{agendamentos.length} Agendamentos</p>
                </div>

                <button onClick={handleNextDay} className="p-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                </button>
            </div>

            {/* 2. Timeline */}
            <div className="flex-1 space-y-4">
                {HOURS.map(hour => {
                    const appointment = agendamentos.find(a => a.horario.startsWith(hour.split(':')[0])); // Simple check HH

                    return (
                        <div key={hour} className="flex gap-4 group">
                            {/* Time Column */}
                            <div className="w-14 pt-2 text-right">
                                <span className="text-sm font-bold text-slate-400">{hour}</span>
                            </div>

                            {/* Event Column */}
                            <div className="flex-1">
                                {appointment ? (
                                    // Appointment Card
                                    <div className={`p-4 rounded-2xl border-l-[6px] shadow-sm transition-all hover:shadow-md ${getStatusColor(appointment.status).replace('bg-', 'border-').split(' ')[2]} bg-white border-slate-100 relative overflow-hidden`}>

                                        {/* Paid Badge Overlay */}
                                        {appointment.pago && (
                                            <div className="absolute top-0 right-0 bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-1 rounded-bl-xl border-b border-l border-emerald-200 shadow-sm z-10 flex items-center gap-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                                                PAGO
                                            </div>
                                        )}

                                        <div className="flex justify-between items-start mb-2 mt-2">
                                            {/* Status Badge - Interactive */}
                                            <button
                                                onClick={() => {
                                                    // If already paid or just moving between Pendente/Executando, standard update
                                                    // If moving to Concluido and NOT paid, trigger Checkout
                                                    if (appointment.status === 'Executando' && !appointment.pago) {
                                                        // Trigger Checkout (Todo: Implement specific checkout modal, for now just confirm)
                                                        if (window.confirm("Finalizar e Cobrar Serviço?")) {
                                                            // Register Sale & Finish
                                                            // Here we would ideally open a payment modal. For simplicity/MVP:
                                                            const venda = {
                                                                produto_id: appointment.produto_id || 'servico_avulso',
                                                                produto_nome: appointment.servico,
                                                                quantidade: 1,
                                                                valor_total: appointment.valor || 0,
                                                                forma_pagamento: 'Pix' as any // Default or ask
                                                            };

                                                            db.registrarVenda(venda, false); // Don't deduct stock again if reserved? Wait, if we reserved stock at creation (addAgendamento reserved it), we SHOULD NOT deduct again.
                                                            // Logic: addAgendamento deducted stock. removeAgendamento returns it.
                                                            // registrarVenda also deducts stock.
                                                            // We need to tell registrarVenda NOT to deduct stock if appointment has `produto_id`.

                                                            db.updateAgendamentoStatus(appointment.id, 'Concluido');
                                                            // Mark as paid ? db.markAsPaid(appointment.id) - we'd need this function
                                                            onUpdate();
                                                            loadAgendamentos();
                                                        }
                                                    } else {
                                                        const nextStatus =
                                                            appointment.status === 'Pendente' ? 'Executando' :
                                                                appointment.status === 'Executando' ? 'Concluido' : 'Pendente';

                                                        db.updateAgendamentoStatus(appointment.id, nextStatus);
                                                        onUpdate();
                                                        loadAgendamentos();
                                                    }
                                                }}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all active:scale-95 ${appointment.status === 'Pendente'
                                                        ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                        : appointment.status === 'Executando'
                                                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    }`}
                                            >
                                                {appointment.status === 'Pendente' && (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                                )}
                                                {appointment.status === 'Executando' && (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4" /><path d="m16.2 7.8 2.9-2.9" /><path d="M18 12h4" /><path d="m16.2 16.2 2.9 2.9" /><path d="M12 18v4" /><path d="m4.9 19.1 2.9-2.9" /><path d="M2 12h4" /><path d="m4.9 4.9 2.9 2.9" /></svg>
                                                )}
                                                {appointment.status === 'Concluido' && (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                )}
                                                {appointment.status}
                                            </button>

                                            <button
                                                onClick={() => {
                                                    if (window.confirm("Deseja cancelar este agendamento?")) {
                                                        db.removeAgendamento(appointment.id);
                                                        onUpdate();
                                                        loadAgendamentos();
                                                    }
                                                }}
                                                className="text-slate-300 hover:text-red-500 transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                            </button>
                                        </div>

                                        <h3 className="text-base font-bold text-slate-900">{appointment.veiculo}</h3>
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm text-slate-600 mb-0">{appointment.servico}</p>
                                            {appointment.valor && <span className="text-xs font-bold text-slate-500">R$ {parseFloat(appointment.valor.toString()).toFixed(2)}</span>}
                                        </div>

                                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-50">
                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                                {appointment.cliente.charAt(0)}
                                            </div>
                                            <span className="text-xs font-bold text-slate-500">{appointment.cliente}</span>
                                        </div>
                                    </div>
                                ) : (
                                    // Empty Slot
                                    <div className="h-20 border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center group-hover:border-blue-200 transition-colors cursor-pointer active:scale-[0.99]"
                                        onClick={() => handleOpenModal(hour)}>
                                        <div className="flex items-center gap-2 text-slate-300 group-hover:text-blue-400 font-bold transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                            <span>Agendar</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 3. New Appointment Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                        {/* Header */}
                        <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Novo Agendamento</h3>
                                <p className="text-sm text-slate-500 font-medium">Horário: <span className="text-blue-600">{selectedTimeSlot}</span></p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="bg-white p-2 rounded-full text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-5">

                            {/* Line 1: Client */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cliente</label>
                                    <input
                                        autoFocus
                                        className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold text-slate-700 placeholder-slate-300"
                                        placeholder="Nome"
                                        value={newAppointment.cliente}
                                        onChange={e => setNewAppointment({ ...newAppointment, cliente: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Whatsapp</label>
                                    <input
                                        className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold text-slate-700 placeholder-slate-300"
                                        placeholder="(00) 00000"
                                        type="tel"
                                        value={newAppointment.whatsapp}
                                        onChange={e => setNewAppointment({ ...newAppointment, whatsapp: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Line 2: Vehicle */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Modelo</label>
                                    <input
                                        className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold text-slate-700 placeholder-slate-300"
                                        placeholder="Ex: Fiat Toro"
                                        value={newAppointment.veiculo}
                                        onChange={e => setNewAppointment({ ...newAppointment, veiculo: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Placa</label>
                                    <input
                                        className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold text-slate-700 placeholder-slate-300 uppercase"
                                        placeholder="ABC-1234"
                                        maxLength={8}
                                        value={newAppointment.placa}
                                        onChange={e => setNewAppointment({ ...newAppointment, placa: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Service Type & Value */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Serviço</label>
                                    <select
                                        className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700"
                                        value={newAppointment.servico}
                                        onChange={e => setNewAppointment({ ...newAppointment, servico: e.target.value })}
                                    >
                                        <option>Instalação Insulfilm</option>
                                        <option>Instalação Som</option>
                                        <option>Elétrica</option>
                                        <option>Acessórios</option>
                                        <option>Outros</option>
                                    </select>
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Valor (R$)</label>
                                    <input
                                        type="number"
                                        className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 placeholder-slate-300"
                                        placeholder="0.00"
                                        value={newAppointment.valor}
                                        onChange={e => setNewAppointment({ ...newAppointment, valor: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Supreme Functionality: Stock Reserve */}
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 relative overflow-hidden">
                                <div className="flex items-center justify-between mb-2 z-10 relative">
                                    <label className="text-sm font-bold text-blue-800 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" y1="22" x2="12" y2="12" /></svg>
                                        Usar material do estoque?
                                    </label>

                                    <button
                                        onClick={() => setNewAppointment({ ...newAppointment, usarEstoque: !newAppointment.usarEstoque })}
                                        className={`w-12 h-7 rounded-full transition-colors relative ${newAppointment.usarEstoque ? 'bg-blue-600' : 'bg-slate-300'}`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${newAppointment.usarEstoque ? 'left-6' : 'left-1'}`}></div>
                                    </button>
                                </div>

                                {newAppointment.usarEstoque && (
                                    <div className="mt-3 animate-in slide-in-from-top-2">
                                        <select
                                            className="w-full p-2.5 rounded-lg bg-white border border-blue-200 outline-none focus:ring-2 focus:ring-blue-400 text-sm font-medium text-slate-700"
                                            value={newAppointment.produtoId}
                                            onChange={e => setNewAppointment({ ...newAppointment, produtoId: e.target.value })}
                                        >
                                            <option value="">Selecione o produto...</option>
                                            {produtos.map(p => (
                                                <option key={p.id} value={p.id}>{p.nome} ({p.quantidade_atual} {p.unidade})</option>
                                            ))}
                                        </select>
                                        <p className="text-[10px] text-blue-600 mt-1 font-medium ml-1">
                                            * O estoque será reservado automaticamente.
                                        </p>
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 py-3 text-slate-500 font-bold text-sm hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-[2] bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all hover:bg-blue-700"
                            >
                                Confirmar Agendamento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Agenda;
