
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { View, Produto, ContaFixa, Venda } from './types';
import { db } from './lib/database';
import Home from './views/Home';
import Vendas from './views/Vendas';
import Estoque from './views/Estoque';
import Contas from './views/Contas';
import AssistenteIA from './views/AssistenteIA';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('home');
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [contas, setContas] = useState<ContaFixa[]>([]);
  const [vendasHoje, setVendasHoje] = useState<Venda[]>([]);

  const loadData = () => {
    setProdutos([...db.getProdutos()]);
    setContas([...db.getContas()]);
    setVendasHoje([...db.getVendasHoje()]);
  };

  useEffect(() => {
    loadData();
  }, [activeView]);

  const renderView = () => {
    switch (activeView) {
      case 'home':
        return <Home 
          produtos={produtos} 
          vendasHoje={vendasHoje} 
          contas={contas} 
          onNavigate={setActiveView} 
        />;
      case 'vendas':
        return <Vendas 
          produtos={produtos} 
          onVendaRealizada={loadData} 
        />;
      case 'estoque':
        return <Estoque 
          produtos={produtos} 
          onUpdate={loadData} 
        />;
      case 'contas':
        return <Contas 
          contas={contas} 
          onUpdate={loadData} 
        />;
      case 'ia':
        return <AssistenteIA 
          produtos={produtos} 
          vendasHoje={vendasHoje} 
          contas={contas} 
        />;
      default:
        return <Home produtos={produtos} vendasHoje={vendasHoje} contas={contas} onNavigate={setActiveView} />;
    }
  };

  return (
    <Layout activeView={activeView} onNavigate={setActiveView}>
      {renderView()}
    </Layout>
  );
};

export default App;
