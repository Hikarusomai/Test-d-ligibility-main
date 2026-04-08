import { useState } from 'react';
import Button from './Button';
import { apiService } from '../services/api';

type RegisterModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onRegisterSuccess?: (user: any) => void;
    onSwitchToLogin?: () => void;
    isDark?: boolean;
};

function RegisterModal({ isOpen, onClose, onRegisterSuccess, onSwitchToLogin, isDark = false }: RegisterModalProps) {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phone: '',
        nationality: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.email || !formData.password) {
            setError('Email et mot de passe requis');
            return;
        }

        if (formData.password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        setIsLoading(true);

        try {
            const response = await apiService.register({
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                nationality: formData.nationality
            });

            console.log('✅ Registration successful:', response);

            if (onRegisterSuccess) {
                onRegisterSuccess(response.user);
            }

            onClose();

            // Reset form
            setFormData({
                email: '',
                password: '',
                confirmPassword: '',
                firstName: '',
                lastName: '',
                phone: '',
                nationality: ''
            });
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la création du compte');
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
            onClick={handleBackdropClick}
        >
            {/* Modal */}
            <div
                className={`relative w-full max-w-md rounded-2xl shadow-2xl my-8 ${
                    isDark ? 'bg-neutral-800 border-2 border-neutral-700' : 'bg-white'
                } animate-in zoom-in-95 duration-200`}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className={`absolute top-4 right-4 p-2 rounded-lg transition-colors z-10 ${
                        isDark
                            ? 'hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200'
                            : 'hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900'
                    }`}
                    aria-label="Fermer"
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
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                Créer un compte
                            </h2>
                            <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                Rejoignez-nous dès maintenant
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

                    {/* Nom et Prénom */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                htmlFor="firstName"
                                className={`block text-sm font-medium mb-2 ${
                                    isDark ? 'text-neutral-300' : 'text-neutral-700'
                                }`}
                            >
                                Prénom
                            </label>
                            <input
                                id="firstName"
                                name="firstName"
                                type="text"
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="Jean"
                                className={`w-full px-4 py-3 rounded-lg border-2 transition-colors ${
                                    isDark
                                        ? 'bg-neutral-700 border-neutral-600 text-white placeholder-neutral-500 focus:border-brand-primary'
                                        : 'bg-neutral-50 border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-brand-primary'
                                } focus:outline-none focus:ring-2 focus:ring-brand-primary/20`}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="lastName"
                                className={`block text-sm font-medium mb-2 ${
                                    isDark ? 'text-neutral-300' : 'text-neutral-700'
                                }`}
                            >
                                Nom
                            </label>
                            <input
                                id="lastName"
                                name="lastName"
                                type="text"
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="Dupont"
                                className={`w-full px-4 py-3 rounded-lg border-2 transition-colors ${
                                    isDark
                                        ? 'bg-neutral-700 border-neutral-600 text-white placeholder-neutral-500 focus:border-brand-primary'
                                        : 'bg-neutral-50 border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-brand-primary'
                                } focus:outline-none focus:ring-2 focus:ring-brand-primary/20`}
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label
                            htmlFor="email"
                            className={`block text-sm font-medium mb-2 ${
                                isDark ? 'text-neutral-300' : 'text-neutral-700'
                            }`}
                        >
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="votre@email.com"
                            required
                            className={`w-full px-4 py-3 rounded-lg border-2 transition-colors ${
                                isDark
                                    ? 'bg-neutral-700 border-neutral-600 text-white placeholder-neutral-500 focus:border-brand-primary'
                                    : 'bg-neutral-50 border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-brand-primary'
                            } focus:outline-none focus:ring-2 focus:ring-brand-primary/20`}
                        />
                    </div>

                    {/* Téléphone et Nationalité */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                htmlFor="phone"
                                className={`block text-sm font-medium mb-2 ${
                                    isDark ? 'text-neutral-300' : 'text-neutral-700'
                                }`}
                            >
                                Téléphone
                            </label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+33 6 12 34 56 78"
                                className={`w-full px-4 py-3 rounded-lg border-2 transition-colors ${
                                    isDark
                                        ? 'bg-neutral-700 border-neutral-600 text-white placeholder-neutral-500 focus:border-brand-primary'
                                        : 'bg-neutral-50 border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-brand-primary'
                                } focus:outline-none focus:ring-2 focus:ring-brand-primary/20`}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="nationality"
                                className={`block text-sm font-medium mb-2 ${
                                    isDark ? 'text-neutral-300' : 'text-neutral-700'
                                }`}
                            >
                                Nationalité
                            </label>
                            <input
                                id="nationality"
                                name="nationality"
                                type="text"
                                value={formData.nationality}
                                onChange={handleChange}
                                placeholder="Française"
                                className={`w-full px-4 py-3 rounded-lg border-2 transition-colors ${
                                    isDark
                                        ? 'bg-neutral-700 border-neutral-600 text-white placeholder-neutral-500 focus:border-brand-primary'
                                        : 'bg-neutral-50 border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-brand-primary'
                                } focus:outline-none focus:ring-2 focus:ring-brand-primary/20`}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label
                            htmlFor="password"
                            className={`block text-sm font-medium mb-2 ${
                                isDark ? 'text-neutral-300' : 'text-neutral-700'
                            }`}
                        >
                            Mot de passe <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                            className={`w-full px-4 py-3 rounded-lg border-2 transition-colors ${
                                isDark
                                    ? 'bg-neutral-700 border-neutral-600 text-white placeholder-neutral-500 focus:border-brand-primary'
                                    : 'bg-neutral-50 border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-brand-primary'
                            } focus:outline-none focus:ring-2 focus:ring-brand-primary/20`}
                        />
                        <p className={`mt-1 text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                            Minimum 6 caractères
                        </p>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label
                            htmlFor="confirmPassword"
                            className={`block text-sm font-medium mb-2 ${
                                isDark ? 'text-neutral-300' : 'text-neutral-700'
                            }`}
                        >
                            Confirmer le mot de passe <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                            className={`w-full px-4 py-3 rounded-lg border-2 transition-colors ${
                                isDark
                                    ? 'bg-neutral-700 border-neutral-600 text-white placeholder-neutral-500 focus:border-brand-primary'
                                    : 'bg-neutral-50 border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-brand-primary'
                            } focus:outline-none focus:ring-2 focus:ring-brand-primary/20`}
                        />
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
                                Création en cours...
                            </>
                        ) : (
                            'Créer mon compte'
                        )}
                    </Button>

                    {/* Login link */}
                    <div className={`text-center text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                        Vous avez déjà un compte ?{' '}
                        <button
                            type="button"
                            onClick={onSwitchToLogin}
                            className="text-brand-primary font-semibold hover:underline"
                        >
                            Se connecter
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default RegisterModal;
