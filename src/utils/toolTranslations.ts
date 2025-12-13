/**
 * Tool Translations
 * Translations for all tool names, descriptions, and features
 */

import type { Language } from './i18n';

export interface ToolTranslation {
  name: string;
  description: string;
  features: string[];
}

export const toolTranslations: Record<Language, Record<string, ToolTranslation>> = {
  en: {
    'merge-pdf': {
      name: 'Merge PDF',
      description: 'Combine multiple PDF files into a single document',
      features: ['Drag & drop order', 'Unlimited files', 'Preview pages', 'Fast merge'],
    },
    'split-pdf': {
      name: 'Split PDF',
      description: 'Split large PDF into smaller files or extract specific pages',
      features: ['Page ranges', 'Extract pages', 'Split by size', 'Batch split'],
    },
    'compress-pdf': {
      name: 'Compress PDF',
      description: 'Reduce PDF file size while maintaining quality',
      features: ['Smart compression', 'Quality levels', 'Preview before', 'Batch compress'],
    },
    'pdf-to-word': {
      name: 'PDF to Word',
      description: 'Convert PDF to editable Word documents with OCR support',
      features: ['OCR enabled', 'Editable text', 'Format preserved', 'Table detection'],
    },
    'word-to-pdf': {
      name: 'Word to PDF',
      description: 'Convert Word documents (DOCX, DOC) to high-quality PDF format',
      features: ['Maintains formatting', 'Fast conversion', 'Batch processing', 'Cloud & local'],
    },
    'pdf-to-excel': {
      name: 'PDF to Excel',
      description: 'Extract tables from PDF to editable Excel spreadsheets',
      features: ['Smart table detection', 'Data accuracy', 'Multiple sheets', 'Formula support'],
    },
    'excel-to-pdf': {
      name: 'Excel to PDF',
      description: 'Convert Excel spreadsheets to professional PDF documents',
      features: ['Table preservation', 'Multiple sheets', 'Custom page size', 'Print-ready'],
    },
    'edit-pdf': {
      name: 'Edit PDF',
      description: 'Edit PDF text, images, and shapes directly',
      features: ['Text editing', 'Image insertion', 'Shape drawing', 'Color picker'],
    },
    'rotate-pdf': {
      name: 'Rotate Pages',
      description: 'Rotate PDF pages 90°, 180°, or 270° degrees',
      features: ['Individual pages', 'Batch rotate', 'Preview rotation', 'Quick rotate'],
    },
    'password-protect': {
      name: 'Password Protect PDF',
      description: 'Add password protection and encryption to PDF files',
      features: ['AES-256 encryption', 'User password', 'Owner password', 'Permission control'],
    },
  },
  hi: {
    'merge-pdf': {
      name: 'PDF मर्ज करें',
      description: 'कई PDF फाइलों को एक दस्तावेज़ में मिलाएं',
      features: ['ड्रैग और ड्रॉप ऑर्डर', 'असीमित फाइलें', 'पृष्ठ पूर्वावलोकन', 'तेज़ मर्ज'],
    },
    'split-pdf': {
      name: 'PDF विभाजित करें',
      description: 'बड़े PDF को छोटी फाइलों में विभाजित करें या विशिष्ट पृष्ठ निकालें',
      features: ['पृष्ठ रेंज', 'पृष्ठ निकालें', 'आकार से विभाजित', 'बैच विभाजन'],
    },
    'compress-pdf': {
      name: 'PDF संपीड़ित करें',
      description: 'गुणवत्ता बनाए रखते हुए PDF फाइल का आकार कम करें',
      features: ['स्मार्ट संपीड़न', 'गुणवत्ता स्तर', 'पहले पूर्वावलोकन', 'बैच संपीड़न'],
    },
    'pdf-to-word': {
      name: 'PDF से Word',
      description: 'OCR सपोर्ट के साथ PDF को संपादन योग्य Word दस्तावेज़ में कन्वर्ट करें',
      features: ['OCR सक्षम', 'संपादन योग्य टेक्स्ट', 'फॉर्मेट संरक्षित', 'टेबल डिटेक्शन'],
    },
    'word-to-pdf': {
      name: 'Word से PDF',
      description: 'Word दस्तावेज़ (DOCX, DOC) को उच्च-गुणवत्ता PDF प्रारूप में कन्वर्ट करें',
      features: ['फॉर्मेटिंग बनाए रखता है', 'तेज़ रूपांतरण', 'बैच प्रसंस्करण', 'क्लाउड और स्थानीय'],
    },
    'pdf-to-excel': {
      name: 'PDF से Excel',
      description: 'PDF से टेबल निकालकर संपादन योग्य Excel स्प्रेडशीट में बदलें',
      features: ['स्मार्ट टेबल डिटेक्शन', 'डेटा सटीकता', 'कई शीट', 'फॉर्मूला सपोर्ट'],
    },
    'excel-to-pdf': {
      name: 'Excel से PDF',
      description: 'Excel स्प्रेडशीट को पेशेवर PDF दस्तावेज़ में कन्वर्ट करें',
      features: ['टेबल संरक्षण', 'कई शीट', 'कस्टम पेज साइज़', 'प्रिंट-तैयार'],
    },
    'edit-pdf': {
      name: 'PDF संपादित करें',
      description: 'PDF टेक्स्ट, छवियों और आकृतियों को सीधे संपादित करें',
      features: ['टेक्स्ट संपादन', 'छवि सम्मिलन', 'आकृति ड्राइंग', 'रंग पिकर'],
    },
    'rotate-pdf': {
      name: 'पृष्ठ घुमाएं',
      description: 'PDF पृष्ठों को 90°, 180°, या 270° डिग्री घुमाएं',
      features: ['व्यक्तिगत पृष्ठ', 'बैच रोटेट', 'रोटेशन पूर्वावलोकन', 'त्वरित रोटेट'],
    },
    'password-protect': {
      name: 'PDF पासवर्ड सुरक्षा',
      description: 'PDF फाइलों में पासवर्ड सुरक्षा और एन्क्रिप्शन जोड़ें',
      features: ['AES-256 एन्क्रिप्शन', 'उपयोगकर्ता पासवर्ड', 'मालिक पासवर्ड', 'अनुमति नियंत्रण'],
    },
  },
  es: {
    'merge-pdf': {
      name: 'Combinar PDF',
      description: 'Combina múltiples archivos PDF en un solo documento',
      features: ['Ordenar arrastrando', 'Archivos ilimitados', 'Vista previa', 'Combinación rápida'],
    },
    'split-pdf': {
      name: 'Dividir PDF',
      description: 'Divide un PDF grande en archivos más pequeños o extrae páginas específicas',
      features: ['Rangos de páginas', 'Extraer páginas', 'Dividir por tamaño', 'División por lotes'],
    },
    'compress-pdf': {
      name: 'Comprimir PDF',
      description: 'Reduce el tamaño del archivo PDF manteniendo la calidad',
      features: ['Compresión inteligente', 'Niveles de calidad', 'Vista previa', 'Compresión por lotes'],
    },
    'pdf-to-word': {
      name: 'PDF a Word',
      description: 'Convierte PDF a documentos Word editables con soporte OCR',
      features: ['OCR habilitado', 'Texto editable', 'Formato preservado', 'Detección de tablas'],
    },
    'word-to-pdf': {
      name: 'Word a PDF',
      description: 'Convierte documentos Word (DOCX, DOC) a formato PDF de alta calidad',
      features: ['Mantiene formato', 'Conversión rápida', 'Procesamiento por lotes', 'Nube y local'],
    },
    'pdf-to-excel': {
      name: 'PDF a Excel',
      description: 'Extrae tablas de PDF a hojas de cálculo Excel editables',
      features: ['Detección inteligente', 'Precisión de datos', 'Múltiples hojas', 'Soporte de fórmulas'],
    },
    'excel-to-pdf': {
      name: 'Excel a PDF',
      description: 'Convierte hojas de cálculo Excel a documentos PDF profesionales',
      features: ['Preservación de tablas', 'Múltiples hojas', 'Tamaño de página personalizado', 'Listo para imprimir'],
    },
    'edit-pdf': {
      name: 'Editar PDF',
      description: 'Edita texto, imágenes y formas de PDF directamente',
      features: ['Edición de texto', 'Inserción de imágenes', 'Dibujo de formas', 'Selector de color'],
    },
    'rotate-pdf': {
      name: 'Rotar Páginas',
      description: 'Rota páginas PDF 90°, 180° o 270° grados',
      features: ['Páginas individuales', 'Rotación por lotes', 'Vista previa', 'Rotación rápida'],
    },
    'password-protect': {
      name: 'Proteger PDF con Contraseña',
      description: 'Añade protección con contraseña y cifrado a archivos PDF',
      features: ['Cifrado AES-256', 'Contraseña de usuario', 'Contraseña de propietario', 'Control de permisos'],
    },
  },
  fr: {
    'merge-pdf': {
      name: 'Fusionner PDF',
      description: 'Combiner plusieurs fichiers PDF en un seul document',
      features: ['Ordre par glisser-déposer', 'Fichiers illimités', 'Aperçu des pages', 'Fusion rapide'],
    },
    'split-pdf': {
      name: 'Diviser PDF',
      description: 'Diviser un grand PDF en fichiers plus petits ou extraire des pages spécifiques',
      features: ['Plages de pages', 'Extraire des pages', 'Diviser par taille', 'Division par lots'],
    },
    'compress-pdf': {
      name: 'Compresser PDF',
      description: 'Réduire la taille du fichier PDF tout en maintenant la qualité',
      features: ['Compression intelligente', 'Niveaux de qualité', 'Aperçu avant', 'Compression par lots'],
    },
    'pdf-to-word': {
      name: 'PDF vers Word',
      description: 'Convertir PDF en documents Word éditables avec support OCR',
      features: ['OCR activé', 'Texte éditable', 'Format préservé', 'Détection de tableaux'],
    },
    'word-to-pdf': {
      name: 'Word vers PDF',
      description: 'Convertir des documents Word (DOCX, DOC) en format PDF haute qualité',
      features: ['Maintient le formatage', 'Conversion rapide', 'Traitement par lots', 'Cloud et local'],
    },
    'pdf-to-excel': {
      name: 'PDF vers Excel',
      description: 'Extraire des tableaux de PDF vers des feuilles de calcul Excel éditables',
      features: ['Détection intelligente', 'Précision des données', 'Plusieurs feuilles', 'Support de formules'],
    },
    'excel-to-pdf': {
      name: 'Excel vers PDF',
      description: 'Convertir des feuilles de calcul Excel en documents PDF professionnels',
      features: ['Préservation des tableaux', 'Plusieurs feuilles', 'Taille de page personnalisée', 'Prêt à imprimer'],
    },
    'edit-pdf': {
      name: 'Modifier PDF',
      description: 'Modifier le texte, les images et les formes PDF directement',
      features: ['Édition de texte', 'Insertion d\'images', 'Dessin de formes', 'Sélecteur de couleur'],
    },
    'rotate-pdf': {
      name: 'Tourner les Pages',
      description: 'Tourner les pages PDF de 90°, 180° ou 270° degrés',
      features: ['Pages individuelles', 'Rotation par lots', 'Aperçu de rotation', 'Rotation rapide'],
    },
    'password-protect': {
      name: 'Protéger PDF par Mot de Passe',
      description: 'Ajouter une protection par mot de passe et un chiffrement aux fichiers PDF',
      features: ['Chiffrement AES-256', 'Mot de passe utilisateur', 'Mot de passe propriétaire', 'Contrôle des permissions'],
    },
  },
  de: {
    'merge-pdf': {
      name: 'PDF Zusammenführen',
      description: 'Mehrere PDF-Dateien zu einem Dokument zusammenführen',
      features: ['Drag & Drop Reihenfolge', 'Unbegrenzte Dateien', 'Seitenvorschau', 'Schnelle Zusammenführung'],
    },
    'split-pdf': {
      name: 'PDF Aufteilen',
      description: 'Große PDF in kleinere Dateien aufteilen oder bestimmte Seiten extrahieren',
      features: ['Seitenbereiche', 'Seiten extrahieren', 'Nach Größe aufteilen', 'Stapelaufteilung'],
    },
    'compress-pdf': {
      name: 'PDF Komprimieren',
      description: 'PDF-Dateigröße reduzieren bei gleichbleibender Qualität',
      features: ['Intelligente Komprimierung', 'Qualitätsstufen', 'Vorschau vorher', 'Stapelkomprimierung'],
    },
    'pdf-to-word': {
      name: 'PDF zu Word',
      description: 'PDF in bearbeitbare Word-Dokumente mit OCR-Unterstützung konvertieren',
      features: ['OCR aktiviert', 'Bearbeitbarer Text', 'Format erhalten', 'Tabellenerkennung'],
    },
    'word-to-pdf': {
      name: 'Word zu PDF',
      description: 'Word-Dokumente (DOCX, DOC) in hochwertiges PDF-Format konvertieren',
      features: ['Formatierung beibehalten', 'Schnelle Konvertierung', 'Stapelverarbeitung', 'Cloud & lokal'],
    },
    'pdf-to-excel': {
      name: 'PDF zu Excel',
      description: 'Tabellen aus PDF in bearbeitbare Excel-Tabellen extrahieren',
      features: ['Intelligente Tabellenerkennung', 'Datengenauigkeit', 'Mehrere Blätter', 'Formelunterstützung'],
    },
    'excel-to-pdf': {
      name: 'Excel zu PDF',
      description: 'Excel-Tabellen in professionelle PDF-Dokumente konvertieren',
      features: ['Tabellenerhaltung', 'Mehrere Blätter', 'Benutzerdefinierte Seitengröße', 'Druckbereit'],
    },
    'edit-pdf': {
      name: 'PDF Bearbeiten',
      description: 'PDF-Text, Bilder und Formen direkt bearbeiten',
      features: ['Textbearbeitung', 'Bildeinfügung', 'Formzeichnung', 'Farbauswahl'],
    },
    'rotate-pdf': {
      name: 'Seiten Drehen',
      description: 'PDF-Seiten um 90°, 180° oder 270° Grad drehen',
      features: ['Einzelne Seiten', 'Stapeldrehung', 'Drehvorschau', 'Schnelle Drehung'],
    },
    'password-protect': {
      name: 'PDF mit Passwort Schützen',
      description: 'Passwortschutz und Verschlüsselung zu PDF-Dateien hinzufügen',
      features: ['AES-256-Verschlüsselung', 'Benutzerpasswort', 'Besitzerpasswort', 'Berechtigungskontrolle'],
    },
  },
  zh: {
    'merge-pdf': {
      name: '合并PDF',
      description: '将多个PDF文件合并为一个文档',
      features: ['拖放排序', '无限文件', '页面预览', '快速合并'],
    },
    'split-pdf': {
      name: '拆分PDF',
      description: '将大型PDF拆分为较小的文件或提取特定页面',
      features: ['页面范围', '提取页面', '按大小拆分', '批量拆分'],
    },
    'compress-pdf': {
      name: '压缩PDF',
      description: '在保持质量的同时减小PDF文件大小',
      features: ['智能压缩', '质量级别', '预览', '批量压缩'],
    },
    'pdf-to-word': {
      name: 'PDF转Word',
      description: '将PDF转换为可编辑的Word文档，支持OCR',
      features: ['启用OCR', '可编辑文本', '保留格式', '表格检测'],
    },
    'word-to-pdf': {
      name: 'Word转PDF',
      description: '将Word文档（DOCX, DOC）转换为高质量PDF格式',
      features: ['保持格式', '快速转换', '批量处理', '云端和本地'],
    },
    'pdf-to-excel': {
      name: 'PDF转Excel',
      description: '从PDF提取表格到可编辑的Excel电子表格',
      features: ['智能表格检测', '数据准确性', '多个工作表', '公式支持'],
    },
    'excel-to-pdf': {
      name: 'Excel转PDF',
      description: '将Excel电子表格转换为专业PDF文档',
      features: ['表格保留', '多个工作表', '自定义页面大小', '可打印'],
    },
    'edit-pdf': {
      name: '编辑PDF',
      description: '直接编辑PDF文本、图像和形状',
      features: ['文本编辑', '图像插入', '形状绘制', '颜色选择器'],
    },
    'rotate-pdf': {
      name: '旋转页面',
      description: '将PDF页面旋转90°、180°或270°',
      features: ['单个页面', '批量旋转', '旋转预览', '快速旋转'],
    },
    'password-protect': {
      name: 'PDF密码保护',
      description: '为PDF文件添加密码保护和加密',
      features: ['AES-256加密', '用户密码', '所有者密码', '权限控制'],
    },
  },
};

// Get tool translation
export function getToolTranslation(toolId: string, lang: Language): ToolTranslation | null {
  return toolTranslations[lang]?.[toolId] || null;
}

// Get translated tool name
export function getTranslatedToolName(toolId: string, lang: Language, fallback: string): string {
  const translation = getToolTranslation(toolId, lang);
  return translation?.name || fallback;
}

// Get translated tool description
export function getTranslatedToolDescription(toolId: string, lang: Language, fallback: string): string {
  const translation = getToolTranslation(toolId, lang);
  return translation?.description || fallback;
}

// Get translated tool features
export function getTranslatedToolFeatures(toolId: string, lang: Language, fallback: string[]): string[] {
  const translation = getToolTranslation(toolId, lang);
  return translation?.features || fallback;
}





