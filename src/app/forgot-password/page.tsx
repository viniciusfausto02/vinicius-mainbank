'use client';

/**
 * Forgot Password Page
 * Allows users to request a password recovery email
 */

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const toast = useToast();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email || !email.includes('@')) {
      toast.error(t('forgotPasswordErrorEmail'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || t('forgotPasswordErrorSend'));
        return;
      }

      toast.success(t('forgotPasswordSuccessToast'));
      setSubmitted(true);
      setEmail('');
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('forgotPasswordErrorUnexpected'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t('forgotPasswordTitle')}</h1>
          <p className="text-slate-400">
            {t('forgotPasswordDescription')}
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm">
          {submitted ? (
            // Success state
            <div className="space-y-4">
              <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
                <p className="text-green-300 font-medium">{t('forgotPasswordSuccessTitle')}</p>
              </div>

              <p className="text-slate-300 text-center">
                {t('forgotPasswordSuccessMessage')}
              </p>

              <p className="text-slate-400 text-sm text-center">
                {t('forgotPasswordSuccessFooter')}{' '}
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-purple-400 hover:text-purple-300 font-medium"
                >
                  {t('forgotPasswordTryAgain')}
                </button>
                .
              </p>

              <button
                onClick={() => router.push('/login')}
                className="w-full mt-6 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-semibold rounded-lg transition-all duration-300"
              >
                {t('forgotPasswordBackToLogin')}
              </button>
            </div>
          ) : (
            // Form state
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t('forgotPasswordEmailLabel')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('forgotPasswordEmailPlaceholder')}
                  className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? t('forgotPasswordSendingButton') : t('forgotPasswordSendButton')}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="px-2 bg-slate-900/50 text-slate-400">{t('forgotPasswordOr')}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push('/login')}
                className="w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all"
              >
                {t('forgotPasswordBackToLogin')}
              </button>

              <p className="text-xs text-slate-400 text-center mt-4">
                {t('forgotPasswordNoAccount')}{' '}
                <button
                  type="button"
                  onClick={() => router.push('/register')}
                  className="text-purple-400 hover:text-purple-300 font-medium"
                >
                  {t('forgotPasswordSignUp')}
                </button>
              </p>
            </form>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
          <p className="text-blue-300 text-sm">
            <strong>{t('forgotPasswordSecurityTip')}</strong> {t('forgotPasswordSecurityMessage')}
          </p>
        </div>
      </div>
    </main>
  );
}
