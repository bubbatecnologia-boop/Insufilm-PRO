
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../lib/database';
import { supabase } from '../lib/supabase';
import { Appointment, Product } from '../types';
import PageTransition from '../components/PageTransition';

interface AgendaProps {
    onUpdate: () => void;
}

const HOURS = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

const Agenda: React.FC<AgendaProps> = ({ onUpdate }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [products, setProducts] = useState<Product[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, [selectedDate]);

    const loadData = async () => {
        setLoading(true);
        // Load Appointments
        const isoDate = selectedDate.toISOString().split('T')[0];
        const apps = await db.getAppointments(isoDate);
        setAppointments(apps);

        // Load Products for dropdown (only once ideally, but ok here)
        if (products.length === 0) {
            const prods = await db.getProducts();
            setProducts(prods);
        }
        setLoading(false);
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

    const getStatusColor = (status: Appointment['status']) => {
        switch (status) {
            case 'pending': return 'bg-slate-100 text-slate-500 border-slate-200';
            case 'confirmed': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'completed': return 'bg-green-50 text-green-600 border-green-200';
            case 'canceled': return 'bg-red-50 text-red-600 border-red-200';
            default: return 'bg-slate-50';
        }
    };

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);
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

    const handleSave = async () => {
        if (!newAppointment.cliente) return;

        try {
            // 1. Get Org ID
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
            if (!profile) return;

            const orgId = profile.organization_id;

            // 2. Create Client (Simplified: Always new for MVP, or we would search first)
            // Ideally we'd search for existing client by phone first.
            const newClient = await db.createClient({
                organization_id: orgId,
                name: newAppointment.cliente,
                phone: newAppointment.whatsapp,
                car_model: newAppointment.veiculo,
                notes: `Placa: ${newAppointment.placa}`
            });

            if (!newClient) throw new Error("Falha ao criar cliente");

            // 3. Create Appointment
            const dateStr = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
            const startTime = `${dateStr}T${selectedTimeSlot}:00`;
            // Default 1 hour duration
            const [hh, mm] = selectedTimeSlot.split(':').map(Number);
            const endDate = new Date(selectedDate);
            endDate.setHours(hh + 1, mm, 0);
            // Need ISO string for end time respecting the date
            // Simpler: just string manipulation if simple hour math
            const endTimeStr = `${dateStr}T${(hh + 1).toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}:00`;

            // Fix timezone offset issues? We are sending simple ISO. Supabase Timestamptz stores as UTC.
            // If we send `2023-01-01T08:00:00`, postgres treats it as local if no offset, or we should assume?
            // Safer to send with App's timezone or simple string if DB is set.
            // Let's send standard ISO for now.

            await db.addAppointment({
                organization_id: orgId,
                client_id: newClient.id,
                title: `${newAppointment.servico} - ${newAppointment.veiculo.toUpperCase()}`,
                start_time: new Date(startTime).toISOString(),
                end_time: new Date(endTimeStr).toISOString(),
                status: 'pending',
                price_total: newAppointment.valor ? parseFloat(newAppointment.valor) : 0
            });

            // 3.1 Create Transaction (Income) - SYNC WITH SALES
            if (newAppointment.valor) {
                await db.addTransaction({
                    organization_id: orgId,
                    description: `Agendamento: ${newAppointment.servico} - ${newAppointment.cliente}`,
                    amount: parseFloat(newAppointment.valor),
                    type: 'income',
                    date: dateStr, // Same date as appointment
                    status: 'pending' // Pending until confirmed/paid
                });
            }

            // 4. Stock Decrement (Optional MVP feature)
            if (newAppointment.usarEstoque && newAppointment.produtoId) {
                const prod = products.find(p => p.id === newAppointment.produtoId);
                if (prod) {
                    await db.updateProduct(prod.id, {
                        stock_quantity: prod.stock_quantity - 1 // Simple decrement 1 unit
                    });
                }
            }

            onUpdate();
            setIsModalOpen(false);
            loadData();

        } catch (err) {
            console.error(err);
            alert("Erro ao salvar agendamento.");
        }
    };

    const handleStatusChange = async (appointment: Appointment) => {
        const nextStatus =
            appointment.status === 'pending' ? 'confirmed' :
                appointment.status === 'confirmed' ? 'completed' : 'pending';

        await db.updateAppointmentStatus(appointment.id, nextStatus as any);
        loadData();
    };

    const handleDelete = (id: string) => {
        setAppointmentToDelete(id);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (appointmentToDelete) {
            await db.deleteAppointment(appointmentToDelete);
            setDeleteModalOpen(false);
            setAppointmentToDelete(null);
            loadData();
        }
    };

    return (
        <PageTransition>
            <div className="space-y-6 pb-24 relative min-h-screen">
                {/* 1. Date Header */}
                <div className="flex items-center justify-between bg-blue-50 p-6 rounded-3xl border border-blue-100 mb-2">
                    <button onClick={handlePrevDay} className="p-2.5 rounded-xl bg-white text-blue-400 hover:text-blue-600 shadow-sm transition-all active:scale-95 border border-blue-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </button>

                    <div className="text-center">
                        <h2 className="text-xl font-black text-slate-800 capitalize tracking-tight">{formatDate(selectedDate)}</h2>
                        <div className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full bg-blue-100/50 border border-blue-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                            <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                                {loading ? '...' : `${appointments.length} Agendamentos`}
                            </p>
                        </div>
                    </div>

                    <button onClick={handleNextDay} className="p-2.5 rounded-xl bg-white text-blue-400 hover:text-blue-600 shadow-sm transition-all active:scale-95 border border-blue-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                    </button>
                </div>

                {/* 2. Timeline */}
                <div className="flex-1 space-y-4">
                    {HOURS.map(hour => {
                        // Match appointments by hour (UTC conversion might be tricky, checking local substring for MVP)
                        // The Supabase Date is ISO. We need to match local hour.
                        // Simple check: Convert appt start_time to local HH:00 string

                        const appointment = appointments.find(a => {
                            // Robust: Parse string directly to avoid timezone shifts (e.g. UTC vs Local)
                            // We want to show exactly what was saved "T09:00:00" -> "09:00"
                            if (!a.start_time) return false;
                            const timePart = a.start_time.split('T')[1];
                            if (!timePart) return false;
                            const h = timePart.substring(0, 2);
                            return `${h}:00` === hour;
                        });

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

                                            <div className="flex justify-between items-start mb-2 mt-2">
                                                {/* Status Badge - Interactive */}
                                                <button
                                                    onClick={() => handleStatusChange(appointment)}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all active:scale-95 ${appointment.status === 'pending' ? 'bg-slate-100 text-slate-500' :
                                                        appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-green-100 text-green-700'
                                                        }`}
                                                >
                                                    {appointment.status === 'pending' && 'Pendente'}
                                                    {appointment.status === 'confirmed' && 'Confirmado'}
                                                    {appointment.status === 'completed' && 'Concluido'}
                                                </button>

                                                <button
                                                    onClick={() => handleDelete(appointment.id)}
                                                    className="text-slate-300 hover:text-red-500 transition-colors"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                </button>
                                            </div>

                                            <h3 className="text-base font-bold text-slate-900">{appointment.title}</h3>
                                            <div className="flex justify-between items-center">
                                                {/* We can show client name if joined */}
                                                <p className="text-sm text-slate-600 mb-0">{appointment.client?.name || 'Cliente'}</p>
                                                {appointment.price_total > 0 && <span className="text-xs font-bold text-slate-500">R$ {appointment.price_total.toFixed(2)}</span>}
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
                {isModalOpen && createPortal(
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-4 animate-in fade-in">
                        <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 space-y-0">

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
                            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">

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

                                {/* Stock Reserve */}
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
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name} ({p.stock_quantity} {p.type === 'material_metro' ? 'mt' : 'un'})</option>
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
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
                {/* 4. Delete Confirmation Modal */}
                {deleteModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">Cancelar Agendamento?</h3>
                                    <p className="text-slate-500 mt-2">Tem certeza que deseja remover este agendamento? Esta ação não pode ser desfeita.</p>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setDeleteModalOpen(false)}
                                        className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                                    >
                                        Voltar
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 transition-all active:scale-95"
                                    >
                                        Sim, Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageTransition>
    );
};

export default Agenda;
