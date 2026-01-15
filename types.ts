
export type UnidadeMedida = 'UN' | 'MT';

export interface Produto {
  id: string;
  nome: string;
  foto?: string;
  categoria: string;
  quantidade_atual: number;
  preco_venda: number;
  alerta_minimo: number;
  unidade: UnidadeMedida;
}

export interface Venda {
  id: string;
  produto_id: string;
  produto_nome: string;
  quantidade: number;
  valor_total: number;
  forma_pagamento: 'Dinheiro' | 'Pix' | 'Cartão';
  data: string;
}

export interface ContaFixa {
  id: string;
  nome: string;
  valor: number;
  data_vencimento: string;
  pago: boolean;
}

export type View = 'home' | 'vendas' | 'estoque' | 'contas' | 'ia';
