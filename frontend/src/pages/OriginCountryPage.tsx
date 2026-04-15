import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import CountrySelection from '../components/CountrySelection';
import Button from '../components/Button';
import { apiService, type Question } from '../services/api';

type OriginCountryPageProps = {
  onOriginSelect: (country: string) => void;
  onBack: () => void;
  isDark?: boolean;
  totalQuestions?: number;
};

function OriginCountryPage({ onOriginSelect, onBack, isDark = false, totalQuestions = 20 }: OriginCountryPageProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';

  useEffect(() => {
    fetchFirstQuestion();
  }, []);

const fetchFirstQuestion = async () => {
    setIsLoading(true);
    setError(null);
    try {
        const data = await apiService.getQuestionByOrder(1);
        setQuestion(data);
        setIsLoading(false);
    } catch (err) {
        setError(t('originCountry.errorLoading'));
        setIsLoading(false);
    }
};

  const handleCountrySelect = (country: string) => {
    setIsExiting(true);
    setTimeout(() => {
      onOriginSelect(country);
    }, 700);
  };

  const questionTitle = (isEn && question?.labelEn) ? question.labelEn : (question?.label || question?.text || '');
  const questionDescription = (isEn && question?.descriptionEn) ? question.descriptionEn : (question?.description || '');
  const currentQuestionOrder = question?.order || 1;
  const progressPercentage = Math.round((currentQuestionOrder / totalQuestions) * 100);

  return (
    <div className={`min-h-screen ${
      isDark ? 'bg-neutral-900' : 'bg-neutral-50'
    } overflow-hidden`}>
      
      <div className={`min-h-screen transition-transform duration-700 ease-in-out ${
        isExiting ? '-translate-x-full' : 'translate-x-0'
      } pt-24 pb-12 px-4 sm:px-6 lg:px-8`}>
        <div className="max-w-7xl mx-auto">
          
          {/* Back Button */}
          <div className="mb-6">
            <Button
              onClick={onBack}
              variant="ghost"
              size="sm"
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t('quiz.backButton')}
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {t('quiz.questionProgress', { current: currentQuestionOrder, total: totalQuestions })}
              </span>
              <span className="text-sm font-medium text-brand-primary">
                {progressPercentage}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-primary rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mb-4"></div>
              <p className="text-neutral-600 dark:text-neutral-400">
                {t('common.loadingQuestion')}
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className={`rounded-xl border-2 p-6 mb-8 ${
              isDark ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800 dark:text-red-200 mb-1">{t('quiz.error')}</h3>
                  <p className="text-red-700 dark:text-red-300 mb-3">{error}</p>
                  <div className="flex gap-3">
                    <Button
                      onClick={fetchFirstQuestion}
                      variant="outline"
                      size="sm"
                    >
                      {t('common.retry')}
                    </Button>
                    <Button
                      onClick={onBack}
                      variant="ghost"
                      size="sm"
                    >
                      {t('quiz.returnHome')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Question Title */}
          {question && questionTitle && (
            <div className="mb-8 text-center">
              <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 dark:text-white mb-3">
                {questionTitle}
              </h2>
              {questionDescription && (
                <p className="text-lg text-neutral-600 dark:text-neutral-400">
                  {questionDescription}
                </p>
              )}
            </div>
          )}

          {/* Country Selection Component */}
          {!error && question && (
            <CountrySelection onOriginSelect={handleCountrySelect} isDark={isDark} />
          )}
          
        </div>
      </div>
    </div>
  );
}

export default OriginCountryPage;
