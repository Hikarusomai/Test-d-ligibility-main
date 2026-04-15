import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Button from './Button';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import { apiService, type User } from '../services/api';

type HeaderProps = {
    isDark?: boolean;
    onToggleTheme?: () => void;
    onNavigateToDashboard?: () => void;
    onNavigateToAdmin?: () => void;
    onNavigateToHome?: () => void;
    user?: User | null;
    onLoginSuccess?: (user: User) => void;
    onRegisterSuccess?: (user: User) => void;
    onLogout?: () => void;
};

function Header({
                    isDark = false,
                    onToggleTheme,
                    onNavigateToDashboard,
                    onNavigateToAdmin,
                    onNavigateToHome,
                    user: userProp,
                    onLoginSuccess,
                    onRegisterSuccess,
                    onLogout
                }: HeaderProps) {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [userState, setUserState] = useState<User | null>(null);
    const user = userProp !== undefined ? userProp : userState;
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { i18n, t } = useTranslation();
    const currentLang = i18n.language || 'fr';

    const toggleLanguage = async () => {
        const newLang = currentLang === 'fr' ? 'en' : 'fr';
        await i18n.changeLanguage(newLang);
        localStorage.setItem('i18nextLng', newLang);
        window.location.reload();
    };

    useEffect(() => {
        if (userProp === undefined) {
            const storedUser = apiService.getStoredUser();
            if (storedUser) {
                setUserState(storedUser);
            }
        }
    }, [userProp]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    const handleLoginSuccess = (userData: User) => {
        if (onLoginSuccess) {
            onLoginSuccess(userData);
        } else {
            setUserState(userData);
            window.location.reload();
        }
        setIsLoginModalOpen(false);
    };

    const handleRegisterSuccess = (userData: User) => {
        if (onRegisterSuccess) {
            onRegisterSuccess(userData);
        } else {
            setUserState(userData);
            window.location.reload();
        }
        setIsRegisterModalOpen(false);
    };

    const handleLogout = () => {
        apiService.logout();
        if (onLogout) {
            onLogout();
        } else {
            setUserState(null);
            window.location.reload();
        }
        setIsMenuOpen(false);
    };

    const handleLogoClick = () => {
        if (onNavigateToHome) {
            onNavigateToHome();
        } else {
            // Par défaut, recharger la page pour retourner à l'accueil
            window.location.href = '/';
        }
    };

    const getUserDisplayName = () => {
        if (!user) return '';
        if (user.firstName && user.lastName) {
            return `${user.firstName} ${user.lastName}`;
        }
        if (user.firstName) return user.firstName;
        if (user.lastName) return user.lastName;
        return user.email.split('@')[0];
    };

    return (
        <>
            <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b ${
                isDark
                    ? 'bg-neutral-900/80 border-neutral-800'
                    : 'bg-white/95 border-neutral-200'
            }`}>
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex justify-between items-center gap-4">
                    {/* Logo - Maintenant cliquable */}
                    <button
                        onClick={handleLogoClick}
                        className={`flex items-center gap-3 transition-opacity hover:opacity-80 ${
                            isDark ? 'text-white' : 'text-neutral-900'
                        }`}
                    >
                        <img
                            src="https://i.ibb.co/9KF0gZW/mms-Logo.png"
                            alt="MMS Logo"
                            className="h-10 w-auto object-contain"
                        />
                        <div className="text-left">
                            <h1 className="text-lg font-bold font-heading leading-tight">
                                {t('header.eligibilityTest')}
                            </h1>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                {t('header.studentVISA')}
                            </p>
                        </div>
                    </button>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        {/* Theme Toggle */}
                        {onToggleTheme && (
                            <button
                                onClick={onToggleTheme}
                                className="p-2.5 rounded-lg bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-all"
                            >
                                {isDark ? '☀️' : '🌙'}
                            </button>
                        )}

                        <button
                            onClick={toggleLanguage}
                            className="p-2.5 rounded-lg bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-all text-sm font-bold"
                            title={currentLang === 'fr' ? 'Switch to English' : 'Passer en français'}
                        >
                            {currentLang === 'fr' ? 'EN' : 'FR'}
                        </button>

                        {/* User Menu */}
                        {user ? (
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                                        isDark
                                            ? 'hover:bg-neutral-800'
                                            : 'hover:bg-neutral-100'
                                    }`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center">
                                        <span className="text-white text-sm font-bold">
                                            {user.firstName ? user.firstName[0].toUpperCase() : user.email[0].toUpperCase()}
                                        </span>
                                    </div>
                                    <span className={`text-sm font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                        {getUserDisplayName()}
                                    </span>
                                    <svg className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''} ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Dropdown Menu */}
                                {isMenuOpen && (
                                    <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border-2 overflow-hidden ${
                                        isDark
                                            ? 'bg-neutral-800 border-neutral-700'
                                            : 'bg-white border-neutral-200'
                                    }`}>
                                        {/* Admin Dashboard - Only for admins */}
                                        {user.role === 'admin' && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setIsMenuOpen(false);
                                                        if (onNavigateToAdmin) onNavigateToAdmin();
                                                    }}
                                                    className={`w-full text-left px-4 py-3 transition-colors flex items-center gap-2 ${
                                                        isDark
                                                            ? 'hover:bg-neutral-700 text-neutral-200'
                                                            : 'hover:bg-neutral-50 text-neutral-900'
                                                    }`}
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    {t('nav.adminDashboard')}
                                                </button>
                                                <hr className={isDark ? 'border-neutral-700' : 'border-neutral-200'} />
                                            </>
                                        )}

                                        {/* User Dashboard */}
                                        <button
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                if (onNavigateToDashboard) onNavigateToDashboard();
                                            }}
                                            className={`w-full text-left px-4 py-3 transition-colors flex items-center gap-2 ${
                                                isDark
                                                    ? 'hover:bg-neutral-700 text-neutral-200'
                                                    : 'hover:bg-neutral-50 text-neutral-900'
                                            }`}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                            </svg>
                                            {t('nav.dashboard')}
                                        </button>

                                        <hr className={isDark ? 'border-neutral-700' : 'border-neutral-200'} />

                                        {/* Logout */}
                                        <button
                                            onClick={handleLogout}
                                            className={`w-full text-left px-4 py-3 transition-colors flex items-center gap-2 text-red-600 dark:text-red-400 ${
                                                isDark
                                                    ? 'hover:bg-neutral-700'
                                                    : 'hover:bg-red-50'
                                            }`}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            {t('nav.logout')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Button
                                onClick={() => setIsLoginModalOpen(true)}
                                size="md"
                                variant="primary"
                            >
                                {t('nav.login')}
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            {/* Modals */}
            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
                onLoginSuccess={handleLoginSuccess}
                onSwitchToRegister={() => {
                    setIsLoginModalOpen(false);
                    setIsRegisterModalOpen(true);
                }}
                isDark={isDark}
            />

            <RegisterModal
                isOpen={isRegisterModalOpen}
                onClose={() => setIsRegisterModalOpen(false)}
                onRegisterSuccess={handleRegisterSuccess}
                onSwitchToLogin={() => {
                    setIsRegisterModalOpen(false);
                    setIsLoginModalOpen(true);
                }}
                isDark={isDark}
            />
        </>
    );
}

export default Header;
