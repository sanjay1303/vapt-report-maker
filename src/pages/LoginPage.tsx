import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { authService } from '../services/authService';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = authService.login(username, password, rememberMe);
      setIsLoading(false);
      if (res.success) {
        onLoginSuccess();
      } else {
        setError(res.message || 'Invalid username or password.');
      }
    }, 400);
  };

  const handleQuickFill = () => {
    setUsername('sanjay');
    setPassword('Sanjay@437');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#130f1e] flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Glows & Cyber Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Login Card */}
      <div className="relative w-full max-w-md bg-[#1c162e]/90 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-8 shadow-2xl shadow-purple-950/50 z-10">
        {/* Header / Brand */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-purple-500 text-white shadow-lg shadow-primary-600/30 ring-4 ring-white/10">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              VAPT <span className="text-primary-400">Report Maker</span>
            </h1>
            <p className="text-xs font-semibold text-purple-300/80 tracking-wider uppercase mt-1">
              Enterprise Security Assessment Portal
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2.5 animate-in fade-in zoom-in-95 duration-150">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                autoFocus
                placeholder="Enter username (e.g. sanjay)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#130f1e]/80 border border-purple-500/30 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-hidden focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 transition-all font-medium"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Password
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-3 bg-[#130f1e]/80 border border-purple-500/30 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-hidden focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me & Quick Fill Helper */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-purple-400/40 bg-[#130f1e] text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
              />
              <span>Remember me</span>
            </label>

            <button
              type="button"
              onClick={handleQuickFill}
              className="text-primary-400 hover:text-primary-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Click to fill credentials"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Fill Default Login</span>
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !username || !password}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] cursor-pointer mt-2"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Authenticating...</span>
              </div>
            ) : (
              <>
                <span>Sign In to Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Credentials Pill for User Convenience */}
        <div className="mt-6 pt-5 border-t border-purple-500/10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-950/60 border border-purple-500/20 text-[11px] text-purple-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Authorized User: <strong className="text-white font-mono">sanjay</strong></span>
            <span className="text-purple-500">•</span>
            <span>Password: <strong className="text-white font-mono">Sanjay@437</strong></span>
          </div>
        </div>

        {/* Security Disclaimers */}
        <p className="text-[10px] text-slate-500 text-center mt-5 leading-relaxed">
          Authorized personnel only. Sessions are authenticated and monitored in compliance with OWASP Top 10 and ISO 27001 standards.
        </p>
      </div>
    </div>
  );
};
