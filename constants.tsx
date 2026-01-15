
import { Produto, ContaFixa } from './types';

export const SQL_SCHEMA = `
-- Tabela de Produtos
CREATE TABLE produtos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  foto TEXT,
  categoria TEXT,
  unidade TEXT CHECK (unidade IN ('UN', 'MT')),
  quantidade_atual DECIMAL DEFAULT 0,
  preco_venda DECIMAL DEFAULT 0,
  alerta_minimo DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Vendas
CREATE TABLE vendas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id UUID REFERENCES produtos(id),
  quantidade DECIMAL NOT NULL,
  valor_total DECIMAL NOT NULL,
  forma_pagamento TEXT,
  data TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Contas Fixas
CREATE TABLE contas_fixas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  valor DECIMAL NOT NULL,
  data_vencimento DATE NOT NULL,
  status_pago BOOLEAN DEFAULT FALSE
);

-- Trigger para Baixa Automática de Estoque
CREATE OR REPLACE FUNCTION baixar_estoque()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE produtos
  SET quantidade_atual = quantidade_atual - NEW.quantidade
  WHERE id = NEW.produto_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_baixa_estoque
AFTER INSERT ON vendas
FOR EACH ROW
EXECUTE FUNCTION baixar_estoque();
`;

export const MOCK_PRODUTOS: Produto[] = [
  { id: '1', nome: 'Insulfilm G5 Black', categoria: 'Películas', quantidade_atual: 15.5, preco_venda: 45.0, alerta_minimo: 5, unidade: 'MT' },
  { id: '2', nome: 'Câmera de Ré Multi', categoria: 'Acessórios', quantidade_atual: 3, preco_venda: 180.0, alerta_minimo: 5, unidade: 'UN' },
  { id: '3', nome: 'Led H7 Super Branca', categoria: 'Iluminação', quantidade_atual: 8, preco_venda: 120.0, alerta_minimo: 4, unidade: 'UN' },
  { id: '4', nome: 'Insulfilm Nanocerâmica', categoria: 'Películas', quantidade_atual: 2.1, preco_venda: 150.0, alerta_minimo: 10, unidade: 'MT' },
];

export const MOCK_CONTAS: ContaFixa[] = [
  { id: '1', nome: 'Aluguel Loja', valor: 1500, data_vencimento: '2024-06-10', pago: false },
  { id: '2', nome: 'Internet Fibra', valor: 120, data_vencimento: '2024-06-15', pago: true },
  { id: '3', nome: 'Energia Elétrica', valor: 350, data_vencimento: '2024-06-05', pago: false },
];
