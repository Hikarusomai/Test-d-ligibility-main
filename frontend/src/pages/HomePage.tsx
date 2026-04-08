import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../components/Button';
import { apiService } from '../services/api';

type HomePageProps = {
  onStartTest: () => void;
  isDark?: boolean;
};

function HomePage({ onStartTest, isDark = false }: HomePageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleStartTest = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Vérifier que le backend est accessible et récupérer la première question
      // Utiliser getQuestionByOrder au lieu de getQuestion
      await apiService.getQuestionByOrder(1);
      
      // Si succès, démarrer le test
      onStartTest();
    } catch (err) {
      console.error('Erreur lors de la connexion au backend:', err);
      setError('Impossible de se connecter au serveur. Veuillez vérifier que le backend est démarré et réessayer.');
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${
      isDark ? 'bg-neutral-900' : 'bg-neutral-50'
    } pt-32 pb-12 px-4 sm:px-6 lg:px-8`}>
      <div className="max-w-7xl mx-auto">
        {/* Hero Section avec Mascotte à GAUCHE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center mb-12">
          {/* Colonne GAUCHE - Image de la mascotte */}
          <div className="order-2 md:order-1 flex justify-center md:justify-start">
            <img 
              src="/assets/mascot.png" 
              alt="Mascotte étudiante" 
              className="w-full max-w-[300px] md:max-w-[400px] h-auto animate-fade-in"
            />
          </div>
          
          {/* Colonne DROITE - Texte */}
          <div className="order-1 md:order-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary/10 rounded-full mb-4">
              <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm font-semibold text-brand-primary">{t('home.badge')}</span>
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-white mb-4 font-heading">
              {t('home.heroTitle')}
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-6">
              {t('home.heroSubtitle')}
            </p>

            {/* Message d'erreur */}
            {error && (
              <div className={`mb-6 rounded-xl border-2 p-4 ${
                isDark ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-800 dark:text-red-200 mb-1">
                      {t('home.connectionError')}
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {error || t('home.connectionErrorMsg')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bouton Commencer */}
            <div className="flex justify-center md:justify-start">
              <Button
                onClick={handleStartTest}
                variant="primary"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('home.connecting')}
                  </>
                ) : (
                  t('home.startTest')
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white dark:bg-neutral-800 rounded-xl shadow-md">
            <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
              {t('home.feature1Title')}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              {t('home.feature1Desc')}
            </p>
          </div>

          <div className="text-center p-6 bg-white dark:bg-neutral-800 rounded-xl shadow-md">
            <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
              {t('home.feature2Title')}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              {t('home.feature2Desc')}
            </p>
          </div>

          <div className="text-center p-6 bg-white dark:bg-neutral-800 rounded-xl shadow-md">
            <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
              {t('home.feature3Title')}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              {t('home.feature3Desc')}
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-2xl p-8 text-center text-white shadow-xl">
          <h2 className="text-3xl font-bold mb-4">
            {t('home.ctaTitle')}
          </h2>
          <p className="text-lg text-white/90 mb-6">
            {t('home.ctaSubtitle')}
          </p>
          <div className="flex items-center justify-center gap-6 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>{t('home.confidential')}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{t('home.fast')}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{t('home.instantResults')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
