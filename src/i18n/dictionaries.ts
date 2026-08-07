import 'server-only';
import type { ApplicationDictionary } from '@/types/application.types';

const dictionaries: Record<string, () => Promise<ApplicationDictionary>> = {
  az: () => import('../../messages/az.json').then((module) => module.default),
  en: () => import('../../messages/en.json').then((module) => module.default),
  ru: () => import('../../messages/ru.json').then((module) => module.default),
};

export const getDictionary = async (locale: string): Promise<ApplicationDictionary> => {
  const safeLocale = dictionaries[locale] ? locale : 'az';
  return dictionaries[safeLocale]();
};
