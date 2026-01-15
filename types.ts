
export type UnidadeMedida = 'UN' | 'MT';

export interface Produto {
  id: string;
  nome: string;
  foto?: string;
  categoria: string;
  quantidade_atual: number;
  preco_venda: number;
  preco_custo: number;
  alerta_minimo: number;
  unidade: UnidadeMedida;
}

export interface Venda {
  id: string;
  produto_id: string;
  produto_nome: string;
  quantidade: number;
  valor_total: number;
  lucro: number;
  forma_pagamento: 'Dinheiro' | 'Pix' | 'Cartão';
  data: string;
}

export interface ContaTemplate {
  id: string;
  nome: string;
  dia_vencimento: number;
  categoria: string;
  tipo: 'Fixa' | 'Variavel';
  valor_padrao?: number; // Usado se tipo == 'Fixa'
}

export interface Conta {
  id: string;
  template_id?: string;
  nome: string;
  valor: number;
  data_vencimento: string; // YYYY-MM-DD
  pago: boolean;
  necessita_valor: boolean; // True se for variável e ainda não tiver valor definido
  categoria?: string;
  data_pagamento?: string;
  tipo?: 'Despesa' | 'Conta'; // Para diferenciar no histórico
}

export interface Agendamento {
  id: string;
  data: string; // YYYY-MM-DD
  horario: string; // HH:00
  cliente: string;
  veiculo: string;
  servico: string;
  contato?: string;
  valor?: number; // Preço do serviço
  produto_id?: string; // ID do produto reservado do estoque
  pago?: boolean; // Se já foi pago (venda vinculada)
  venda_id?: string; // ID da venda se houver
  status: 'Pendente' | 'Executando' | 'Concluido';
}

export type View = 'home' | 'agenda' | 'estoque' | 'contas' | 'ia';
