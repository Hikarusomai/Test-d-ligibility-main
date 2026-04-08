import React from 'react';

type MascotHeroProps = {
  subtitle?: string;
  title?: React.ReactNode;
  ctaText?: string;
  onCta?: () => void;
  isDark?: boolean;
};

export default function MascotHero({
  subtitle = "Étape 1/3 - Pays d'origine",
  title = <>Testez votre éligibilité au <span className="text-brand-primary">VISA Étudiant</span></>,
  ctaText = "Commencer",
  onCta,
  isDark = false
}: MascotHeroProps) {
  return (
    <section className={`pt-20 pb-16 ${isDark ? 'bg-neutral-900' : 'bg-neutral-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-8">
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-brand-primary/10 mb-4">
            <svg className="w-5 h-5 text-brand-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7l6 6-6 6" />
            </svg>
            <span className="text-sm font-medium text-brand-primary">{subtitle}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-neutral-900 dark:text-white mb-4">
            {title}
          </h1>

          <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto lg:mx-0 mb-6">
            Selon votre pays d'origine, découvrez si vous êtes éligible pour étudier à l'étranger
          </p>

          <div className="flex items-center justify-center lg:justify-start gap-4">
            <button
              onClick={onCta}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-brand-primary text-white font-semibold shadow hover:brightness-95 transition"
            >
              {ctaText}
            </button>
          </div>
        </div>

        <div className="w-56 h-56 sm:w-72 sm:h-72 lg:w-96 lg:h-96 flex-shrink-0 flex items-center justify-center">
          <img
            src="/assets/mascot.png"
            alt="Mascotte - Visa Étudiant"
            className="w-full h-full object-contain drop-shadow-lg"
            onError={(e) => {
              const el = e.currentTarget as HTMLImageElement;
              el.style.display = 'none';
            }}
          />
        </div>
      </div>
    </section>
  );
}
