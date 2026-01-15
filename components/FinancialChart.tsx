import React from 'react';

interface FinancialChartProps {
    entradas: number;
    saidas: number;
}

const FinancialChart: React.FC<FinancialChartProps> = ({ entradas, saidas }) => {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    // Calculate percentages relative to the larger value for visual proportion
    const total = Math.max(entradas, saidas) * 1.1; // 10% headroom
    const entradasPct = Math.round((entradas / total) * 100);
    const saidasPct = Math.round((saidas / total) * 100);

    return (
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-slate-700 font-bold mb-4 text-lg">Balanço do Mês</h3>

            <div className="flex items-end justify-center gap-8 h-40 px-4 pb-2">
                {/* Coluna Entradas */}
                <div className="flex flex-col items-center gap-2 group">
                    <div className="relative h-32 w-14 bg-slate-50 rounded-t-2xl flex items-end justify-center overflow-hidden">
                        {/* Barra Verde */}
                        <div
                            style={{ height: `${entradasPct}%` }}
                            className="w-full bg-emerald-500 rounded-t-lg relative hover:bg-emerald-400 transition-all duration-500"
                        ></div>
                    </div>
                    <div className="text-center">
                        <span className="block text-xs font-bold text-emerald-600">{formatCurrency(entradas)}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Entradas</span>
                    </div>
                </div>

                {/* Coluna Saídas */}
                <div className="flex flex-col items-center gap-2 group">
                    <div className="relative h-32 w-14 bg-slate-50 rounded-t-2xl flex items-end justify-center overflow-hidden">
                        {/* Barra Vermelha */}
                        <div
                            style={{ height: `${saidasPct}%` }}
                            className="w-full bg-red-500 rounded-t-lg relative hover:bg-red-400 transition-all duration-500"
                        ></div>
                    </div>
                    <div className="text-center">
                        <span className="block text-xs font-bold text-red-600">{formatCurrency(saidas)}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Saídas</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinancialChart;
