import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from './Button';
import { apiService } from '../services/api';

type LoginModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess?: (user: any) => void;
    onSwitchToRegister?: () => void;
    isDark?: boolean;
};

function LoginModal({ isOpen, onClose, onLoginSuccess, onSwitchToRegister, isDark = false }: LoginModalProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { t } = useTranslation();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await apiService.login({ email, password });
            console.log('✅ Login successful:', response);

            if (onLoginSuccess) {
                onLoginSuccess(response.user);
            }

            onClose();
            setEmail('');
            setPassword('');
        } catch (err: any) {
            setError(err.message || t('auth.loginError'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={handleBackdropClick}
        >
            {/* Modal */}
            <div
                className={`relative w-full max-w-md rounded-2xl shadow-2xl ${
                    isDark ? 'bg-neutral-800 border-2 border-neutral-700' : 'bg-white'
                } animate-in zoom-in-95 duration-200`}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${
                        isDark
                            ? 'hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200'
                            : 'hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900'
                    }`}
                    aria-label={t('auth.close')}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Header */}
                <div className="p-6 pb-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-brand-primary rounded-xl flex items-center justify-center">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                {t('auth.loginTitle')}
                            </h2>
                            <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                {t('auth.loginSubtitle')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-4">
                    {/* Error message */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700">
                            <p className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </p>
                        </div>
                    )}

                    {/* Email */}
                    <div>
                        <label
                            htmlFor="email"
                            className={`block text-sm font-medium mb-2 ${
                                isDark ? 'text-neutral-300' : 'text-neutral-700'
                            }`}
                        >
                            {t('auth.emailLabel')}
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="votre@email.com"
                            required
                            className={`w-full px-4 py-3 rounded-lg border-2 transition-colors ${
                                isDark
                                    ? 'bg-neutral-700 border-neutral-600 text-white placeholder-neutral-500 focus:border-brand-primary'
                                    : 'bg-neutral-50 border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-brand-primary'
                            } focus:outline-none focus:ring-2 focus:ring-brand-primary/20`}
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label
                            htmlFor="password"
                            className={`block text-sm font-medium mb-2 ${
                                isDark ? 'text-neutral-300' : 'text-neutral-700'
                            }`}
                        >
                            {t('auth.passwordLabel')}
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className={`w-full px-4 py-3 rounded-lg border-2 transition-colors ${
                                isDark
                                    ? 'bg-neutral-700 border-neutral-600 text-white placeholder-neutral-500 focus:border-brand-primary'
                                    : 'bg-neutral-50 border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-brand-primary'
                            } focus:outline-none focus:ring-2 focus:ring-brand-primary/20`}
                        />
                    </div>

                    {/* Forgot password */}
                    <div className="text-right">
                        <button
                            type="button"
                            className="text-sm text-brand-primary hover:underline"
                        >
                            {t('auth.forgotPassword')}
                        </button>
                    </div>

                    {/* Submit button */}
                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        disabled={isLoading}
                        className="w-full"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                {t('auth.connexionEnCours')}
                            </>
                        ) : (
                            t('auth.loginButton')
                        )}
                    </Button>

                    {/* Sign up link */}
                    <div className={`text-center text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                        {t('auth.noAccount')}{' '}
                        <button
                            type="button"
                            onClick={onSwitchToRegister}
                            className="text-brand-primary font-semibold hover:underline"
                        >
                            {t('auth.switchToRegister')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LoginModal;
