export interface MetroCategoryConfig {
  nearPrice: number;
  farPrice: number;
}

export const NEAR_METRO_STATIONS: string[] = [
  'Dərnəgül',
  'Azadlıq prospekti',
  'Nəsimi',
  'Memar Əcəmi (Yaşıl)',
  '20 Yanvar',
  'İnşaatçılar',
  'Elmlər Akademiyası',
  'Nizami',
  '28 May',
  'Gənclik'
];

export const FAR_METRO_STATIONS: string[] = [
  'Nərimanov',
  'Bakmil',
  'Ulduz',
  'Koroğlu',
  'Qara Qarayev',
  'Neftçilər',
  'Xalqlar Dostluğu',
  'Əhmədli',
  'Həzi Aslanov',
  'Sahil',
  'İçərişəhər',
  'Cəfər Cabbarlı',
  'Xətai',
  'Xocəsən',
  'Avtovağzal',
  'Memar Əcəmi (Bənövşəyi)',
  '8 Noyabr'
];

export const DEFAULT_METRO_PRICES: MetroCategoryConfig = {
  nearPrice: 1.00,
  farPrice: 2.00
};

export function getMetroStationCategory(stationName: string): 'near' | 'far' {
  if (!stationName) return 'near';
  const clean = stationName.trim().toLowerCase();
  
  const isNear = NEAR_METRO_STATIONS.some(st => {
    const stClean = st.toLowerCase();
    return clean === stClean || clean.includes(stClean) || stClean.includes(clean);
  });

  return isNear ? 'near' : 'far';
}

export function getMetroStationPrice(stationName: string, customPrices?: Partial<MetroCategoryConfig>): number {
  if (!stationName) return 0;
  const category = getMetroStationCategory(stationName);
  const nearPrice = customPrices?.nearPrice ?? DEFAULT_METRO_PRICES.nearPrice;
  const farPrice = customPrices?.farPrice ?? DEFAULT_METRO_PRICES.farPrice;
  return category === 'near' ? nearPrice : farPrice;
}
