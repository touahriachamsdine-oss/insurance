import { useTranslations } from 'next-intl';
import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeSwitcher from '@/components/ThemeSwitcher';

export default function LandingPage() {
  const tCommon = useTranslations('common');
  const tAuth = useTranslations('auth');
  const tInsurance = useTranslations('insurance');

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {/* Background blobs for premium look */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-100 dark:border-zinc-900 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-emerald-500/20">
              ض
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {tCommon('appName')}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
            >
              {tAuth('login')}
            </Link>
            <Link
              href="/register"
              className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition duration-200"
            >
              {tAuth('signUp')}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center max-w-7xl w-full mx-auto px-6 py-12 md:py-24 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 flex flex-col items-start space-y-6 text-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-950/40 bg-emerald-50/50 dark:bg-emerald-950/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              النسخة التجريبية الأولى | Private Beta
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-zinc-900 dark:text-white leading-[1.15] sm:leading-[1.15]">
              {tCommon('appName')}{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                {tCommon('tagline')}
              </span>
            </h1>
            
            <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
              منصة رقمية موحدة تجمع المؤمن لهم وشركات التأمين الجزائرية. تتبع عقودك، قدم مطالبات الحوادث، ووفر التغطية الكاملة لعائلتك أو لشركتك بذكاء وأمان.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link
                href="/login"
                className="px-8 py-3.5 text-center text-base font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:shadow-xl hover:shadow-emerald-500/10 active:scale-95 transition duration-200"
              >
                دخول بوابة المؤمن لهم
              </Link>
              <Link
                href="/login"
                className="px-8 py-3.5 text-center text-base font-bold text-zinc-900 dark:text-white bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition duration-200"
              >
                بوابة الشركاء والشركات
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 relative w-full aspect-square max-w-[450px] mx-auto lg:max-w-none">
            {/* Visual Abstract Widget Box */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/20 to-teal-600/20 rounded-3xl blur-2xl pointer-events-none" />
            <div className="relative w-full h-full bg-white dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 backdrop-blur-xl rounded-3xl shadow-2xl p-8 flex flex-col justify-between overflow-hidden">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Daman Platform</span>
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>

              {/* Mock UI Graphic */}
              <div className="my-auto space-y-6">
                <div className="space-y-2">
                  <div className="h-4 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-8 w-2/3 bg-zinc-300 dark:bg-zinc-700 rounded-lg animate-pulse" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-16 bg-zinc-100 dark:bg-zinc-800/40 rounded-xl p-3 flex flex-col justify-between">
                    <span className="text-[10px] text-zinc-400">العقود النشطة</span>
                    <span className="text-lg font-bold text-emerald-600">1,482</span>
                  </div>
                  <div className="h-16 bg-zinc-100 dark:bg-zinc-800/40 rounded-xl p-3 flex flex-col justify-between">
                    <span className="text-[10px] text-zinc-400">التعويضات المعالجة</span>
                    <span className="text-lg font-bold text-teal-600">98.4%</span>
                  </div>
                </div>
                <div className="h-12 bg-zinc-100 dark:bg-zinc-800/40 rounded-xl flex items-center px-4 justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] text-emerald-600 font-bold">✓</div>
                    <span className="text-xs font-medium">عقد تأمين سيارات نشط</span>
                  </div>
                  <span className="text-xs text-zinc-400">منذ يومين</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-zinc-400">
                <span>تحديث تلقائي</span>
                <span className="font-semibold text-zinc-500">100% Secure</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-24 sm:mt-32">
          <div className="text-center space-y-4 max-w-xl mx-auto mb-16">
            <h2 className="text-3xl font-black text-zinc-900 dark:text-white">
              خدمات تأمين شاملة لجميع الاحتياجات
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              نوفر واجهة تفاعلية سهلة الاستخدام للتحكم بجميع فئات التأمين وإدارتها في مكان واحد
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { key: 'car', icon: '🚗', color: 'from-blue-500 to-indigo-500' },
              { key: 'home', icon: '🏠', color: 'from-orange-500 to-amber-500' },
              { key: 'health', icon: '❤️', color: 'from-rose-500 to-pink-500' },
              { key: 'life', icon: '🛡️', color: 'from-purple-500 to-violet-500' },
              { key: 'agriculture', icon: '🌾', color: 'from-emerald-500 to-green-500' },
            ].map((cat) => (
              <div
                key={cat.key}
                className="group relative bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md dark:hover:border-zinc-700 transition duration-300 overflow-hidden"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${cat.color} flex items-center justify-center text-2xl text-white shadow-sm mb-4 group-hover:scale-110 transition duration-300`}>
                  {cat.icon}
                </div>
                <h3 className="font-bold text-zinc-900 dark:text-white text-sm">
                  {tInsurance(`categories.${cat.key}`)}
                </h3>
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2 block">
                  طلب عرض أسعار وإدارة
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/60 dark:border-zinc-900 py-8 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-500 dark:text-zinc-400">
          <span>&copy; {new Date().getFullYear()} {tCommon('appName')}. جميع الحقوق محفوظة لجمهورية الجزائر الديمقراطية الشعبية.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-emerald-600 transition">الشروط والأحكام</a>
            <a href="#" className="hover:text-emerald-600 transition">سياسة الخصوصية</a>
            <a href="#" className="hover:text-emerald-600 transition">اتصل بنا</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
