// src/lib/config/catalog.ts

import {
  Grid3X3,
  Box,
  Layers,
  Sparkles,
  Zap,
  Award,
  GraduationCap,
  Magnet,
  Sun,
  Cpu,
  Atom,
  Droplet,
  Timer,
  Smartphone,
  Briefcase,
  Wrench,
  Compass,
  Gift,
  Flame,
  CalendarClock,
  Building2,
  BookOpen,
  Users,
  Settings,
  Shield,
  Clock as ClockIcon
} from 'lucide-react';
import * as React from 'react';

export interface LocalizedString {
  az: string;
  en: string;
  ru: string;
}

export interface TaxonomyItem {
  id: string;
  slug: string;
  title: LocalizedString;
  description: LocalizedString;
  iconName: string;
  icon: React.ComponentType<any>;
}

export interface TaxonomyGroup {
  id: string;
  slug: string;
  title: LocalizedString;
  items: TaxonomyItem[];
}

export const rubikTaxonomy = {
  puzzles: {
    id: 'puzzles',
    slug: 'puzzles',
    title: {
      az: 'Tapmacalar və Kublar',
      en: 'Puzzles & Cubes',
      ru: 'Головоломки и Кубы'
    },
    items: [
      {
        id: '2x2',
        slug: '2x2',
        title: { az: '2x2 Kub', en: '2x2 Cube', ru: 'Куб 2x2' },
        description: { az: 'Yeni başlayanlar və sürətli həll edənlər üçün kiçik ölçülü tapmaca.', en: 'Small-sized puzzle for beginners and speedcubers alike.', ru: 'Компактная головоломка для начинающих и спидкуберов.' },
        iconName: 'Grid3X3',
        icon: Grid3X3
      },
      {
        id: '3x3',
        slug: '3x3',
        title: { az: '3x3 Kub', en: '3x3 Cube', ru: 'Куб 3x3' },
        description: { az: 'Klassik və ən məşhur sürətli kub yarışı tapmacası.', en: 'The classic and most popular speedcubing puzzle.', ru: 'Классическая и самая популярная головоломка для спидкубинга.' },
        iconName: 'Box',
        icon: Box
      },
      {
        id: '4x4',
        slug: '4x4',
        title: { az: '4x4 Kub', en: '4x4 Cube', ru: 'Куб 4x4' },
        description: { az: 'Mərkəzlərin düzgün yerləşdirilməsini tələb edən ilk böyük kub.', en: 'The first big cube requiring center building and edge pairing.', ru: 'Первый большой куб, требующий сборки центров и спаривания ребер.' },
        iconName: 'Layers',
        icon: Layers
      },
      {
        id: '5x5',
        slug: '5x5',
        title: { az: '5x5 Kub', en: '5x5 Cube', ru: 'Куб 5x5' },
        description: { az: 'Geniş spektrli alqoritmlər tələb edən peşəkar böyük kub.', en: 'Professional big cube requiring a wide spectrum of algorithms.', ru: 'Профессиональный большой куб, требующий широкого спектра алгоритмов.' },
        iconName: 'Sparkles',
        icon: Sparkles
      },
      {
        id: '6x6',
        slug: '6x6',
        title: { az: '6x6 Kub', en: '6x6 Cube', ru: 'Куб 6x6' },
        description: { az: 'Mürəkkəb daxili mexanizmə malik olan çətin böyük kub.', en: 'Challenging big cube with a complex internal mechanism.', ru: 'Сложный большой куб со сложным внутренним механизмом.' },
        iconName: 'Layers',
        icon: Layers
      },
      {
        id: '7x7',
        slug: '7x7',
        title: { az: '7x7 Kub', en: '7x7 Cube', ru: 'Куб 7x7' },
        description: { az: 'Rəsmi WCA yarışlarında ən böyük rəsmi kub kateqoriyası.', en: 'The largest official cube category in official WCA competitions.', ru: 'Самая большая официальная категория кубиков в соревнованиях WCA.' },
        iconName: 'Sparkles',
        icon: Sparkles
      },
      {
        id: 'skewb',
        slug: 'skewb',
        title: { az: 'Skewb', en: 'Skewb', ru: 'Скьюб' },
        description: { az: 'Diaqonal kəsikli, qeyri-adi fırlanma mexanizminə malik kub.', en: 'Corner-turning puzzle with a diagonal rotation mechanism.', ru: 'Головоломка с вращением углов и диагональным механизмом.' },
        iconName: 'Zap',
        icon: Zap
      },
      {
        id: 'pyraminx',
        slug: 'pyraminx',
        title: { az: 'Pyraminx', en: 'Pyraminx', ru: 'Пираминкс' },
        description: { az: 'Tetraedr formalı, sürətli və əyləncəli piramida tapmacası.', en: 'Tetrahedron-shaped, fast and fun pyramidal puzzle.', ru: 'Тетраэдрическая, быстрая и увлекательная пирамидальная головоломка.' },
        iconName: 'Award',
        icon: Award
      },
      {
        id: 'megaminx',
        slug: 'megaminx',
        title: { az: 'Megaminx', en: 'Megaminx', ru: 'Мегаминкс' },
        description: { az: '12 üzlü dodekaedr formalı, mürəkkəb və maraqlı tapmaca.', en: 'Dodecahedron-shaped puzzle with 12 faces and beautiful patterns.', ru: 'Додекаэдрическая головоломка с 12 гранями и красивыми узорами.' },
        iconName: 'GraduationCap',
        icon: GraduationCap
      },
      {
        id: 'square-1',
        slug: 'square-1',
        title: { az: 'Square-1', en: 'Square-1', ru: 'Скваер-1' },
        description: { az: 'Fırlandıqca formasını dəyişən, unikal həll mexanizmli kub.', en: 'Shape-shifting puzzle that changes its form as it rotates.', ru: 'Головоломка, меняющая форму при вращении, с уникальным решением.' },
        iconName: 'Layers',
        icon: Layers
      },
      {
        id: 'clock',
        slug: 'clock',
        title: { az: 'Clock', en: 'Clock', ru: 'Часы' },
        description: { az: 'Hər iki üzündə siferblatları olan rəsmi WCA tapmacası.', en: 'Official WCA puzzle featuring independent clocks on both sides.', ru: 'Официальная головоломка WCA с циферблатами на обеих сторонах.' },
        iconName: 'ClockIcon',
        icon: ClockIcon
      }
    ]
  },
  skillLevels: {
    id: 'skill-levels',
    slug: 'skill-levels',
    title: {
      az: 'Çətinlik Səviyyəsi',
      en: 'Skill Levels',
      ru: 'Уровень Мастерства'
    },
    items: [
      {
        id: 'beginner',
        slug: 'beginner',
        title: { az: 'Yeni Başlayan', en: 'Beginner', ru: 'Новичок' },
        description: { az: 'Yumşaq fırlanan, büdcəyə uyğun və öyrənmək üçün ideal kublar.', en: 'Smooth-turning, budget-friendly cubes ideal for learning.', ru: 'Плавно вращающиеся, бюджетные кубики, идеальные для обучения.' },
        iconName: 'GraduationCap',
        icon: GraduationCap
      },
      {
        id: 'intermediate',
        slug: 'intermediate',
        title: { az: 'Orta Səviyyə', en: 'Intermediate', ru: 'Средний уровень' },
        description: { az: 'Daha yaxşı kəsiklər və maqnitli mexanizmlərlə təchiz olunmuş kublar.', en: 'Advanced features with strong magnets and better corner cutting.', ru: 'Улучшенные характеристики с сильными магнитами и лучшей резкой углов.' },
        iconName: 'Award',
        icon: Award
      },
      {
        id: 'pro',
        slug: 'pro',
        title: { az: 'Peşəkar / Pro', en: 'Pro / Speedcuber', ru: 'Профессионал' },
        description: { az: 'Maksimum tənzimləmə, yüksək performanslı yarış kubları.', en: 'Maximum customization options and ultimate performance for speedcubing.', ru: 'Максимальные возможности настройки и максимальная производительность.' },
        iconName: 'Zap',
        icon: Zap
      }
    ]
  },
  mechanics: {
    id: 'mechanics',
    slug: 'mechanics',
    title: {
      az: 'Texnologiyalar və Mexanizmlər',
      en: 'Mechanics & Features',
      ru: 'Технологии и Механизмы'
    },
    items: [
      {
        id: 'magnetic',
        slug: 'magnetic',
        title: { az: 'Maqnitli (Magnetic)', en: 'Magnetic', ru: 'Магнитный' },
        description: { az: 'Düzülüşü və fırlanma stabilliyini artıran daxili maqnitlər.', en: 'Internal magnets that improve alignment and rotational stability.', ru: 'Внутренние магниты для улучшения выравнивания и стабильности.' },
        iconName: 'Magnet',
        icon: Magnet
      },
      {
        id: 'uv',
        slug: 'uv',
        title: { az: 'UV Örtüklü (UV Coated)', en: 'UV Coated', ru: 'UV Покрытие' },
        description: { az: 'Cızıqlara qarşı dözümlü və parlaq ultrabənövşəyi xarici qat.', en: 'Ultra-glossy scratch-resistant outer shell with enhanced grip.', ru: 'Сверхглянцевое устойчивое к царапинам покрытие с улучшенным сцеплением.' },
        iconName: 'Sun',
        icon: Sun
      },
      {
        id: 'maglev',
        slug: 'maglev',
        title: { az: 'MagLev', en: 'MagLev', ru: 'Маглев' },
        description: { az: 'Yaylar əvəzinə maqnit itələməsi istifadə edən sürtünməsiz sistem.', en: 'Frictionless system using magnetic repulsion instead of springs.', ru: 'Бессистемное трение с использованием магнитного отталкивания вместо пружин.' },
        iconName: 'Cpu',
        icon: Cpu
      },
      {
        id: 'ball-core',
        slug: 'ball-core',
        title: { az: 'Ball-Core (Nüvə Maqnitli)', en: 'Ball-Core', ru: 'Магнитное Ядро' },
        description: { az: 'Hər tərəfli fırlanma hissi verən 360 dərəcəlik nüvə maqnit sistemi.', en: '360-degree omnidirectional magnetic core for precise corner alignment.', ru: 'Магнитная сердцевина для точного выравнивания углов на 360 градусов.' },
        iconName: 'Atom',
        icon: Atom
      }
    ]
  },
  accessories: {
    id: 'accessories',
    slug: 'accessories',
    title: {
      az: 'Aksesuarlar',
      en: 'Accessories',
      ru: 'Аксессуары'
    },
    items: [
      {
        id: 'lubes',
        slug: 'lubes',
        title: { az: 'Yağlar (Lubes)', en: 'Lubes', ru: 'Смазки' },
        description: { az: 'Kubun sürətini və yumşaqlığını tənzimləmək üçün silikon yağlar.', en: 'Silicone and water-based lubes to adjust speed and smoothness.', ru: 'Силиконовые смазки для настройки скорости и плавности вращения.' },
        iconName: 'Droplet',
        icon: Droplet
      },
      {
        id: 'timers',
        slug: 'timers',
        title: { az: 'Taymerlər (Timers)', en: 'Timers', ru: 'Таймеры' },
        description: { az: 'Yarış səviyyəsində vaxtı ölçmək üçün sensorlu taymerlər.', en: 'High-precision professional timers to measure your solves.', ru: 'Высокоточные профессиональные таймеры для замера времени сборки.' },
        iconName: 'Timer',
        icon: Timer
      },
      {
        id: 'mats',
        slug: 'mats',
        title: { az: 'Xalçalar (Mats)', en: 'Mats', ru: 'Коврики' },
        description: { az: 'Kubları zərbədən və cızıqlardan qoruyan yumşaq masaaltı xalçalar.', en: 'Soft surface mats to protect cubes from impact and scratches.', ru: 'Мягкие коврики для защиты кубиков от ударов и царапин.' },
        iconName: 'Layers',
        icon: Layers
      },
      {
        id: 'bags',
        slug: 'bags',
        title: { az: 'Çantalar (Bags)', en: 'Bags', ru: 'Сумки' },
        description: { az: 'Kubları daşımaq və tozdan qorumaq üçün xüsusi çantalar.', en: 'Stylish pouches and bags to carry your puzzle collections.', ru: 'Стильные чехлы и сумки для переноски вашей коллекции.' },
        iconName: 'Briefcase',
        icon: Briefcase
      },
      {
        id: 'cases',
        slug: 'cases',
        title: { az: 'Qutular (Cases)', en: 'Cases', ru: 'Кейсы' },
        description: { az: 'Kubların formasını və mexanizmini tam təhlükəsiz qoruyan qablar.', en: 'Protective hard shells to keep your cubes safe from falls.', ru: 'Защитные жесткие кейсы для защиты кубиков от падений.' },
        iconName: 'Box',
        icon: Box
      },
      {
        id: 'parts',
        slug: 'parts',
        title: { az: 'Ehtiyat Hissələri (Parts)', en: 'Spare Parts', ru: 'Запасные части' },
        description: { az: 'İtmiş və ya zədələnmiş kub elementləri üçün ehtiyat hissələr.', en: 'Replacement pieces, tiles, centers, caps, or springs.', ru: 'Сменные детали, крышки, центры или пружины.' },
        iconName: 'Wrench',
        icon: Wrench
      },
      {
        id: 'mod-kits',
        slug: 'mod-kits',
        title: { az: 'Mod Kitləri (Mod Kits)', en: 'Mod Kits', ru: 'Мод-киты' },
        description: { az: 'Kubunuzu təkmilləşdirmək üçün əlavə maqnit və yay dəstləri.', en: 'Upgrade kits featuring additional magnets, springs, and tools.', ru: 'Комплекты для апгрейда с дополнительными магнитами и пружинами.' },
        iconName: 'Settings',
        icon: Settings
      }
    ]
  },
  specialCategories: {
    id: 'special-categories',
    slug: 'special-categories',
    title: {
      az: 'Xüsusi Kateqoriyalar və Xidmətlər',
      en: 'Special Categories & Services',
      ru: 'Специальные Категории и Услуги'
    },
    items: [
      {
        id: 'bundles',
        slug: 'bundles',
        title: { az: 'Dəstlər (Bundles)', en: 'Bundles', ru: 'Наборы' },
        description: { az: 'Xüsusi endirimlə təqdim olunan çoxlu kub dəstləri.', en: 'Multi-cube sets offered at a special combined discount.', ru: 'Наборы из нескольких кубиков со скидкой.' },
        iconName: 'Gift',
        icon: Gift
      },
      {
        id: 'clearance',
        slug: 'clearance',
        title: { az: 'Endirimlilər (Clearance)', en: 'Clearance', ru: 'Распродажа' },
        description: { az: 'Stokları bitən son məhsullara böyük endirimlər.', en: 'Massive clearance discounts on last stock items.', ru: 'Огромные скидки на последние товары на складе.' },
        iconName: 'Flame',
        icon: Flame
      },
      {
        id: 'preorder',
        slug: 'preorder',
        title: { az: 'Öncədən Sifariş (Preorder)', en: 'Pre-order', ru: 'Предзаказ' },
        description: { az: 'Dünya brendlərinin ən yeni kublarını hamıdan əvvəl əldə edin.', en: 'Secure the latest flagship puzzle releases before they arrive.', ru: 'Закажите новейшие флагманские головоломки до их поступления.' },
        iconName: 'CalendarClock',
        icon: CalendarClock
      },
      {
        id: 'wholesale',
        slug: 'wholesale',
        title: { az: 'Topdan Satış (Wholesale)', en: 'Wholesale', ru: 'Оптовая торговля' },
        description: { az: 'Məktəblər, dərnəklər və mağazalar üçün xüsusi topdan qiymətlər.', en: 'Special volume pricing for schools, clubs, and retailers.', ru: 'Специальные оптовые цены для школ, клубов и розничных продавцов.' },
        iconName: 'Building2',
        icon: Building2
      },
      {
        id: 'learning-content',
        slug: 'learning-content',
        title: { az: 'Öyrədici Materiallar (Learning)', en: 'Learning Content', ru: 'Обучение' },
        description: { az: 'Kubun sirlərini açmaq üçün dərsliklər və alqoritm kitabçaları.', en: 'Tutorial booklets, speedcubing guides, and custom books.', ru: 'Обучающие буклеты, руководства по спидкубингу и книги.' },
        iconName: 'BookOpen',
        icon: BookOpen
      },
      {
        id: 'sponsorship',
        slug: 'sponsorship',
        title: { az: 'Komanda və Sponsorluq', en: 'Team & Sponsorship', ru: 'Команда и Спонсорство' },
        description: { az: 'Yarışçılar üçün peşəkar dəstək və Rubikshop AZ sponsurluğu.', en: 'Sponsorship opportunities for active WCA competitors.', ru: 'Возможности спонсорства для действующих участников WCA.' },
        iconName: 'Users',
        icon: Users
      },
      {
        id: 'setup-service',
        slug: 'setup-service',
        title: { az: 'Quraşdırma Xidməti (Setup)', en: 'Premium Setup Service', ru: 'Премиум Настройка' },
        description: { az: 'Professional kub ustamız tərəfindən kubun gərginliyinin və kəsiklərinin tənzimlənməsi.', en: 'Custom puzzle tensioning, spring lubing, and fine-tuning by our master.', ru: 'Профессиональная настройка натяжения и регулировка от нашего мастера.' },
        iconName: 'Settings',
        icon: Settings
      },
      {
        id: 'lube-service',
        slug: 'lube-service',
        title: { az: 'Yağlama Xidməti (Lube)', en: 'Premium Lubrication Service', ru: 'Профессиональная смазка' },
        description: { az: 'Kubun sürətli və hamar fırlanması üçün xüsusi peşəkar yağlarla yağlanması.', en: 'Complete core and piece lubrication using high-performance specialized compounds.', ru: 'Полная смазка крестовины и деталей с использованием высокоэффективных составов.' },
        iconName: 'Droplet',
        icon: Droplet
      }
    ]
  }
};

// Array formats to easily map/iterate over categories in layouts, navigations or dynamic loops
export const rubikTaxonomyGroups = [
  rubikTaxonomy.puzzles,
  rubikTaxonomy.skillLevels,
  rubikTaxonomy.mechanics,
  rubikTaxonomy.accessories,
  rubikTaxonomy.specialCategories
];
