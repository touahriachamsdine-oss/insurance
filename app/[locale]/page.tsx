import { useTranslations } from 'next-intl';
import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import PremiumCalculator from '@/components/PremiumCalculator';

export default function LandingPage() {
  const tCommon = useTranslations('common');
  const tAuth = useTranslations('auth');

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {/* Background blobs for premium look */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-700/20 dark:bg-emerald-900/25 blur-[120px] animate-float pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/15 dark:bg-emerald-900/20 blur-[120px] animate-drift pointer-events-none" />
      <div className="absolute top-1/2 right-[-5%] w-[35%] h-[35%] rounded-full bg-zinc-200/30 dark:bg-zinc-800/40 blur-[120px] animate-float pointer-events-none" />
      <div className="absolute left-6 top-1/3 w-14 h-14 rounded-full bg-zinc-200/20 dark:bg-zinc-800/30 shadow-[0_0_60px_10px_rgba(0,0,0,0.18)] animate-drift pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#DCCFC0]/70 dark:border-zinc-900 bg-white/80 dark:bg-zinc-950/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 dark:bg-emerald-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-emerald-700/20">
              ض
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-950 dark:text-white">
              {tCommon('appName')}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:text-emerald-700 dark:hover:text-emerald-300 transition"
            >
              {tAuth('login')}
            </Link>
            <Link
              href="/register"
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-700 rounded-full hover:shadow-lg hover:shadow-emerald-700/20 active:scale-95 transition duration-200"
            >
              {tAuth('signUp')}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 z-10">
        <div className="max-w-7xl w-full mx-auto px-6 py-12 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 flex flex-col items-start space-y-6 text-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#A1BC98]/40 bg-[#A1BC98]/10 text-[#4d664f] dark:border-[#A1BC98]/30 dark:bg-[#A1BC98]/10 dark:text-[#c4d3bc] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#778873] animate-pulse" />
              {tCommon('heroBeta')}
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-zinc-950 dark:text-white leading-[1.15] sm:leading-[1.15]">
              {tCommon('appName')}{' '}
              <span className="text-emerald-700 dark:text-emerald-300">
                {tCommon('tagline')}
              </span>
            </h1>
            
            <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
              {tCommon('heroSubtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link
                href="/login"
                className="px-8 py-3.5 text-center text-base font-bold text-white bg-emerald-700 rounded-xl shadow-lg shadow-emerald-700/20 active:scale-95 transition duration-200"
              >
                {tCommon('heroClientButton')}
              </Link>
              <Link
                href="/login"
                className="px-8 py-3.5 text-center text-base font-bold text-zinc-950 bg-zinc-200 border border-zinc-300 rounded-xl hover:bg-zinc-300 transition duration-200"
              >
                {tCommon('heroPartnerButton')}
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 relative w-full aspect-square max-w-[450px] mx-auto lg:max-w-none">
            {/* Visual Abstract Widget Box */}
            <div className="absolute inset-0 bg-emerald-100/30 dark:bg-emerald-900/20 rounded-3xl blur-2xl pointer-events-none animate-float" />
            <div className="relative w-full h-full bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 backdrop-blur-xl rounded-3xl shadow-2xl p-8 flex flex-col justify-between overflow-hidden">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#556651] uppercase tracking-widest">{tCommon('platformName')}</span>
                <span className="w-4 h-4 rounded-full bg-[#A1BC98] animate-pulse" />
              </div>

              {/* Mock UI Graphic */}
              <div className="my-auto space-y-6">
                <div className="space-y-2">
                  <div className="h-4 w-1/3 bg-[#DCCFC0] dark:bg-zinc-800 rounded" />
                  <div className="h-8 w-2/3 bg-[#C9D5B5] dark:bg-zinc-700 rounded-lg animate-pulse" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-16 bg-emerald-100/30 dark:bg-zinc-800/40 rounded-xl p-3 flex flex-col justify-between shadow-sm shadow-zinc-900/10">
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{tCommon('activeContracts')}</span>
                    <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">1,482</span>
                  </div>
                  <div className="h-16 bg-zinc-200/30 dark:bg-zinc-800/40 rounded-xl p-3 flex flex-col justify-between shadow-sm shadow-zinc-900/10">
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{tCommon('processedClaims')}</span>
                    <span className="text-lg font-bold text-emerald-500 dark:text-emerald-300">98.4%</span>
                  </div>
                </div>
                <div className="h-12 bg-[#DCCFC0]/30 dark:bg-zinc-800/40 rounded-xl flex items-center px-4 justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#A1BC98]/20 flex items-center justify-center text-[10px] text-[#778873] font-bold">✓</div>
                    <span className="text-xs font-medium text-[#4d664f]">{tCommon('activeCarContract')}</span>
                  </div>
                  <span className="text-xs text-[#6f7b67]">{tCommon('recentUpdate')}</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-[#6f7b67]">
                <span>{tCommon('autoUpdateLabel')}</span>
                <span className="font-semibold text-[#556651]">{tCommon('secureLabel')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Premium Estimator Section */}
      <PremiumCalculator />

      {/* Feature Grid & Details */}
      <div className="max-w-7xl w-full mx-auto px-6 pb-24 sm:pb-32">
          {/* Feature Grid */}
          <div className="mt-16 sm:mt-24">
          <div className="text-center space-y-4 max-w-xl mx-auto mb-16">
            <h2 className="text-3xl font-black text-zinc-950 dark:text-white">
              {tCommon('insuranceCompaniesTitle')}
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              {tCommon('insuranceCompaniesSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { key: 'caar', logo: 'CAAR', name: 'الجزائرية للتأمين وإعادة التأمين', color: '#778873' },
              { key: 'saif', logo: 'سيف', name: 'سيف للتأمين', color: '#A1BC98' },
              { key: 'star', logo: 'STAR', name: 'ستار للتأمين', color: '#DCCFC0' },
              { key: 'mamda', logo: 'MAMDA', name: 'م.م.د.ا للتأمين الزراعي', color: '#FDF6ED' },
              { key: 'aig', logo: 'AIG', name: 'AIG الجزائر', color: '#778873' },
            ].map((cat) => (
              <div
                key={cat.key}
                className="group relative bg-[#FDF6ED] dark:bg-zinc-900 border border-[#DCCFC0]/60 dark:border-zinc-800/60 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md dark:hover:border-zinc-700 transition duration-300 overflow-hidden"
              >
                <div style={{ background: cat.color }} className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-sm mb-4 group-hover:scale-110 transition duration-300">
                  {cat.logo}
                </div>
                <h3 className="font-bold text-[#33452e] dark:text-white text-sm">
                  {cat.name}
                </h3>
                <span className="text-[11px] text-[#6f7b67] dark:text-zinc-500 mt-2 block">
                  {tCommon('companyBadgeLabel')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Why choose us */}
        <section className="mt-24 sm:mt-32">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr] items-start">
              <div className="space-y-6">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/40 bg-emerald-100/40 px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">{tCommon('whySectionTitle')}</span>
                <div className="space-y-3">
                  <h2 className="text-3xl font-black text-zinc-950 dark:text-white">{tCommon('whyHeading')}</h2>
                  <p className="max-w-2xl text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {tCommon('whySubtitle')}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-zinc-200/70 bg-white/90 dark:bg-zinc-900 p-6 shadow-sm shadow-zinc-900/10 animate-fadeIn">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100/30 text-emerald-700 text-xl font-bold">✓</div>
                    <h3 className="mt-4 text-lg font-semibold text-zinc-950 dark:text-white">{tCommon('feature1Title')}</h3>
                    <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{tCommon('feature1Desc')}</p>
                  </div>
                  <div className="rounded-3xl border border-zinc-200/70 bg-white/90 dark:bg-zinc-900 p-6 shadow-sm shadow-zinc-900/10 animate-fadeIn">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-200/30 text-zinc-950 text-xl font-bold">★</div>
                    <h3 className="mt-4 text-lg font-semibold text-zinc-950 dark:text-white">{tCommon('feature2Title')}</h3>
                    <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{tCommon('feature2Desc')}</p>
                  </div>
                  <div className="rounded-3xl border border-zinc-200/70 bg-white/90 dark:bg-zinc-900 p-6 shadow-sm shadow-zinc-900/10 animate-fadeIn">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-200/30 text-emerald-700 text-xl font-bold">⏱</div>
                    <h3 className="mt-4 text-lg font-semibold text-zinc-950 dark:text-white">{tCommon('feature3Title')}</h3>
                    <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{tCommon('feature3Desc')}</p>
                  </div>
                  <div className="rounded-3xl border border-zinc-200/70 bg-white/90 dark:bg-zinc-900 p-6 shadow-sm shadow-zinc-900/10 animate-fadeIn">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100/30 text-zinc-950 text-xl font-bold">🤝</div>
                    <h3 className="mt-4 text-lg font-semibold text-zinc-950 dark:text-white">{tCommon('feature4Title')}</h3>
                    <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{tCommon('feature4Desc')}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[2rem] bg-[#778873]/10 border border-[#A1BC98]/30 p-6 shadow-lg shadow-[#778873]/10">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">{tCommon('testimonialsLabel')}</span>
                    <h3 className="mt-4 text-2xl font-semibold text-zinc-950 dark:text-white">{tCommon('testimonialsHeading')}</h3>
                  </div>
                  <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">{tCommon('trustedBadge')}</span>
                </div>
                <div className="mt-6 space-y-4">
                  <div className="rounded-3xl bg-white dark:bg-zinc-900 p-5 shadow-sm shadow-zinc-900/10">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-zinc-950 dark:text-white">{tCommon('client1Name')}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{tCommon('client1Role')}</p>
                      </div>
                      <div className="text-sm font-semibold text-emerald-600">★★★★★</div>
                    </div>
                    <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">{tCommon('client1Quote')}</p>
                  </div>
                  <div className="rounded-3xl bg-white dark:bg-zinc-900 p-5 shadow-sm shadow-zinc-900/10">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-zinc-950 dark:text-white">{tCommon('client2Name')}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{tCommon('client2Role')}</p>
                      </div>
                      <div className="text-sm font-semibold text-emerald-700">★★★★☆</div>
                    </div>
                    <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">{tCommon('client2Quote')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/70 py-8 bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-600 dark:text-zinc-400">
          <span>&copy; {new Date().getFullYear()} {tCommon('appName')}. جميع الحقوق محفوظة لجمهورية الجزائر الديمقراطية الشعبية.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-emerald-700 transition">{tCommon('termsAndConditions')}</a>
            <a href="#" className="hover:text-emerald-700 transition">{tCommon('privacyPolicy')}</a>
            <a href="#" className="hover:text-emerald-700 transition">{tCommon('contactUs')}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
