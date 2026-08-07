'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart, Trash2, ArrowRight, Sparkles, LogIn } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useAuthModalStore } from '@/store/useAuthModalStore';
import { toggleWishlist } from '@/lib/actions/wishlist';
import { sanitizeImageUrl } from '@/lib/image';
import type { ApplicationDictionary } from '@/types/application.types';

interface WishlistItem {
  id: string;
  title: string;
  price_azn: number;
  image_url: string;
  stock_quantity: number;
  brand: string;
}

interface WishlistClientProps {
  locale: string;
  dict: ApplicationDictionary;
  initialItems: WishlistItem[];
  isLoggedIn: boolean;
}

export function WishlistClient({ locale, dict, initialItems, isLoggedIn }: WishlistClientProps) {
  const [items, setItems] = useState<WishlistItem[]>(initialItems);
  const addItem = useCartStore((state) => state.addItem);
  const openModal = useAuthModalStore((state) => state.openModal);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleRemove = async (id: string) => {
    setLoadingId(id);
    const res = await toggleWishlist(id);
    if (res.success) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
    setLoadingId(null);
  };

  const handleAddToCart = (item: WishlistItem) => {
    addItem({
      id: item.id,
      title: item.title,
      price_azn: item.price_azn,
      quantity: 1,
      image_url: item.image_url,
    });
  };

  const t = (az: string, en: string, ru: string) => {
    if (locale === 'en') return en;
    if (locale === 'ru') return ru;
    return az;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="border-b border-border pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
              <Heart className="h-6 w-6 text-rubik-brand fill-current" />
              <span>{t('Seçilmiş Məhsullar', 'My Favorites', 'Избранные товары')}</span>
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              {t(
                'Bəyəndiyiniz və gələcəkdə almağı düşündüyünüz professional sürətli kublar burada toplanır.',
                'The professional speedcubes you liked and planned to buy in the future are collected here.',
                'Профессиональные спидкубы, которые вам понравились и которые вы планируете купить в будущем.'
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-muted px-4 py-2 rounded-xl">
            <span>{items.length} {t('Məhsul', 'Products', 'Товаров')}</span>
          </div>
        </div>

        {/* Not Logged In State */}
        {!isLoggedIn ? (
          <div className="bg-card border border-border rounded-3xl p-8 lg:p-12 text-center max-w-xl mx-auto space-y-6 shadow-soft-md">
            <div className="inline-flex p-4 bg-rubik-brand/10 text-rubik-brand rounded-full">
              <Heart className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">
                {t('Hesabınıza daxil olun', 'Log in to your account', 'Войдите в свой аккаунт')}
              </h2>
              <p className="text-xs md:text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                {t(
                  'Seçilmiş məhsullar siyahınızı yadda saxlamaq və digər cihazlarınızda görmək üçün daxil olun.',
                  'Log in to save your favorite products list and see them on your other devices.',
                  'Войдите, чтобы сохранить список избранных товаров и видеть их на других ваших устройствах.'
                )}
              </p>
            </div>
            <button
              onClick={() => openModal('login')}
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-6 bg-rubik-brand hover:bg-rubik-brand-dark text-white text-sm font-black rounded-xl transition-all cursor-pointer shadow-soft-sm"
            >
              <LogIn className="h-4 w-4" />
              <span>{t('Daxil Ol / Qeydiyyat', 'Sign In / Register', 'Войти / Регистрация')}</span>
            </button>
          </div>
        ) : items.length === 0 ? (
          /* Empty State */
          <div className="bg-card border border-border rounded-3xl p-8 lg:p-12 text-center max-w-xl mx-auto space-y-6 shadow-soft-md">
            <div className="inline-flex p-4 bg-muted text-gray-400 rounded-full">
              <Heart className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">
                {t('Seçilmişlər siyahınız boşdur', 'Your favorites list is empty', 'Ваш список избранного пуст')}
              </h2>
              <p className="text-xs md:text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                {t(
                  'Sürətli kolleksiyalarımızdan bəyəndiyiniz kubları ürək düyməsinə basaraq bura əlavə edə bilərsiniz.',
                  'You can add cubes you like from our speedcubing collections here by clicking the heart button.',
                  'Вы можете добавлять понравившиеся кубики из наших коллекций сюда, нажимая на кнопку в виде сердца.'
                )}
              </p>
            </div>
            <Link
              href={`/${locale}/category/3x3`}
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-6 bg-rubik-brand hover:bg-rubik-brand-dark text-white text-sm font-black rounded-xl transition-all cursor-pointer shadow-soft-sm"
            >
              <span>{t('Kataloqa Keç', 'Browse Catalog', 'Перейти в каталог')}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          /* Wishlist Items Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between gap-4 shadow-soft-sm hover:border-rubik-brand/40 transition-all duration-300 group"
              >
                <div className="space-y-3">
                  {/* Image Container */}
                  <div className="relative aspect-square w-full rounded-xl bg-muted/20 border border-border/50 overflow-hidden flex items-center justify-center p-4">
                    {item.image_url ? (
                      <Image
                        src={sanitizeImageUrl(item.image_url, item.id)}
                        alt={item.title}
                        fill
                        className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Heart className="h-12 w-12 text-muted-foreground/30" />
                    )}
                  </div>

                  {/* Brand & Title */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-rubik-brand uppercase tracking-wider">
                      {item.brand}
                    </span>
                    <h2 className="text-sm md:text-base font-bold text-foreground leading-snug line-clamp-2 min-h-[2.5rem]">
                      {item.title}
                    </h2>
                  </div>
                </div>

                <div className="space-y-4 pt-2 border-t border-border/60">
                  {/* Price */}
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black text-foreground font-mono">
                      {item.price_azn.toFixed(2)}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">AZN</span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleAddToCart(item)}
                      disabled={item.stock_quantity <= 0}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-rubik-brand hover:bg-rubik-brand-dark disabled:bg-muted disabled:text-muted-foreground text-white text-xs font-black rounded-xl transition-colors cursor-pointer"
                      aria-label={t('Səbətə əlavə et', 'Add to cart', 'В корзину')}
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      <span>
                        {item.stock_quantity > 0
                          ? t('Səbətə At', 'Add to Cart', 'В корзину')
                          : t('Bitib', 'Out of Stock', 'Нет')}
                      </span>
                    </button>
                    <button
                      onClick={() => handleRemove(item.id)}
                      disabled={loadingId === item.id}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-muted hover:bg-red-500/10 hover:text-red-500 text-muted-foreground text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      aria-label={t('Seçilmişlərdən sil', 'Remove from favorites', 'Удалить из избранного')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{t('Sil', 'Remove', 'Удалить')}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
