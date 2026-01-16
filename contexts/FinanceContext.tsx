import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Transaction } from '../types';

interface FinanceContextType {
    transactions: Transaction[];
    balance: number;
    income: number;
    expenses: number;
    costs: number; // Added Costs (CMV)
    loading: boolean;
    refreshTransactions: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState(0);
    const [income, setIncome] = useState(0);
    const [expenses, setExpenses] = useState(0);
    const [costs, setCosts] = useState(0); // State for Costs

    const refreshTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Get Org ID
            const { data: profile } = await supabase
                .from('profiles')
                .select('organization_id')
                .eq('id', session.user.id)
                .single();

            if (!profile?.organization_id) return;

            // Monthly Filter Logic (Current Month)
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const start = `${year}-${month}-01`;
            // Calculate last day
            const lastDay = new Date(year, today.getMonth() + 1, 0).getDate();
            const end = `${year}-${month}-${lastDay}`;


            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('organization_id', profile.organization_id)
                .gte('date', start)
                .lte('date', end)
                .order('date', { ascending: false });

            if (error) throw error;

            const txs = data as Transaction[] || [];
            setTransactions(txs);

            // Calculate Totals
            const inc = txs
                .filter(t => t.type === 'income' && (t.status === 'paid' || t.status === 'completed'))
                .reduce((sum, t) => sum + Number(t.amount), 0);

            const exp = txs
                .filter(t => t.type === 'expense' && (t.status === 'paid' || t.status === 'completed'))
                .reduce((sum, t) => sum + Number(t.amount), 0);

            // Calculate Total Costs (CMV)
            const totalCosts = txs
                .filter(t => t.type === 'income' && (t.status === 'paid' || t.status === 'completed'))
                .reduce((sum, t) => sum + Number(t.cost_amount ?? 0), 0);

            setIncome(inc);
            setExpenses(exp);
            setCosts(totalCosts);
            // Real Profit = Revenue - Costs - Expenses
            setBalance(inc - totalCosts - exp);

        } catch (err) {
            console.error('Error fetching transactions:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshTransactions();
    }, [refreshTransactions]);

    return (
        <FinanceContext.Provider value={{ transactions, balance, income, expenses, costs, loading, refreshTransactions }}>
            {children}
        </FinanceContext.Provider>
    );
};

export const useFinance = () => {
    const context = useContext(FinanceContext);
    if (context === undefined) {
        throw new Error('useFinance must be used within a FinanceProvider');
    }
    return context;
};
