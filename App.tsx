import React, { useState, useEffect } from 'react';
import { View } from './types';
import { supabase } from './lib/supabase';
// import { db } from './lib/database';
import { AnimatePresence } from 'framer-motion';
import { FinanceProvider } from './contexts/FinanceContext';
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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [orgName, setOrgName] = useState('Insufilm Pro'); // Default fallback

  const fetchOrgData = async (uid: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', uid)
        .single();

      if (profile?.organization_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', profile.organization_id)
          .single();

        if (org?.name) {
          setOrgName(org.name);
        }
      }
    } catch (error) {
      console.error("Error fetching org name:", error);
    }
  };

  useEffect(() => {
    // Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchOrgData(session.user.id);
      setLoading(false);
    });

    // Auth Change Listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchOrgData(session.user.id);
      } else {
        setOrgName('Insufilm Pro');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUpdate = () => {
    setNeedsUpdate(prev => prev + 1);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsUserMenuOpen(false);
    setOrgName('Insufilm Pro');
  };


  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Carregando...</div>;
  }

  if (!session) {
    return <Auth onLogin={() => { }} />;
  }

  return (
    <FinanceProvider>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">

        {/* Top Bar for Mobile - Only on Home */}
        {currentView === 'home' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-md bg-white/60 backdrop-blur-xl z-50 px-5 py-3 rounded-2xl shadow-sm border border-white/50 flex justify-between items-center">

            {/* Left Block: Identity */}
            <div className="flex flex-col justify-center">
              <span className="text-sm text-gray-500 font-medium leading-none mb-0.5">
                Olá, {session?.user?.email?.split('@')[0]}
              </span>
              <h1 className="text-xl font-bold tracking-tight text-gray-900 leading-none">
                {orgName}
              </h1>
            </div>

            {/* Right Block: Actions */}
            <div className="flex items-center gap-4">

              {/* Notification Bell */}
              <button className="relative p-1 text-gray-600 hover:text-gray-900 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                {/* Warning Badge (Conditional) */}
                {/* Assuming hasWarnings logic will be implemented or passed. For UI demo, showing the structure. */}
                {true && (
                  <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-red-500 rounded-full border border-white"></span>
                )}
              </button>

              {/* Avatar / User Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 ring-2 ring-gray-100 hover:bg-slate-200 transition-colors focus:outline-none"
                >
                  <span className="font-bold text-lg">{session?.user?.email?.[0].toUpperCase()}</span>
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)}></div>
                    <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="px-3 py-2 border-b border-slate-50 mb-1">
                        <p className="text-xs text-slate-400 font-medium">Logado como</p>
                        <p className="text-sm font-bold text-slate-800 truncate">{session.user.email}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                        Sair da Conta
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className={`flex-1 overflow-y-auto no-scrollbar pb-32 ${currentView === 'home' ? 'pt-24' : 'pt-6'} px-6 max-w-md mx-auto min-h-screen`}>
          <AnimatePresence mode="wait">
            {currentView === 'home' && <Home key="home" onNavigate={setCurrentView} onUpdate={handleUpdate} />}
            {currentView === 'agenda' && <Agenda key="agenda" onUpdate={handleUpdate} />}
            {currentView === 'estoque' && <Estoque key="estoque" produtos={[]} onUpdate={handleUpdate} />}
            {currentView === 'contas' && <Contas key="contas" onUpdate={handleUpdate} />}
            {currentView === 'ia' && <AssistenteIA key="ia" />}
          </AnimatePresence>
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl py-3 px-6 z-50 flex justify-between items-center">

          <button
            onClick={() => setCurrentView('home')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 group ${currentView === 'home' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <div className={`px-5 py-2 rounded-full transition-all duration-300 ${currentView === 'home' ? 'bg-blue-100 text-blue-600' : 'bg-transparent'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={currentView === 'home' ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            </div>
            <span className="text-[10px] font-bold">Início</span>
          </button>

          <button
            onClick={() => setCurrentView('agenda')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 group ${currentView === 'agenda' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <div className={`px-5 py-2 rounded-full transition-all duration-300 ${currentView === 'agenda' ? 'bg-blue-100 text-blue-600' : 'bg-transparent'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={currentView === 'agenda' ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            </div>
            <span className="text-[10px] font-bold">Agenda</span>
          </button>

          <button
            onClick={() => setCurrentView('estoque')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 group ${currentView === 'estoque' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <div className={`px-5 py-2 rounded-full transition-all duration-300 ${currentView === 'estoque' ? 'bg-blue-100 text-blue-600' : 'bg-transparent'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={currentView === 'estoque' ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" y1="22" x2="12" y2="12" /></svg>
            </div>
            <span className="text-[10px] font-bold">Estoque</span>
          </button>

          <button
            onClick={() => setCurrentView('contas')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 group ${currentView === 'contas' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <div className={`px-5 py-2 rounded-full transition-all duration-300 ${currentView === 'contas' ? 'bg-blue-100 text-blue-600' : 'bg-transparent'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={currentView === 'contas' ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v5" /><path d="M3 12v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" /><path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /><path d="M12 12v6" /></svg>
            </div>
            <span className="text-[10px] font-bold">Financeiro</span>
          </button>

          <button
            onClick={() => setCurrentView('ia')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 group ${currentView === 'ia' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <div className={`px-5 py-2 rounded-full transition-all duration-300 ${currentView === 'ia' ? 'bg-blue-100 text-blue-600' : 'bg-transparent'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={currentView === 'ia' ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" /><path d="M12 16a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2z" /><path d="M6 8a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z" /><path d="M18 8a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z" /></svg>
            </div>
            <span className="text-[10px] font-bold">IA</span>
          </button>
        </nav>
      </div>
    </FinanceProvider >
  );
};

export default App;
