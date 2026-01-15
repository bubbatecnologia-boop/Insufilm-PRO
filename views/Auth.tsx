import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface AuthProps {
    onLogin: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
    // Mode State
    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading] = useState(false);

    // Login State
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Register State
    const [registerStep, setRegisterStep] = useState(1);
    const [regName, setRegName] = useState('');
    const [regShopName, setRegShopName] = useState('');

    const handleSubmitLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        setLoading(false);

        if (error) {
            alert('Erro ao entrar: ' + error.message);
        } else {
            // App.tsx listener will handle state change
            if (onLogin) onLogin();
        }
    };

    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault();
        setRegisterStep(prev => prev + 1);
    };

    const handlePrevStep = () => {
        setRegisterStep(prev => prev - 1);
    };

    const handleFinishRegister = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: regName,
                    org_name: regShopName
                }
            }
        });
        setLoading(false);

        if (error) {
            alert('Erro ao criar conta: ' + error.message);
        } else {
            alert('Conta criada com sucesso! Verifique seu email para confirmar.');
            // If email confirmation is disabled, this will log them in. 
            // If enabled, they need to check email.
            if (onLogin) onLogin();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">

            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-3xl opacity-50"></div>
            </div>

            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in duration-500">
                <div className="p-8 md:p-10">

                    {/* Header (Only show on Login or Step 1) */}
                    {!isRegistering && (
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
                                Insufilm <span className="text-blue-600">Pro</span>
                            </h1>
                            <p className="text-slate-500 text-sm">
                                Gerencie sua loja de insulfilm e acessórios com inteligência.
                            </p>
                        </div>
                    )}

                    {/* Progress Bar (Only Register Mode) */}
                    {isRegistering && (
                        <div className="mb-8 flex justify-center gap-2">
                            {[1, 2, 3].map(step => (
                                <div
                                    key={step}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${step <= registerStep ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200'
                                        }`}
                                />
                            ))}
                        </div>
                    )}

                    {/* --- LOGIN FORM --- */}
                    {!isRegistering && (
                        <form onSubmit={handleSubmitLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700">E-mail</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="seu@email.com"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700">Senha</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                    </div>
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" /><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" /><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" /><path d="m2 2 20 20" /></svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 space-y-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                    {loading ? 'Entrando...' : 'Entrar na Minha Loja'}
                                </button>
                                <div className="text-center">
                                    <button
                                        type="button"
                                        onClick={() => setIsRegistering(true)}
                                        className="text-slate-500 hover:text-blue-600 text-sm font-medium transition-colors"
                                    >
                                        Criar Nova Conta
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}

                    {/* --- REGISTER WIZARD --- */}
                    {isRegistering && (
                        <form onSubmit={handleNextStep} className="space-y-6 animate-in slide-in-from-right duration-300">

                            {/* STEP 1: Basic Access */}
                            {registerStep === 1 && (
                                <>
                                    <div className="text-center mb-6">
                                        <h2 className="text-2xl font-bold text-slate-900">Comece Grátis</h2>
                                        <p className="text-slate-500 text-sm">Crie sua conta em segundos.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-slate-700">E-mail</label>
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                placeholder="seu@email.com"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-slate-700">Senha</label>
                                            <input
                                                type="password"
                                                required
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                placeholder="Criar senha"
                                            />
                                        </div>
                                        {/* Simplified: Removed Confirm Password for now or just trust user type correctly twice ;) */}
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsRegistering(false)}
                                            className="px-4 py-3 text-slate-500 hover:text-slate-800 font-medium transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all"
                                        >
                                            Continuar &gt;
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* STEP 2: About You */}
                            {registerStep === 2 && (
                                <>
                                    <div className="text-center mb-6">
                                        <h2 className="text-2xl font-bold text-slate-900">Como devemos chamar você?</h2>
                                        <p className="text-slate-500 text-sm">Isso aparecerá na sua saudação diária.</p>
                                    </div>

                                    <div className="space-y-4 py-4">
                                        <input
                                            type="text"
                                            autoFocus
                                            value={regName}
                                            onChange={(e) => setRegName(e.target.value)}
                                            required
                                            className="w-full px-4 py-4 text-center text-lg font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            placeholder="Seu Nome ou Apelido"
                                        />
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={handlePrevStep}
                                            className="px-4 py-3 text-slate-500 hover:text-slate-800 font-medium transition-colors"
                                        >
                                            Voltar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!regName}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all"
                                        >
                                            Continuar &gt;
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* STEP 3: Your Shop (The Wow Moment) */}
                            {registerStep === 3 && (
                                <>
                                    <div className="text-center mb-4">
                                        <h2 className="text-2xl font-bold text-slate-900">Qual o nome da sua oficina?</h2>
                                    </div>

                                    <div className="space-y-6">
                                        <input
                                            type="text"
                                            autoFocus
                                            value={regShopName}
                                            onChange={(e) => setRegShopName(e.target.value)}
                                            required
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            placeholder="Nome da Loja"
                                        />

                                        {/* PREVIEW BOX */}
                                        <div className="bg-slate-100 rounded-xl p-4 border border-slate-200 opacity-80 select-none">
                                            <div className="flex justify-between items-center mb-4 opacity-50">
                                                <div className="w-4 h-4 rounded-full bg-slate-300"></div>
                                                <div className="w-16 h-2 bg-slate-300 rounded-full"></div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs text-slate-500 font-medium">Bem-vindo, {regName || 'Visitante'}</p>
                                                <p className="text-lg font-bold text-slate-800 leading-tight">
                                                    {regShopName || 'Sua Loja...'}
                                                </p>
                                            </div>
                                            <div className="mt-4 grid grid-cols-2 gap-2 opacity-50">
                                                <div className="h-12 bg-white rounded-lg"></div>
                                                <div className="h-12 bg-white rounded-lg"></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={handlePrevStep}
                                            className="px-4 py-3 text-slate-500 hover:text-slate-800 font-medium transition-colors"
                                        >
                                            Voltar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleFinishRegister}
                                            disabled={!regShopName || loading}
                                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-green-600/30 transition-all"
                                        >
                                            {loading ? 'Criando Loja...' : 'Finalizar e Entrar'}
                                        </button>
                                    </div>
                                </>
                            )}

                        </form>
                    )}

                </div>
            </div>

            {/* Dev Mode Bypass */}
            <div className="mt-8 z-10 animate-in fade-in slide-in-from-bottom-4 delay-700 duration-700">
                <button
                    onClick={onLogin}
                    className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white/60 hover:text-white text-xs backdrop-blur-sm transition-all"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:text-amber-300 transition-colors"><path d="m12 14 4-4" /><path d="M3.34 19a10 10 0 1 1 17.32 0" /></svg>
                    Acessar Demo (Sem Login)
                </button>
            </div>

        </div>
    );
};

export default Auth;
