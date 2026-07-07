import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';


interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, initialTab = 'login' }: AuthModalProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { login, register } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [agree, setAgree] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (tab === 'register' && (!firstName || !lastName || !agree)) {
      showToast('Please fill all fields and accept the Terms.');
      return;
    }
    if (!email || !password) {
      showToast('Please enter your email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (tab === 'login') {
        await login(email, password);
        onClose();
        navigate('/dashboard');
      } else {
        const displayName = `${firstName} ${lastName}`.trim();
        await register(email, password, displayName);
        onClose();
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={tab === 'login' ? 'Welcome Back' : 'Create Account'}>
      <div className="flex flex-col gap-md font-body">
        {/* Sliding indicator tab selectors */}
        <div className="relative flex p-[4px] bg-surface-container-low rounded-xl border border-outline-variant select-none">
          <div
            className="absolute top-[4px] bottom-[4px] left-[4px] w-[calc(50%-4px)] bg-primary-container rounded-lg transition-transform duration-300 ease-out"
            style={{
              transform: tab === 'login' ? 'translateX(0)' : 'translateX(100%)',
            }}
          />
          <button
            type="button"
            onClick={() => setTab('login')}
            className={`w-1/2 py-[8px] text-label-sm font-semibold rounded-lg relative z-10 transition-colors duration-300 ${
              tab === 'login' ? 'text-on-primary-container' : 'text-on-surface-variant'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            className={`w-1/2 py-[8px] text-label-sm font-semibold rounded-lg relative z-10 transition-colors duration-300 ${
              tab === 'register' ? 'text-on-primary-container' : 'text-on-surface-variant'
            }`}
          >
            Register
          </button>
        </div>

        {/* Input Forms */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-md text-left">
          {tab === 'register' && (
            <div className="grid grid-cols-2 gap-sm">
              <div className="flex flex-col gap-xs">
                <label className="text-label-sm text-on-surface-variant font-medium">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full px-md py-sm rounded-xl border border-outline bg-surface-container-low focus:border-primary focus:outline-none text-body-sm transition-colors text-on-surface"
                />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="text-label-sm text-on-surface-variant font-medium">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full px-md py-sm rounded-xl border border-outline bg-surface-container-low focus:border-primary focus:outline-none text-body-sm transition-colors text-on-surface"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-xs">
            <label className="text-label-sm text-on-surface-variant font-medium">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-md py-sm rounded-xl border border-outline bg-surface-container-low focus:border-primary focus:outline-none text-body-sm transition-colors text-on-surface"
            />
          </div>

          <div className="flex flex-col gap-xs">
            <div className="flex justify-between items-center">
              <label className="text-label-sm text-on-surface-variant font-medium">Password</label>
              {tab === 'login' && (
                <button
                  type="button"
                  onClick={() => showToast('Reset instructions sent to your email')}
                  className="text-label-sm text-primary hover:underline"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-md py-sm rounded-xl border border-outline bg-surface-container-low focus:border-primary focus:outline-none text-body-sm transition-colors text-on-surface"
            />
          </div>

          {tab === 'register' && (
            <label className="flex items-start gap-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-[3px] accent-primary"
              />
              <span className="text-body-xs text-on-surface-variant leading-tight">
                I agree to the Terms of Service and Privacy Policy.
              </span>
            </label>
          )}

          {/* Submit Button */}
          <Button type="submit" isLoading={isSubmitting} className="w-full mt-xs">
            {tab === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-md text-on-surface-variant/40 py-xs">
          <hr className="flex-1 border-outline-variant" />
          <span className="text-label-sm font-semibold select-none">OR</span>
          <hr className="flex-1 border-outline-variant" />
        </div>

        {/* Social Authentication */}
        <div className="grid grid-cols-2 gap-sm">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const backendHost = window.location.hostname;
              window.location.href = `http://${backendHost}:8000/api/v1/auth/google/login`;
            }}
          >
            Google
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const backendHost = window.location.hostname;
              window.location.href = `http://${backendHost}:8000/api/v1/auth/github/login`;
            }}
          >
            GitHub
          </Button>
        </div>
      </div>
    </Modal>
  );
}