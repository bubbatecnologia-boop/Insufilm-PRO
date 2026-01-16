
export type ProductType = 'material_metro' | 'unidade';
export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'canceled';
export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'paid' | 'pending' | 'completed';
export type UserRole = 'admin' | 'member';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Profile {
  id: string;
  organization_id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface Product {
  id: string;
  organization_id: string;
  name: string;
  type: ProductType;
  stock_quantity: number;
  min_stock_alert: number;
  cost_price: number;
  sale_price: number;
  created_at: string;
}

export interface Client {
  id: string;
  organization_id: string;
  name: string;
  phone?: string;
  car_model?: string;
  notes?: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  organization_id: string;
  client_id?: string;
  title: string;
  start_time: string; // ISO String
  end_time: string;   // ISO String
  status: AppointmentStatus;
  price_total: number;
  created_at: string;
  // Joins (Optional)
  client?: Client;
}

export interface Transaction {
  id: string;
  organization_id: string;
  description: string;
  amount: number;
  cost_amount?: number;
  category?: string;
  type: TransactionType;
  status: TransactionStatus;
  date: string; // YYYY-MM-DD
  due_date?: string; // YYYY-MM-DD
  payment_method?: string;
  created_at: string;
}

export type View = 'home' | 'agenda' | 'estoque' | 'contas' | 'ia';
