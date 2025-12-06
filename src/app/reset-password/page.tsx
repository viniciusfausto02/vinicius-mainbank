'use client';

/**
 * Reset Password Page
 * Allows users to enter a new password using a reset token
 */

import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ResetPasswordPage() {
  const router = useRouter();
  const toast = useToast();
  const { t } = useLanguage();
  const searchParams = useSearchParams();

  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');

    if (!tokenParam || !emailParam) {
      toast.error(t('resetPasswordErrorToken'));
      router.push('/forgot-password');
      return;
    }

    setToken(tokenParam);
    setEmail(decodeURIComponent(emailParam));
  }, [searchParams, toast, router, t]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Validation
    if (password.length < 8) {
      toast.error(t('resetPasswordErrorPassword'));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t('resetPasswordErrorMismatch'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || t('resetPasswordErrorFailed'));
        return;
      }

      toast.success(t('resetPasswordSuccessToast'));
      setSubmitted(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('resetPasswordErrorUnexpected'));
    } finally {
      setIsLoading(false);
    }
  }

  if (!token || !email) {
    return null; // Will redirect in useEffect
  }

  // Calculate password strength
  function getPasswordStrength(pwd: string): { strength: number; label: string } {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;

    if (strength <= 2) return { strength, label: t('resetPasswordStrengthWeak') };
    if (strength <= 4) return { strength, label: t('resetPasswordStrengthMedium') };
    return { strength, label: t('resetPasswordStrengthStrong') };
  }

  const passwordStrength = getPasswordStrength(password);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent mb-2">
            {t('resetPasswordTitle')}
          </h1>
          <p className="text-slate-400">
            {t('resetPasswordDescription')}
          </p>
        </div>

        {/* Success Message */}
        {submitted ? (
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-6 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-semibold text-green-400 mb-2">
              {t('resetPasswordSuccessTitle')}
            </h2>
            <p className="text-slate-300">
              {t('resetPasswordSuccessMessage')}
            </p>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 shadow-2xl">
            {/* Token Display (for demo purposes) */}
            <div className="mb-6 p-3 bg-slate-900/50 border border-slate-700 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">{t('resetPasswordTokenLabel')}</p>
              <code className="text-xs text-blue-400 break-all">{token}</code>
            </div>

            {/* Email Display */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t('resetPasswordEmailLabel')}
              </label>
              <div className="px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-400">
                {email}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                  {t('resetPasswordNewPasswordLabel')}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('resetPasswordPasswordPlaceholder')}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
                  {t('resetPasswordConfirmPasswordLabel')}
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('resetPasswordConfirmPlaceholder')}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">{t('resetPasswordStrengthLabel')}</span>
                    <span className={
                      passwordStrength.strength <= 2 ? 'text-red-400' :
                      passwordStrength.strength <= 4 ? 'text-yellow-400' :
                      'text-green-400'
                    }>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        passwordStrength.strength <= 2 ? 'bg-red-500' :
                        passwordStrength.strength <= 4 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Requirements */}
              <div className="text-xs text-slate-400 space-y-1">
                <p className={password.length >= 8 ? 'text-green-400' : ''}>
                  ✓ {t('resetPasswordReqLength')}
                </p>
                <p className={password && confirmPassword && password === confirmPassword ? 'text-green-400' : ''}>
                  ✓ {t('resetPasswordReqMatch')}
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || password.length < 8 || password !== confirmPassword}
                className="w-full bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold py-3 rounded-lg transition-all disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? t('resetPasswordSubmittingButton') : t('resetPasswordSubmitButton')}
              </button>

              {/* Back to Forgot Password */}
              <button
                type="button"
                onClick={() => router.push('/forgot-password')}
                className="w-full text-sm text-slate-400 hover:text-white transition-colors"
              >
                {t('resetPasswordBackButton')}
              </button>
            </form>
          </div>
        )}

        {/* Password Tips */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
          <p className="text-blue-300 text-sm">
            <strong>🔒 {t('resetPasswordTipsTitle')}</strong> {t('resetPasswordTipsBody')}
          </p>
        </div>
      </div>
    </main>
  );
}
