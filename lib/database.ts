import { supabase } from './supabase';
import { Product, Appointment, Transaction, Client, Organization, Profile } from '../types';

export const db = {
  // --- PRODUCTS ---
  getProducts: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }
    return data as Product[];
  },

  addProduct: async (product: Omit<Product, 'id' | 'created_at'>): Promise<Product | null> => {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();

    if (error) {
      console.error('Error adding product:', error);
      return null;
    }
    return data as Product;
  },

  updateProduct: async (id: string, updates: Partial<Product>): Promise<void> => {
    const { error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id);

    if (error) console.error('Error updating product:', error);
  },

  deleteProduct: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) console.error('Error deleting product:', error);
  },

  // --- CLIENTS ---
  createClient: async (client: Omit<Client, 'id' | 'created_at'>): Promise<Client | null> => {
    const { data, error } = await supabase
      .from('clients')
      .insert(client)
      .select()
      .single();

    if (error) {
      console.error('Error creating client:', error);
      return null;
    }
    return data as Client;
  },

  // --- APPOINTMENTS ---
  getAppointments: async (date: string): Promise<Appointment[]> => {
    // date is YYYY-MM-DD
    // Filter from T00:00:00 to T23:59:59 in local time approach (simple string comparison for now)
    // Or we can use Supabase filter logic more robustly
    const start = `${date}T00:00:00`;
    const end = `${date}T23:59:59`;

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        client:clients(*)
      `)
      .gte('start_time', start)
      .lte('start_time', end)
      .order('start_time');

    if (error) {
      console.error('Error fetching appointments:', error);
      return [];
    }
    return data as Appointment[];
  },

  addAppointment: async (appointment: Omit<Appointment, 'id' | 'created_at'>): Promise<Appointment | null> => {
    const { data, error } = await supabase
      .from('appointments')
      .insert(appointment)
      .select()
      .single();

    if (error) {
      console.error('Error adding appointment:', error);
      return null;
    }
    return data as Appointment;
  },

  updateAppointmentStatus: async (id: string, status: Appointment['status']): Promise<void> => {
    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id);
    if (error) console.error('Error updating appointment status:', error);
  },

  deleteAppointment: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);
    if (error) console.error('Error deleting appointment:', error);
  },

  // --- TRANSACTIONS (Finance) ---
  getTransactions: async (month?: string): Promise<Transaction[]> => {
    let query = supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (month) {
      // e.g. '2023-10'
      const start = `${month}-01`;

      // Calculate last day of the month correctly
      const [y, m] = month.split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate(); // Day 0 of next month is last day of current
      const end = `${month}-${lastDay}`;

      query = query.gte('date', start).lte('date', end);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
    return data as Transaction[];
  },

  addTransaction: async (transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction | null> => {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single();

    if (error) {
      console.error('Error adding transaction:', error);
      return null;
    }
    return data as Transaction;
  },

  updateTransaction: async (id: string, updates: Partial<Transaction>): Promise<void> => {
    const { error } = await supabase.from('transactions').update(updates).eq('id', id);
    if (error) console.error('Error updating transaction', error);
  },

  deleteTransaction: async (id: string): Promise<void> => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) console.error('Error deleting transaction', error);
  },

  // --- LEGACY/PLACEHOLDERS Helpers to keep other files from crashing before refactor ---
  getTemplates: async () => [],
  getContas: async () => [],
  getAgendamentos: async () => [], // Use getAppointments now
  getVendasHoje: async () => [],
  registrarVenda: async () => { },
  addContaTemplate: async () => { },
  toggleContaPaga: async () => { },
  deleteConta: async () => { },
  updateValorConta: async () => { },
  addAgendamento: async () => { }, // Use addAppointment
  removeAgendamento: async () => { }, // Use deleteAppointment
};
