import React, { useState } from 'react';
import { LogIn, ShieldCheck, Mail, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../api';

import type { User } from '../types';

export default function Login({ onSwitchToRegister, onLogin }: { onSwitchToRegister: () => void; onLogin: (user: User) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await api.login(email, password);
      if (result.success && result.user) {
        onLogin(result.user);
      } else {
        setError(result.error || 'Invalid credentials');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900 border border-white/5 rounded-3xl p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-emerald-600/20">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Chama360</h1>
          <p className="text-zinc-500 mt-2 text-center">
            Transparent Financial Management for Your Group
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/20 outline-none"
                placeholder="name@example.com"
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/20 outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center mt-2">{error}</p>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl mt-4 shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-900 px-2 text-zinc-500 font-bold tracking-widest">Secure Access</span>
            </div>
          </div>

          <p className="text-xs text-zinc-600 text-center">
            Authorized members only. Use your registered credentials to access the Chama360 dashboard.
          </p>
        </form>

        <div className="mt-6 pt-6 border-t border-white/5 text-center">
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Create an account
          </button>
        </div>
      </motion.div>
    </div>
  );
}

