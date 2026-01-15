import { supabase } from './supabase';
import { Product, Appointment, Transaction, Client, Organization, Profile } from '../types';

// Helper to get Organization ID (though RLS handles security, we often need it for inserts)
// For RLS to work on inserts, the user must be logged in. 
// We will rely on RLS policies: "auth.uid() -> profile -> org_id"
// BUT for INSERTs, we need to manually pass organization_id if the policy expects it, 
// OR we can trigger it. 
// The safest SaaS pattern: Front-end fetches the org_id once and sends it.
// OR simpler: Function wrapper.

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
    // We need to fetch the org_id first or trust the RLS default?
    // Let's assume the UI passes the org_id OR we fetch it here.
    // Optimization: Store org_id in Context/Session.
    // For now, let's strictly rely on what is passed or fetch if missing.
    // Actually, RLS blocks if org_id is wrong.

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

  // --- OTHERS (Placeholders for now to allow compiling) ---
  getTemplates: async () => [],
  getContas: async () => [],
  getAgendamentos: async () => [],
  getVendasHoje: async () => [],
  registrarVenda: async () => { },
  addContaTemplate: async () => { },
  toggleContaPaga: async () => { },
  deleteConta: async () => { },
  updateValorConta: async () => { },
  addAgendamento: async () => { },
  removeAgendamento: async () => { },
  updateAgendamentoStatus: async () => { }
};
