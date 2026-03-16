import React, { useState } from 'react'
import { createUser, loginUser, User } from '../api/users'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode: 'signin' | 'signup'
  onAuthSuccess: (user: User) => void
}

export default function AuthModal({ isOpen, onClose, initialMode, onAuthSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4 overflow-y-auto">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-[400px] bg-white dark:bg-[#1e2028] rounded-[24px] shadow-2xl border border-gray-100 dark:border-gray-800 p-8 pt-10 animate-in zoom-in-95 fade-in duration-300">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-10">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${mode === 'signin' ? 'bg-indigo-600 shadow-indigo-500/20' : 'bg-blue-600 shadow-blue-500/20'} shadow-xl text-white mb-6 transition-colors duration-500`}>
            {mode === 'signin' ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            )}
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400 font-medium">
            {mode === 'signin' 
              ? 'Log in to sync your documents' 
              : 'Sign up to get your secure set-password link'}
          </p>
        </div>

        {/* Form */}
        <form 
          className="space-y-5" 
          onSubmit={async (e) => { 
            e.preventDefault(); 
            if (mode === 'signup') {
              try {
                await createUser({ name, email });
                alert(`Success! A set-password link has been sent to ${email}. Please check your inbox.`);
                onClose();
              } catch (error) {
                console.error('Signup error:', error);
                alert(`Error: ${error instanceof Error ? error.message : 'Something went wrong during signup'}`);
              }
            } else {
              try {
                const response = await loginUser({ email, password });
                const data = response as any;

                if (data.token) {
                  localStorage.setItem('token', data.token);
                  
                  // Construct user object from response userId and form email
                  const userData: User = {
                    id: data.userId || 'unknown-id',
                    name: email.split('@')[0], // Use email prefix as temporary name
                    email: email
                  };

                  onAuthSuccess(userData);
                  onClose();
                } else {
                  throw new Error('No token received from server');
                }
              } catch (error) {
                console.error('Login error:', error);
                alert(`Error: ${error instanceof Error ? error.message : 'Invalid credentials'}`);
              }
            }
          }}
        >
          {mode === 'signup' && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Full Name</label>
              <div className="relative group">
                <input
                  type="text"
                  required
                  className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700/50 rounded-xl px-5 py-3.5 text-sm font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Email Address</label>
            <div className="relative group">
              <input
                type="email"
                required
                className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700/50 rounded-xl px-5 py-3.5 text-sm font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {mode === 'signin' && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Password</label>
                <button type="button" className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline">Forgot?</button>
              </div>
              <div className="relative group">
                <input
                  type="password"
                  required
                  className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700/50 rounded-xl px-5 py-3.5 text-sm font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all duration-200 mt-6"
          >
            {mode === 'signin' ? 'Sign In' : 'Send Setup Link'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-800/50 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
            <button 
              type="button"
              className="ml-2 text-blue-600 dark:text-blue-400 font-bold hover:underline"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            >
              {mode === 'signin' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
