import React, { useState, useEffect } from 'react';
import { View } from './types';
import { supabase } from './lib/supabase';
// import { db } from './lib/database';
import Home from './views/Home';
import Estoque from './views/Estoque';
import Contas from './views/Contas';
import AssistenteIA from './views/AssistenteIA';
import Agenda from './views/Agenda';
import Auth from './views/Auth';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [needsUpdate, setNeedsUpdate] = useState(0);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUpdate = () => {
    setNeedsUpdate(prev => prev + 1);
  };

  const renderView = () => {
    // Temporary: Passing mock or empty props until Views are refactored
    switch (currentView) {
      case 'home':
        return <Home key={needsUpdate} onNavigate={setCurrentView} onUpdate={handleUpdate} />;
      case 'agenda':
        return <Agenda onUpdate={handleUpdate} />;
      case 'estoque':
        return <Estoque key={needsUpdate} produtos={[]} onUpdate={handleUpdate} />; // Fixed for compiling
      case 'contas':
        return <Contas key={needsUpdate} contas={[]} templates={[]} onUpdate={handleUpdate} />; // Fixed for compiling
      case 'ia':
        return <AssistenteIA />;
      default:
        return <Home onNavigate={setCurrentView} />;
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Carregando...</div>;
  }

  if (!session) {
    return <Auth onLogin={() => { }} />; // Session update handles the flow now
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">

      {/* Top Bar for Mobile */}
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-40 px-6 py-4 border-b border-slate-100 flex justify-between items-center safe-top">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Insufilm <span className="text-blue-600">Pro</span>
        </h1>
        <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
        </button>
      </div>

      {/* Main Content Area */}
      <main className="pt-24 pb-28 px-6 max-w-md mx-auto min-h-screen">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {renderView()}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-4 pb-8 z-50 flex justify-around items-center safe-bottom">

        <button
          onClick={() => setCurrentView('home')}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${currentView === 'home' ? 'text-blue-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className={`p-2 rounded-xl transition-all ${currentView === 'home' ? 'bg-blue-50' : 'bg-transparent'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={currentView === 'home' ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
          </div>
          <span className="text-[10px] font-bold">Início</span>
        </button>

        <button
          onClick={() => setCurrentView('agenda')}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${currentView === 'agenda' ? 'text-blue-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className={`p-2 rounded-xl transition-all ${currentView === 'agenda' ? 'bg-blue-50' : 'bg-transparent'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={currentView === 'agenda' ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
          </div>
          <span className="text-[10px] font-bold">Agenda</span>
        </button>

        <button
          onClick={() => setCurrentView('estoque')}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${currentView === 'estoque' ? 'text-blue-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className={`p-2 rounded-xl transition-all ${currentView === 'estoque' ? 'bg-blue-50' : 'bg-transparent'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={currentView === 'estoque' ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" y1="22" x2="12" y2="12" /></svg>
          </div>
          <span className="text-[10px] font-bold">Estoque</span>
        </button>

        <button
          onClick={() => setCurrentView('contas')}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${currentView === 'contas' ? 'text-blue-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className={`p-2 rounded-xl transition-all ${currentView === 'contas' ? 'bg-blue-50' : 'bg-transparent'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={currentView === 'contas' ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
          </div>
          <span className="text-[10px] font-bold">Contas</span>
        </button>

        <button
          onClick={() => setCurrentView('ia')}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${currentView === 'ia' ? 'text-blue-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className={`p-2 rounded-xl transition-all ${currentView === 'ia' ? 'bg-blue-50' : 'bg-transparent'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={currentView === 'ia' ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" /><path d="M12 16a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2z" /><path d="M6 8a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z" /><path d="M18 8a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z" /></svg>
          </div>
          <span className="text-[10px] font-bold">IA</span>
        </button>

      </nav>
    </div>
  );
};

export default App;
