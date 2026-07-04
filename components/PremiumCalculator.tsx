'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';

// Simple translation dictionary for localized text
const dict = {
  en: {
    title: 'Interactive Premium Estimator',
    subtitle: 'Get an instant, customized quote for your insurance needs based on Algerian regulations and standards.',
    categoryLabel: 'Insurance Category',
    planLabel: 'Coverage Level',
    monthly: 'Estimated Monthly',
    annual: 'Estimated Annual',
    applyBtn: 'Proceed to Application',
    currency: 'DZD',
    basicName: 'Third-Party / Essential',
    basicDesc: 'Mandatory coverage under Algerian law (Responsabilité Civile), fire and basic assistance.',
    standardName: 'Standard / Safe',
    standardDesc: 'Includes Third-Party plus glass breakage, theft, fire, and collision coverage.',
    premiumName: 'Comprehensive / Gold',
    premiumDesc: 'All-Risk (Tous Risques) coverage including natural disasters, towing, and zero deductible.',
    categories: {
      car: 'Automobile Insurance',
      home: 'Home Insurance',
      health: 'Health Insurance',
      life: 'Life Insurance',
      agriculture: 'Agricultural Insurance'
    },
    
    // Auto fields
    vehicleValue: 'Estimated Vehicle Value',
    mfgYear: 'Manufacturing Year',
    enginePower: 'Engine Power',
    useCase: 'Usage Type',
    personal: 'Personal / Family',
    commercial: 'Commercial / Business',
    hp: 'HP (Fiscal)',
    
    // Home fields
    propertyValue: 'Estimated Property Value',
    propertyType: 'Property Type',
    apartment: 'Apartment',
    villa: 'Villa',
    constructionYear: 'Year of Construction',
    earthquakeZone: 'High Seismic Risk Zone (e.g. Algiers, Chlef, Boumerdes)',
    yes: 'Yes',
    no: 'No',
    
    // Health fields
    age: 'Age of Primary Insured',
    preExisting: 'Pre-existing Medical Conditions',
    planScope: 'Coverage Scope',
    individual: 'Individual',
    family: 'Family (Spouse + Children)',
    
    // Life fields
    coverageAmount: 'Desired Capital Payout',
    term: 'Policy Term',
    years: 'years',
    
    // Agriculture fields
    landSize: 'Farm Land Size',
    hectares: 'Hectares',
    agriType: 'Agricultural Focus',
    crops: 'Crops & Grain',
    livestock: 'Livestock & Poultry',
    equipment: 'Machinery & Greenhouses',
    droughtZone: 'High Drought Risk Area (Steppe/South)'
  },
  fr: {
    title: 'Estimateur de Prime Interactif',
    subtitle: 'Obtenez un devis personnalisé instantané selon les normes et réglementations algériennes.',
    categoryLabel: 'Catégorie d\'assurance',
    planLabel: 'Niveau de couverture',
    monthly: 'Estimation Mensuelle',
    annual: 'Estimation Annuelle',
    applyBtn: 'Procéder à l\'inscription',
    currency: 'DA',
    basicName: 'Tiers / Essentiel',
    basicDesc: 'Couverture minimale obligatoire en Algérie (Responsabilité Civile), incendie et assistance.',
    standardName: 'Standard / Sécurité',
    standardDesc: 'Inclut la RC, le bris de glace, le vol, l\'incendie et les collisions partielles.',
    premiumName: 'Tous Risques / Or',
    premiumDesc: 'Couverture complète y compris catastrophes naturelles, remorquage étendu et franchise zéro.',
    categories: {
      car: 'Assurance Automobile',
      home: 'Assurance Habitation',
      health: 'Assurance Santé',
      life: 'Assurance Vie',
      agriculture: 'Assurance Agricole'
    },
    
    // Auto fields
    vehicleValue: 'Valeur estimée du véhicule',
    mfgYear: 'Année de fabrication',
    enginePower: 'Puissance fiscale',
    useCase: 'Type d\'utilisation',
    personal: 'Personnel / Familial',
    commercial: 'Commercial / Professionnel',
    hp: 'CV',
    
    // Home fields
    propertyValue: 'Valeur estimée du bien',
    propertyType: 'Type de propriété',
    apartment: 'Appartement',
    villa: 'Villa',
    constructionYear: 'Année de construction',
    earthquakeZone: 'Zone à fort risque sismique (ex: Alger, Chlef, Boumerdès)',
    yes: 'Oui',
    no: 'Non',
    
    // Health fields
    age: 'Âge de l\'assuré principal',
    preExisting: 'Conditions médicales préexistantes',
    planScope: 'Portée de la formule',
    individual: 'Individuel',
    family: 'Familial (Conjoint + Enfants)',
    
    // Life fields
    coverageAmount: 'Capital décès souhaité',
    term: 'Durée du contrat',
    years: 'ans',
    
    // Agriculture fields
    landSize: 'Superficie agricole',
    hectares: 'Hectares',
    agriType: 'Type d\'activité',
    crops: 'Grandes cultures & Céréales',
    livestock: 'Élevage & Cheptel',
    equipment: 'Matériel & Serres',
    droughtZone: 'Zone à fort risque de sécheresse (Hauts Plateaux/Sud)'
  },
  ar: {
    title: 'مقيّس الأقساط التفاعلي',
    subtitle: 'احصل على تقدير فوري ومخصص لقسط التأمين الخاص بك وفقًا للقوانين والمعايير الجزائرية.',
    categoryLabel: 'فئة التأمين',
    planLabel: 'مستوى التغطية',
    monthly: 'القسط الشهري التقديري',
    annual: 'القسط السنوي التقديري',
    applyBtn: 'الذهاب للتسجيل والطلب',
    currency: 'د.ج',
    basicName: 'مسؤولية مدنية / أساسي',
    basicDesc: 'التغطية الإلزامية بموجب القانون الجزائري (المسؤولية المدنية)، بالإضافة إلى الحريق والمساعدة الأساسية.',
    standardName: 'تأمين عادي / أمان',
    standardDesc: 'يشمل المسؤولية المدنية بالإضافة إلى كسر الزجاج، السرقة، الحريق، وحوادث الاصطدام الجزئي.',
    premiumName: 'شامل / ذهبي',
    premiumDesc: 'تغطية شاملة لكل الأخطار (Tous Risques) بما في ذلك الكوارث الطبيعية، سحب المركبة الموسّع وبدون إعفاء.',
    categories: {
      car: 'التأمين على السيارات',
      home: 'التأمين على السكن',
      health: 'التأمين الصحي',
      life: 'التأمين على الحياة',
      agriculture: 'التأمين الفلاحي'
    },
    
    // Auto fields
    vehicleValue: 'القيمة التقديرية للمركبة',
    mfgYear: 'سنة الصنع',
    enginePower: 'القوة الجبائية للمحرك',
    useCase: 'نوع الاستخدام',
    personal: 'شخصي / عائلي',
    commercial: 'تجاري / مهني',
    hp: 'حصان',
    
    // Home fields
    propertyValue: 'القيمة التقديرية للعقار',
    propertyType: 'نوع العقار',
    apartment: 'شقة',
    villa: 'فيلا',
    constructionYear: 'سنة البناء',
    earthquakeZone: 'منطقة ذات مخاطر زلزالية عالية (مثل الجزائر، الشلف، بومرداس)',
    yes: 'نعم',
    no: 'لا',
    
    // Health fields
    age: 'عمر المؤمن عليه الرئيسي',
    preExisting: 'سوابق مرضية / حالة صحية خاصة',
    planScope: 'نطاق التأمين',
    individual: 'فردي',
    family: 'عائلي (الزوج + الأطفال)',
    
    // Life fields
    coverageAmount: 'رأس المال المطلوب في حالة الوفاة',
    term: 'مدة العقد',
    years: 'سنة',
    
    // Agriculture fields
    landSize: 'مساحة الأرض الزراعية',
    hectares: 'هكتار',
    agriType: 'النشاط الزراعي الرئيسي',
    crops: 'زراعة الحبوب والمحاصيل',
    livestock: 'تربية المواشي والدواجن',
    equipment: 'الآلات الزراعية والبيوت البلاستيكية',
    droughtZone: 'منطقة معرضة للجفاف (الهضاب العليا / الجنوب)'
  }
};

type LocaleKey = 'en' | 'fr' | 'ar';

export default function PremiumCalculator() {
  const locale = useLocale() as LocaleKey;
  const t = dict[locale] || dict.en;

  const [category, setCategory] = useState<'car' | 'home' | 'health' | 'life' | 'agriculture'>('car');
  const [plan, setPlan] = useState<'basic' | 'standard' | 'premium'>('standard');
  const [annualPremium, setAnnualPremium] = useState<number>(0);

  // Auto inputs
  const [vehicleValue, setVehicleValue] = useState<number>(1500000); // in DZD
  const [mfgYear, setMfgYear] = useState<number>(2020);
  const [enginePower, setEnginePower] = useState<number>(7); // in fiscal HP
  const [autoUseCase, setAutoUseCase] = useState<'personal' | 'commercial'>('personal');

  // Home inputs
  const [propertyValue, setPropertyValue] = useState<number>(8000000); // in DZD
  const [propertyType, setPropertyType] = useState<'apartment' | 'villa'>('apartment');
  const [earthquakeZone, setEarthquakeZone] = useState<boolean>(true);

  // Health inputs
  const [healthAge, setHealthAge] = useState<number>(35);
  const [healthPreExisting, setHealthPreExisting] = useState<boolean>(false);
  const [healthScope, setHealthScope] = useState<'individual' | 'family'>('individual');

  // Life inputs
  const [lifeCoverage, setLifeCoverage] = useState<number>(5000000); // in DZD
  const [lifeAge, setLifeAge] = useState<number>(40);
  const [lifeTerm, setLifeTerm] = useState<number>(15);

  // Agri inputs
  const [agriLandSize, setAgriLandSize] = useState<number>(20); // in Hectares
  const [agriType, setAgriType] = useState<'crops' | 'livestock' | 'equipment'>('crops');
  const [agriDroughtZone, setAgriDroughtZone] = useState<boolean>(false);

  // Run calculation when any state variables change
  useEffect(() => {
    let calculated = 0;

    switch (category) {
      case 'car': {
        const base = 15000;
        const valFactor = vehicleValue * 0.015; // 1.5% of value
        const carAge = new Date().getFullYear() - mfgYear;
        const ageFactor = carAge > 10 ? 1.25 : carAge < 3 ? 0.9 : 1.0;
        const powerFactor = enginePower < 6 ? 1.0 : enginePower <= 10 ? 1.2 : 1.45;
        const useFactor = autoUseCase === 'personal' ? 1.0 : 1.45;
        
        let planFactor = 1.0;
        if (plan === 'standard') planFactor = 1.75;
        if (plan === 'premium') planFactor = 2.95;

        calculated = (base + valFactor) * ageFactor * powerFactor * useFactor * planFactor;
        break;
      }
      case 'home': {
        const base = 8000;
        const valFactor = propertyValue * 0.0006; // 0.06% of value
        const typeFactor = propertyType === 'apartment' ? 1.0 : 1.35;
        const riskFactor = earthquakeZone ? 1.35 : 1.0;

        let planFactor = 1.0;
        if (plan === 'standard') planFactor = 1.6;
        if (plan === 'premium') planFactor = 2.3;

        calculated = (base + valFactor) * typeFactor * riskFactor * planFactor;
        break;
      }
      case 'health': {
        const base = 12000;
        const ageFactor = healthAge < 30 ? 0.85 : healthAge <= 50 ? 1.15 : 1.75;
        const healthFactor = healthPreExisting ? 1.65 : 1.0;
        const scopeFactor = healthScope === 'individual' ? 1.0 : 2.65;

        let planFactor = 1.0;
        if (plan === 'standard') planFactor = 1.5;
        if (plan === 'premium') planFactor = 2.2;

        calculated = base * ageFactor * healthFactor * scopeFactor * planFactor;
        break;
      }
      case 'life': {
        const base = 8000;
        const coverageFactor = (lifeCoverage / 1000000) * 1200; // 1,200 DZD per million
        const ageFactor = lifeAge < 35 ? 1.0 : lifeAge <= 50 ? 1.35 : 2.15;
        const termFactor = lifeTerm <= 10 ? 0.9 : lifeTerm <= 20 ? 1.15 : 1.4;

        let planFactor = 1.0;
        if (plan === 'standard') planFactor = 1.4;
        if (plan === 'premium') planFactor = 2.0;

        calculated = (base + coverageFactor) * ageFactor * termFactor * planFactor;
        break;
      }
      case 'agriculture': {
        const base = 25000;
        const sizeFactor = agriLandSize * 1200; // 1,200 DZD per Hectare
        let focusFactor = 1.0;
        if (agriType === 'livestock') focusFactor = 1.35;
        if (agriType === 'equipment') focusFactor = 1.2;
        const zoneFactor = agriDroughtZone ? 1.35 : 1.0;

        let planFactor = 1.0;
        if (plan === 'standard') planFactor = 1.6;
        if (plan === 'premium') planFactor = 2.45;

        calculated = (base + sizeFactor) * focusFactor * zoneFactor * planFactor;
        break;
      }
      default:
        calculated = 0;
    }

    setAnnualPremium(Math.round(calculated));
  }, [
    category, plan, vehicleValue, mfgYear, enginePower, autoUseCase,
    propertyValue, propertyType, earthquakeZone,
    healthAge, healthPreExisting, healthScope,
    lifeCoverage, lifeAge, lifeTerm,
    agriLandSize, agriType, agriDroughtZone
  ]);

  const monthlyPremium = Math.round(annualPremium / 12);

  // Format currencies nicely
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-DZ') + ' ' + t.currency;
  };

  const isRTL = locale === 'ar';

  return (
    <section className="w-full py-16 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md border-t border-b border-zinc-200/50 dark:border-zinc-900/50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        
        {/* Left Column: Form & Selection */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6 text-start">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/30 bg-emerald-100/30 dark:bg-emerald-950/40 px-4 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-300">
              {t.title}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-950 dark:text-white">
              {category === 'car' && t.categories.car}
              {category === 'home' && t.categories.home}
              {category === 'health' && t.categories.health}
              {category === 'life' && t.categories.life}
              {category === 'agriculture' && t.categories.agriculture}
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {t.subtitle}
            </p>
          </div>

          {/* Navigation Category Tabs */}
          <div className="flex flex-wrap gap-2 bg-zinc-200/55 dark:bg-zinc-900/55 p-1 rounded-2xl">
            {(['car', 'home', 'health', 'life', 'agriculture'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`flex-1 min-w-[90px] px-3 py-2.5 text-xs font-bold rounded-xl transition duration-200 cursor-pointer text-center ${
                  category === cat
                    ? 'bg-emerald-700 text-white shadow-md'
                    : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300/40 dark:hover:bg-zinc-800/40'
                }`}
              >
                {cat === 'car' && (isRTL ? 'سيارات' : 'Auto')}
                {cat === 'home' && (isRTL ? 'سكن' : 'Habitation')}
                {cat === 'health' && (isRTL ? 'صحة' : 'Santé')}
                {cat === 'life' && (isRTL ? 'حياة' : 'Vie')}
                {cat === 'agriculture' && (isRTL ? 'فلاحة' : 'Agri')}
              </button>
            ))}
          </div>

          {/* Dynamic Category Specific Form Fields */}
          <div className="p-6 bg-white dark:bg-zinc-900/50 rounded-3xl shadow-sm border border-zinc-200/50 dark:border-zinc-800/50 space-y-6">
            
            {/* 1. Automobile Fields */}
            {category === 'car' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    <span>{t.vehicleValue}</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(vehicleValue)}</span>
                  </div>
                  <input
                    type="range"
                    min="400000"
                    max="8000000"
                    step="100000"
                    value={vehicleValue}
                    onChange={(e) => setVehicleValue(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>400,000 {t.currency}</span>
                    <span>8,000,000 {t.currency}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">{t.mfgYear}</label>
                    <select
                      value={mfgYear}
                      onChange={(e) => setMfgYear(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 rounded-xl"
                    >
                      {Array.from({ length: 25 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">{t.enginePower}</label>
                    <select
                      value={enginePower}
                      onChange={(e) => setEnginePower(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 rounded-xl"
                    >
                      {[2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20].map((p) => (
                        <option key={p} value={p}>{p} {t.hp}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">{t.useCase}</label>
                    <select
                      value={autoUseCase}
                      onChange={(e) => setAutoUseCase(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 rounded-xl"
                    >
                      <option value="personal">{t.personal}</option>
                      <option value="commercial">{t.commercial}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Home Fields */}
            {category === 'home' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    <span>{t.propertyValue}</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(propertyValue)}</span>
                  </div>
                  <input
                    type="range"
                    min="1000000"
                    max="30000000"
                    step="500000"
                    value={propertyValue}
                    onChange={(e) => setPropertyValue(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>1,000,000 {t.currency}</span>
                    <span>30,000,000 {t.currency}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">{t.propertyType}</label>
                    <select
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 rounded-xl"
                    >
                      <option value="apartment">{t.apartment}</option>
                      <option value="villa">{t.villa}</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">{t.earthquakeZone}</label>
                    <select
                      value={earthquakeZone ? 'yes' : 'no'}
                      onChange={(e) => setEarthquakeZone(e.target.value === 'yes')}
                      className="w-full px-3 py-2 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 rounded-xl"
                    >
                      <option value="yes">{t.yes}</option>
                      <option value="no">{t.no}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Health Fields */}
            {category === 'health' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    <span>{t.age}</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">{healthAge} {isRTL ? 'سنة' : 'years'}</span>
                  </div>
                  <input
                    type="range"
                    min="18"
                    max="80"
                    step="1"
                    value={healthAge}
                    onChange={(e) => setHealthAge(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>18</span>
                    <span>80</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">{t.planScope}</label>
                    <select
                      value={healthScope}
                      onChange={(e) => setHealthScope(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 rounded-xl"
                    >
                      <option value="individual">{t.individual}</option>
                      <option value="family">{t.family}</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">{t.preExisting}</label>
                    <select
                      value={healthPreExisting ? 'yes' : 'no'}
                      onChange={(e) => setHealthPreExisting(e.target.value === 'yes')}
                      className="w-full px-3 py-2 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 rounded-xl"
                    >
                      <option value="no">{t.no}</option>
                      <option value="yes">{t.yes}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Life Fields */}
            {category === 'life' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    <span>{t.coverageAmount}</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(lifeCoverage)}</span>
                  </div>
                  <input
                    type="range"
                    min="1000000"
                    max="20000000"
                    step="500000"
                    value={lifeCoverage}
                    onChange={(e) => setLifeCoverage(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>1,000,000 {t.currency}</span>
                    <span>20,000,000 {t.currency}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                      <span>{t.age}</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-300">{lifeAge}</span>
                    </div>
                    <input
                      type="range"
                      min="18"
                      max="70"
                      step="1"
                      value={lifeAge}
                      onChange={(e) => setLifeAge(Number(e.target.value))}
                      className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                      <span>{t.term}</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-300">{lifeTerm} {t.years}</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="35"
                      step="5"
                      value={lifeTerm}
                      onChange={(e) => setLifeTerm(Number(e.target.value))}
                      className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 5. Agriculture Fields */}
            {category === 'agriculture' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    <span>{t.landSize}</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">{agriLandSize} {t.hectares}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                    value={agriLandSize}
                    onChange={(e) => setAgriLandSize(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>1 {t.hectares}</span>
                    <span>100 {t.hectares}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">{t.agriType}</label>
                    <select
                      value={agriType}
                      onChange={(e) => setAgriType(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 rounded-xl"
                    >
                      <option value="crops">{t.crops}</option>
                      <option value="livestock">{t.livestock}</option>
                      <option value="equipment">{t.equipment}</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">{t.droughtZone}</label>
                    <select
                      value={agriDroughtZone ? 'yes' : 'no'}
                      onChange={(e) => setAgriDroughtZone(e.target.value === 'yes')}
                      className="w-full px-3 py-2 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 rounded-xl"
                    >
                      <option value="no">{t.no}</option>
                      <option value="yes">{t.yes}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Pricing Display & Coverages */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-zinc-50/50 dark:bg-zinc-900/40 p-8 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 relative overflow-hidden shadow-sm">
          <div className="absolute top-[-20%] right-[-20%] w-60 h-60 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl pointer-events-none" />
          
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest text-start">{t.planLabel}</h3>
            
            {/* Coverage Level Selector Tabs */}
            <div className="grid grid-cols-3 gap-2 bg-zinc-200/40 dark:bg-zinc-950/40 p-1 rounded-xl">
              {(['basic', 'standard', 'premium'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlan(p)}
                  className={`py-2 text-[10px] sm:text-xs font-bold rounded-lg transition duration-200 cursor-pointer text-center ${
                    plan === p
                      ? 'bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-300 shadow-sm'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                  }`}
                >
                  {p === 'basic' && (isRTL ? 'أساسي' : 'Tiers')}
                  {p === 'standard' && (isRTL ? 'أمان' : 'Standard')}
                  {p === 'premium' && (isRTL ? 'شامل' : 'Premium')}
                </button>
              ))}
            </div>

            {/* Plan Info Card */}
            <div className="p-4 bg-white/70 dark:bg-zinc-900/60 rounded-2xl text-start space-y-2">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                {plan === 'basic' && t.basicName}
                {plan === 'standard' && t.standardName}
                {plan === 'premium' && t.premiumName}
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {plan === 'basic' && t.basicDesc}
                {plan === 'standard' && t.standardDesc}
                {plan === 'premium' && t.premiumDesc}
              </p>
            </div>

            {/* Pricing Displays */}
            <div className="space-y-4 pt-4 border-t border-zinc-200/50 dark:border-zinc-800/50 text-start">
              <div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 block mb-1">{t.monthly}</span>
                <span className="text-2xl font-black text-zinc-900 dark:text-white">
                  {formatCurrency(monthlyPremium)}
                  <span className="text-xs font-normal text-zinc-400"> / {isRTL ? 'شهر' : 'month'}</span>
                </span>
              </div>

              <div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 block mb-1">{t.annual}</span>
                <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                  {formatCurrency(annualPremium)}
                  <span className="text-xs font-normal text-zinc-400"> / {isRTL ? 'سنة' : 'year'}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="pt-8">
            <Link
              href="/register"
              className="w-full block py-3.5 text-center text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-2xl shadow-md transition duration-200 cursor-pointer"
            >
              {t.applyBtn}
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
