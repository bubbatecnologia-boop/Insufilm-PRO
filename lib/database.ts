import { Produto, Venda, Conta, ContaTemplate, Agendamento } from '../types';
import { MOCK_PRODUTOS } from '../constants';

// Mock Config
const MOCK_TEMPLATES: ContaTemplate[] = [
  { id: 't1', nome: 'Aluguel Loja', dia_vencimento: 10, categoria: 'Infraestrutura', tipo: 'Fixa', valor_padrao: 1500 },
  { id: 't2', nome: 'Energia Elétrica', dia_vencimento: 5, categoria: 'Despesas Gerais', tipo: 'Variavel' },
  { id: 't3', nome: 'Internet', dia_vencimento: 15, categoria: 'Infraestrutura', tipo: 'Fixa', valor_padrao: 120 },
];

let _produtos = [...MOCK_PRODUTOS];
let _vendas: Venda[] = [];
let _contas: Conta[] = [];
let _templates: ContaTemplate[] = [...MOCK_TEMPLATES];

// Mock Agendamentos
let _agendamentos: Agendamento[] = [
  { id: 'a1', data: new Date().toISOString().split('T')[0], horario: '09:00', cliente: 'Carlos Silva', veiculo: 'Fiat Toro', servico: 'Película G5 Completa', status: 'Executando' },
  { id: 'a2', data: new Date().toISOString().split('T')[0], horario: '14:00', cliente: 'Ana Souza', veiculo: 'Honda Civic', servico: 'Sensor de Ré', status: 'Pendente' },
];

// Helper to generate bills for the current month
const gerarContasDoMes = () => {
  const hoje = new Date();
  const mesAtual = hoje.toISOString().slice(0, 7); // YYYY-MM

  _templates.forEach(template => {
    // Check if bill already exists for this template in this month
    const exists = _contas.some(c =>
      c.template_id === template.id &&
      c.data_vencimento.startsWith(mesAtual)
    );

    if (!exists) {
      // Create new bill instance
      const dia = template.dia_vencimento.toString().padStart(2, '0');
      const novaConta: Conta = {
        id: Math.random().toString(36).substr(2, 9),
        template_id: template.id,
        nome: template.nome,
        valor: template.valor_padrao || 0,
        data_vencimento: `${mesAtual}-${dia}`,
        pago: false,
        necessita_valor: template.tipo === 'Variavel',
        categoria: template.categoria, // Assuming Conta type has categoria
        tipo: 'Conta' // Assuming Conta type has tipo
      };
      _contas.push(novaConta);
    }
  });
};

// Initialize
gerarContasDoMes();

export const db = {
  getProdutos: () => _produtos,

  getVendasHoje: () => {
    const hoje = new Date().toISOString().split('T')[0];
    return _vendas.filter(v => v.data.startsWith(hoje));
  },

  getContas: () => {
    gerarContasDoMes(); // Ensure current month is covered
    return _contas.sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento));
  },

  getTemplates: () => _templates,

  registrarVenda: (venda: Omit<Venda, 'id' | 'data' | 'lucro'>, deduzirEstoque = true) => {
    const produto = _produtos.find(p => p.id === venda.produto_id);
    const lucroUnitario = produto ? (produto.preco_venda - produto.preco_custo) : 0;

    const novaVenda: Venda = {
      ...venda,
      lucro: lucroUnitario * venda.quantidade,
      id: Math.random().toString(36).substr(2, 9),
      data: new Date().toISOString()
    };

    _vendas = [novaVenda, ..._vendas];

    if (deduzirEstoque && venda.produto_id) {
      _produtos = _produtos.map(p => {
        if (p.id === venda.produto_id) {
          return { ...p, quantidade_atual: p.quantidade_atual - venda.quantidade };
        }
        return p;
      });
    }

    return novaVenda;
  },

  toggleContaPaga: (id: string) => {
    _contas = _contas.map(c => c.id === id ? { ...c, pago: !c.pago, data_pagamento: !c.pago ? new Date().toISOString().split('T')[0] : undefined } : c);
  },

  deleteConta: (id: string) => {
    _contas = _contas.filter(c => c.id !== id);
  },

  updateValorConta: (id: string, valor: number) => {
    _contas = _contas.map(c => c.id === id ? { ...c, valor, necessita_valor: false } : c);
  },

  addProduto: (p: Omit<Produto, 'id'>) => {
    const novo = { ...p, id: Math.random().toString(36).substr(2, 9) };
    _produtos = [..._produtos, novo];
    return novo;
  },

  updateProduto: (id: string, updates: Partial<Produto>) => {
    _produtos = _produtos.map(p => p.id === id ? { ...p, ...updates } : p);
  },

  addContaTemplate: (t: Omit<ContaTemplate, 'id'>) => {
    const novo = { ...t, id: Math.random().toString(36).substr(2, 9) };
    _templates.push(novo);
    gerarContasDoMes(); // Trigger generation for current month immediately
    return novo;
  },

  getAgendamentos: (data: string) => {
    return _agendamentos.filter(a => a.data === data);
  },

  addAgendamento: (a: Omit<Agendamento, 'id'>, reservarEstoque = true) => {
    const novo = { ...a, id: Math.random().toString(36).substr(2, 9) };

    // Deduct stock if product is reserved and flag is true
    if (a.produto_id && reservarEstoque) {
      _produtos = _produtos.map(p => {
        if (p.id === a.produto_id) {
          return { ...p, quantidade_atual: p.quantidade_atual - 1 };
        }
        return p;
      });
    }

    _agendamentos.push(novo);
    return novo;
  },

  removeAgendamento: (id: string) => {
    const agendamento = _agendamentos.find(a => a.id === id);
    if (!agendamento) return;

    // Return stock if it was reserved
    if (agendamento.produto_id) {
      _produtos = _produtos.map(p => {
        if (p.id === agendamento.produto_id) {
          return { ...p, quantidade_atual: p.quantidade_atual + 1 };
        }
        return p;
      });
    }

    _agendamentos = _agendamentos.filter(a => a.id !== id);
  },

  updateAgendamentoStatus: (id: string, status: Agendamento['status']) => {
    _agendamentos = _agendamentos.map(a => a.id === id ? { ...a, status } : a);
  }
};
