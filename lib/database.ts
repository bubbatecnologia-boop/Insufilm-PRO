
import { Produto, Venda, ContaFixa } from '../types';
import { MOCK_PRODUTOS, MOCK_CONTAS } from '../constants';

// Simulated DB state
let _produtos = [...MOCK_PRODUTOS];
let _vendas: Venda[] = [];
let _contas = [...MOCK_CONTAS];

export const db = {
  getProdutos: () => _produtos,
  
  getVendasHoje: () => {
    const hoje = new Date().toISOString().split('T')[0];
    return _vendas.filter(v => v.data.startsWith(hoje));
  },

  getContas: () => _contas,

  registrarVenda: (venda: Omit<Venda, 'id' | 'data'>) => {
    const novaVenda: Venda = {
      ...venda,
      id: Math.random().toString(36).substr(2, 9),
      data: new Date().toISOString()
    };
    
    _vendas = [novaVenda, ..._vendas];
    
    // Simulating the Database Trigger for stock deduction
    _produtos = _produtos.map(p => {
      if (p.id === venda.produto_id) {
        return { ...p, quantidade_atual: p.quantidade_atual - venda.quantidade };
      }
      return p;
    });

    return novaVenda;
  },

  toggleContaPaga: (id: string) => {
    _contas = _contas.map(c => c.id === id ? { ...c, pago: !c.pago } : c);
  },

  addProduto: (p: Omit<Produto, 'id'>) => {
    const novo = { ...p, id: Math.random().toString(36).substr(2, 9) };
    _produtos = [..._produtos, novo];
    return novo;
  }
};
