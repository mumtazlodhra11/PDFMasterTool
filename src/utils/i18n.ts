/**
 * Internationalization (i18n) Utility
 * Handles language translations for PDFEliteTools
 */

export type Language = 'en' | 'hi' | 'es' | 'fr' | 'de' | 'zh';

export interface Translations {
  nav: {
    home: string;
    tools: string;
    blogs: string;
    guides: string;
    contact: string;
  };
  hero: {
    title: string;
    subtitle: string;
    cta: string;
  };
  features: {
    privacy: string;
    speed: string;
    ai: string;
    free: string;
  };
  common: {
    loading: string;
    error: string;
    success: string;
    download: string;
    upload: string;
    processFiles: string;
    selectFiles: string;
    dragDrop: string;
    orClick: string;
    useTool: string;
  };
  tools: {
    [key: string]: {
      name: string;
      description: string;
      features: string[];
    };
  };
}

const translations: Record<Language, Translations> = {
  en: {
    nav: {
      home: 'Home',
      tools: 'Tools',
      blogs: 'Blogs',
      guides: 'Guides',
      contact: 'Contact Us',
    },
    hero: {
      title: 'All-in-One PDF Tools Platform',
      subtitle: '26+ professional PDF tools. Convert, edit, compress, merge, and more — all free, all private.',
      cta: 'View All Tools',
    },
    features: {
      privacy: '100% Privacy & Security',
      speed: 'Lightning Fast Processing',
      ai: 'AI-Powered Intelligence',
      free: '100% Free Forever',
    },
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      download: 'Download',
      upload: 'Upload',
    },
  },
  hi: {
    nav: {
      home: 'होम',
      tools: 'टूल्स',
      blogs: 'ब्लॉग',
      guides: 'गाइड',
      contact: 'संपर्क करें',
    },
    hero: {
      title: 'ऑल-इन-वन PDF टूल्स प्लेटफॉर्म',
      subtitle: '43+ पेशेवर PDF टूल्स। कन्वर्ट, एडिट, कंप्रेस, मर्ज, और बहुत कुछ — सभी मुफ्त, सभी निजी।',
      cta: 'सभी टूल्स देखें',
    },
    features: {
      privacy: '100% गोपनीयता और सुरक्षा',
      speed: 'बिजली की तरह तेज़ प्रसंस्करण',
      ai: 'AI-संचालित बुद्धिमत्ता',
      free: '100% हमेशा मुफ्त',
    },
    common: {
      loading: 'लोड हो रहा है...',
      error: 'त्रुटि',
      success: 'सफल',
      download: 'डाउनलोड',
      upload: 'अपलोड',
    },
  },
  es: {
    nav: {
      home: 'Inicio',
      tools: 'Herramientas',
      blogs: 'Blogs',
      guides: 'Guías',
      contact: 'Contáctanos',
    },
    hero: {
      title: 'Plataforma de Herramientas PDF Todo-en-Uno',
      subtitle: '43+ herramientas PDF profesionales. Convierte, edita, comprime, combina y más — todo gratis, todo privado.',
      cta: 'Ver Todas las Herramientas',
    },
    features: {
      privacy: '100% Privacidad y Seguridad',
      speed: 'Procesamiento Ultra Rápido',
      ai: 'Inteligencia con IA',
      free: '100% Gratis para Siempre',
    },
    common: {
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      download: 'Descargar',
      upload: 'Subir',
    },
  },
  fr: {
    nav: {
      home: 'Accueil',
      tools: 'Outils',
      blogs: 'Blogs',
      guides: 'Guides',
      contact: 'Nous Contacter',
    },
    hero: {
      title: 'Plateforme d\'Outils PDF Tout-en-Un',
      subtitle: '43+ outils PDF professionnels. Convertissez, modifiez, compressez, fusionnez et plus — tout gratuit, tout privé.',
      cta: 'Voir Tous les Outils',
    },
    features: {
      privacy: '100% Confidentialité et Sécurité',
      speed: 'Traitement Ultra Rapide',
      ai: 'Intelligence Alimentée par IA',
      free: '100% Gratuit pour Toujours',
    },
    common: {
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
      download: 'Télécharger',
      upload: 'Téléverser',
    },
  },
  de: {
    nav: {
      home: 'Startseite',
      tools: 'Werkzeuge',
      blogs: 'Blogs',
      guides: 'Anleitungen',
      contact: 'Kontakt',
    },
    hero: {
      title: 'All-in-One PDF-Tools-Plattform',
      subtitle: '43+ professionelle PDF-Tools. Konvertieren, bearbeiten, komprimieren, zusammenführen und mehr — alles kostenlos, alles privat.',
      cta: 'Alle Tools Anzeigen',
    },
    features: {
      privacy: '100% Datenschutz und Sicherheit',
      speed: 'Blitzschnelle Verarbeitung',
      ai: 'KI-gestützte Intelligenz',
      free: '100% Kostenlos für Immer',
    },
    common: {
      loading: 'Lädt...',
      error: 'Fehler',
      success: 'Erfolg',
      download: 'Herunterladen',
      upload: 'Hochladen',
    },
  },
  zh: {
    nav: {
      home: '首页',
      tools: '工具',
      blogs: '博客',
      guides: '指南',
      contact: '联系我们',
    },
    hero: {
      title: '一体化PDF工具平台',
      subtitle: '43+专业PDF工具。转换、编辑、压缩、合并等 — 全部免费，全部私密。',
      cta: '查看所有工具',
    },
    features: {
      privacy: '100%隐私和安全',
      speed: '闪电般快速处理',
      ai: 'AI驱动的智能',
      free: '100%永久免费',
    },
    common: {
      loading: '加载中...',
      error: '错误',
      success: '成功',
      download: '下载',
      upload: '上传',
    },
  },
};

// Get current language from localStorage or browser
export function getCurrentLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  
  const saved = localStorage.getItem('preferred-language') as Language;
  if (saved && translations[saved]) return saved;
  
  // Detect browser language
  const browserLang = navigator.language.split('-')[0] as Language;
  if (translations[browserLang]) return browserLang;
  
  return 'en';
}

// Get translations for current language
export function getTranslations(lang?: Language): Translations {
  const currentLang = lang || getCurrentLanguage();
  return translations[currentLang] || translations.en;
}

// Translate function
export function t(key: string, lang?: Language): string {
  const trans = getTranslations(lang);
  const keys = key.split('.');
  let value: any = trans;
  
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
  }
  
  return value as string;
}

// Set language preference
export function setLanguage(lang: Language): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('preferred-language', lang);
  
  // Dispatch custom event for components to update
  window.dispatchEvent(new CustomEvent('languagechange', { detail: { language: lang } }));
  
  // Update HTML lang attribute
  document.documentElement.lang = lang;
}

// Initialize language on page load
export function initLanguage(): void {
  if (typeof window === 'undefined') return;
  
  const lang = getCurrentLanguage();
  document.documentElement.lang = lang;
}

