'use client';

import * as React from 'react';
import { signIn } from '@/lib/actions/auth';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { sanitizeImageUrl } from '@/lib/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag,
  User,
  Phone,
  Mail,
  MapPin,
  Truck,
  CreditCard,
  Gift,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Check,
  Percent,
  Lock,
  Wallet,
  Building,
  Loader2,
  Clock
} from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { submitOrderAtomic } from '@/lib/actions/order';
import { validateCoupon } from '@/lib/actions/coupons';
import { validateGiftCard } from '@/lib/actions/gift-cards';
import type { ApplicationDictionary } from '@/types/application.types';

interface CheckoutFormProps {
  dict: ApplicationDictionary;
  locale: string;
}

import { NEAR_METRO_STATIONS, FAR_METRO_STATIONS, getMetroStationCategory, getMetroStationPrice } from '@/lib/constants/delivery';

export function CheckoutForm({ dict, locale }: CheckoutFormProps) {
  const router = useRouter();
  const {
    items,
    appliedCoupon,
    clearCart
  } = useCartStore();

  const t = React.useCallback((obj: { az: string; en: string; ru: string }) => {
    return obj[locale as keyof typeof obj] || obj.az;
  }, [locale]);

  // Authentication State
  const [checkoutMode, setCheckoutMode] = React.useState<'guest' | 'login'>('guest');
  const [loginEmail, setLoginEmail] = React.useState('');
  const [loginPassword, setLoginPassword] = React.useState('');
  const [authError, setAuthError] = React.useState('');
  const [isAuthLoading, setIsAuthLoading] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  // Form Field States
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [address, setAddress] = React.useState('');

  // Auto-detect logged-in user session
  React.useEffect(() => {
    const supabaseClient = createClient();
    async function loadActiveSession() {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user) {
          setIsLoggedIn(true);
          setCheckoutMode('login');
          if (user.email) {
            setLoginEmail(user.email);
            setEmail(user.email);
          }
          if (user.user_metadata?.full_name) {
            setName(user.user_metadata.full_name);
          }
          if (user.user_metadata?.phone) {
            setPhone(user.user_metadata.phone);
          }
        }
      } catch (err) {
        console.error('Error fetching auth user in checkout:', err);
      }
    }
    loadActiveSession();
  }, []);
  
  // Delivery Location & Options
  const [locationZone, setLocationZone] = React.useState<'baku' | 'region'>('baku');
  const [bakuDeliveryMethod, setBakuDeliveryMethod] = React.useState<'metro' | 'baku_address'>('metro');
  const [selectedMetroStation, setSelectedMetroStation] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState<'bank_transfer' | 'cod'>('bank_transfer');
  
  // Extra Checkout Perks
  const [isGift, setIsGift] = React.useState(false);
  const [giftNote, setGiftNote] = React.useState('');
  const [termsAccepted, setTermsAccepted] = React.useState(false);

  // Validation & Loading States
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [couponInput, setCouponInput] = React.useState('');
  const { applyCoupon, getOriginalTotalPrice, getProductSavings } = useCartStore();

  const subtotal = useCartStore((state) => state.items.reduce((total, item) => total + item.price_azn * item.quantity, 0));
  const origSubtotal = useCartStore((state) => state.getOriginalTotalPrice());
  const productSavings = useCartStore((state) => state.getProductSavings());
  const hasPreorderItems = React.useMemo(() => items.some(item => item.is_preorder), [items]);

  React.useEffect(() => {
    if (hasPreorderItems && paymentMethod === 'cod') {
      setPaymentMethod('bank_transfer');
    }
  }, [hasPreorderItems, paymentMethod]);
  const discountAmount = useCartStore((state) => {
    const subtotal = state.items.reduce((total, item) => total + item.price_azn * item.quantity, 0);
    if (state.discountType === 'percentage') return (subtotal * state.discountValue) / 100;
    if (state.discountType === 'fixed') return state.discountValue;
    return 0;
  });

  // Load settings from Supabase
  const [waNumber, setWaNumber] = React.useState('994506684925');
  const [metroPrices, setMetroPrices] = React.useState({
    nearPrice: 1.00,
    farPrice: 2.00
  });

  React.useEffect(() => {
    async function fetchCheckoutSettings() {
      try {
        const { getSettings } = await import('@/lib/actions/settings');
        const [paymentRes, shippingRes] = await Promise.all([
          getSettings('payment'),
          getSettings('shipping')
        ]);
        if (paymentRes.success && paymentRes.data?.whatsappNumber) {
          const raw = paymentRes.data.whatsappNumber.replace(/[^0-9]/g, '');
          setWaNumber(raw ? raw : '994506684925');
        }
        if (shippingRes.success && shippingRes.data) {
          if (shippingRes.data.nearMetroPrice !== undefined) {
            setMetroPrices({
              nearPrice: Number(shippingRes.data.nearMetroPrice) || 1.00,
              farPrice: Number(shippingRes.data.farMetroPrice) || 2.00
            });
          }
        }
      } catch (err) {
        console.error('Error fetching checkout settings:', err);
      }
    }
    fetchCheckoutSettings();
  }, []);

  const shippingCost = React.useMemo(() => {
    if (locationZone === 'baku') {
      if (bakuDeliveryMethod === 'metro') {
        if (!selectedMetroStation) return 0;
        return getMetroStationPrice(selectedMetroStation, metroPrices);
      }
      return 0; // Ünvana çatdırılma - WhatsApp-da razılaşdırılır
    }
    return 0; // Bakı xarici (rayon) - WhatsApp-da razılaşdırılır
  }, [locationZone, bakuDeliveryMethod, selectedMetroStation, metroPrices]);

  const [couponError, setCouponError] = React.useState('');
  const [isCouponLoading, setIsCouponLoading] = React.useState(false);
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponError('');
    setIsCouponLoading(true);
    
    const res = await validateCoupon(couponInput, subtotal);
    if (res.success && res.coupon) {
      applyCoupon(res.coupon.code, res.coupon.discount_type as any, res.coupon.discount_value);
      setCouponInput('');
    } else {
      const gcRes = await validateGiftCard(couponInput);
      if (gcRes.success && gcRes.giftCard) {
        applyCoupon(gcRes.giftCard.code, 'fixed', gcRes.giftCard.current_balance);
        setCouponInput('');
      } else {
        setCouponError(res.error || gcRes.error || t({
          az: 'Daxil edilən kod keçərsizdir.',
          en: 'The code entered is invalid.',
          ru: 'Введенный код недействителен.'
        }));
      }
    }
    setIsCouponLoading(false);
  };

  const totalAmount = React.useMemo(() => {
    return Math.max(0, subtotal - discountAmount) + shippingCost;
  }, [subtotal, discountAmount, shippingCost]);

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="p-4 bg-rubik-brand/10 text-rubik-brand rounded-full">
          <ShoppingBag className="h-12 w-12" />
        </div>
        <h2 className="text-xl font-black text-foreground uppercase tracking-wide">
          {dict.cart.empty}
        </h2>
        <p className="text-xs text-muted-foreground max-w-sm">
          {t({
            az: 'Çatdırılma qeydiyyatı etmək üçün zəhmət olmasa səbətinizə məhsul əlavə edin. Sürətli kubları kəşf edib rekordlarınızı yeniləyin!',
            en: 'Please add products to your cart to register delivery. Discover speedcubes and renew your records!',
            ru: 'Пожалуйста, добавьте товары в корзину для оформления доставки. Откройте для себя скоростные кубики и обновите свои рекорды!'
          })}
        </p>
        <Link
          href={`/${locale}`}
          className="inline-flex items-center justify-center px-6 py-3 bg-rubik-brand hover:bg-rubik-brand-dark text-white font-black text-xs rounded-xl hover:shadow-soft-md transition-all cursor-pointer gap-2"
        >
          <span>{t({ az: 'Kataloqa keçid', en: 'Go to Catalog', ru: 'Перейти в каталог' })}</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthLoading(true);

    try {
      const supabaseClient = createClient();
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        setAuthError(error.message || t({
          az: 'İstifadəçi adı və ya şifrə yanlışdır.',
          en: 'Invalid email or password.',
          ru: 'Неверный email или пароль.'
        }));
        setIsAuthLoading(false);
        return;
      }

      if (data?.user) {
        setIsLoggedIn(true);
        if (data.user.email) {
          setEmail(data.user.email);
        }
        if (data.user.user_metadata?.full_name) {
          setName(data.user.user_metadata.full_name);
        }
        if (data.user.user_metadata?.phone) {
          setPhone(data.user.user_metadata.phone);
        }
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Giriş zamanı xəta baş verdi.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!name.trim()) {
      errors.name = dict.checkout?.validation_name_required || t({
        az: 'Ad və Soyad sahəsi mütləqdir.',
        en: 'Name and Surname is required.',
        ru: 'Имя и Фамилия обязательны для заполнения.'
      });
    } else if (name.trim().length < 2) {
      errors.name = t({
        az: 'Zəhmət olmasa ən azı 2 simvoldan ibarət ad qeyd edin.',
        en: 'Please enter a name of at least 2 characters.',
        ru: 'Пожалуйста, введите имя не менее чем из 2 символов.'
      });
    }

    const cleanPhone = phone.replace(/\s+/g, '');
    let formattedPhone = cleanPhone;
    if (cleanPhone.startsWith('0')) {
      formattedPhone = '+994' + cleanPhone.slice(1);
    } else if (cleanPhone.startsWith('994')) {
      formattedPhone = '+' + cleanPhone;
    } else if (!cleanPhone.startsWith('+') && cleanPhone) {
      formattedPhone = '+994' + cleanPhone;
    }

    if (!cleanPhone) {
      errors.phone = dict.checkout?.validation_phone_required || t({
        az: 'Mobil nömrə sahəsi mütləqdir.',
        en: 'Mobile number is required.',
        ru: 'Мобильный номер обязателен.'
      });
    } else if (!/^\+994(50|51|55|70|77|99|10|60)[0-9]{7}$/.test(formattedPhone)) {
      errors.phone = t({
        az: 'Doğru Azərbaycan nömrəsi daxil edin. Məs: +994501234567',
        en: 'Enter a valid Azerbaijani number. E.g.: +994501234567',
        ru: 'Введите корректный азербайджанский номер. Напр: +994501234567'
      });
    }

    if (locationZone === 'baku') {
      if (bakuDeliveryMethod === 'metro') {
        if (!selectedMetroStation) {
          errors.metroStation = dict.checkout?.validation_metro_required || t({
            az: 'Zəhmət olmasa çatdırılma üçün metro stansiyasını seçin.',
            en: 'Please select a metro station for delivery.',
            ru: 'Пожалуйста, выберите станцию метро для доставки.'
          });
        }
      } else {
        if (!address.trim()) {
          errors.address = dict.checkout?.validation_address_required || t({
            az: 'Çatdırılma ünvanı mütləqdir.',
            en: 'Delivery address is required.',
            ru: 'Адрес доставки обязателен.'
          });
        } else if (address.trim().length < 5) {
          errors.address = t({
            az: 'Zəhmət olmasa daha ətraflı ünvan daxil edin (ən azı 5 simvol).',
            en: 'Please enter a more detailed address (at least 5 characters).',
            ru: 'Пожалуйста, введите более подробный адрес (не менее 5 символов).'
          });
        }
      }
    } else {
      if (!address.trim()) {
        errors.address = t({
          az: 'Çatdırılma ünvanı / Rayon adı mütləqdir.',
          en: 'Delivery address / District name is required.',
          ru: 'Адрес доставки / Название района обязательно.'
        });
      } else if (address.trim().length < 5) {
        errors.address = t({
          az: 'Zəhmət olmasa ünvan/rayon məlumatını daha ətraflı qeyd edin (ən azı 5 simvol).',
          en: 'Please enter address/district details in more detail (at least 5 characters).',
          ru: 'Пожалуйста, укажите адрес/район подробнее (не менее 5 символов).'
        });
      }
    }

    if (!termsAccepted) {
      errors.terms = dict.checkout?.validation_terms_required || t({
        az: 'Sifariş üçün alış-veriş şərtlərini qəbul etməlisiniz.',
        en: 'You must accept the terms and conditions to order.',
        ru: 'Вы должны принять условия покупки для совершения заказа.'
      });
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsProcessing(true);

    try {
      const cleanPhone = phone.replace(/\s+/g, '');
      let formattedPhone = cleanPhone;
      if (cleanPhone.startsWith('0')) {
        formattedPhone = '+994' + cleanPhone.slice(1);
      } else if (cleanPhone.startsWith('994')) {
        formattedPhone = '+' + cleanPhone;
      } else if (!cleanPhone.startsWith('+')) {
        formattedPhone = '+994' + cleanPhone;
      }

      const tMsg = {
        title: t({ az: 'YENİ SİFARİŞ', en: 'NEW ORDER', ru: 'НОВЫЙ ЗАКАЗ' }),
        customer: t({ az: 'Müştəri', en: 'Customer', ru: 'Клиент' }),
        phone: t({ az: 'Telefon', en: 'Phone', ru: 'Телефон' }),
        emailLabel: t({ az: 'E-poçt', en: 'Email', ru: 'Эл. Почта' }),
        delivery: t({ az: 'Çatdırılma Metodu', en: 'Delivery Method', ru: 'Метод Доставки' }),
        address: t({ az: 'Ünvan', en: 'Address', ru: 'Адрес' }),
        metro: t({ az: 'Görüş stansiyası', en: 'Metro Station', ru: 'Станция Метро' }),
        gift: t({ az: 'Hədiyyə Qeydi', en: 'Gift Note', ru: 'Подарочная Запись' }),
        products: t({ az: 'Sifariş Məhsulları', en: 'Ordered Products', ru: 'Товары в Заказе' }),
        coupon: t({ az: 'Kupon', en: 'Coupon', ru: 'Купон' }),
        payment: t({ az: 'Ödəniş Metodu', en: 'Payment Method', ru: 'Метод Оплаты' }),
        paymentBank: t({ az: 'Kartdan Karta (Bank köçürməsi)', en: 'Card Transfer (Bank Transfer)', ru: 'Перевод на Карту (Банковский перевод)' }),
        paymentCod: t({ az: 'Qapıda Nəğd Ödəniş', en: 'Cash on Delivery', ru: 'Оплата наличными при получении' }),
        total: t({ az: 'Yekun Cəm', en: 'Total Amount', ru: 'Итоговая Сумма' }),
        footer: t({
          az: 'Zəhmət olmasa, sifarişi təsdiqləmək və çatdırılmanı təşkil etmək üçün bu mesajı bizə göndərin.',
          en: 'Please send this message to us to confirm the order and arrange delivery.',
          ru: 'Пожалуйста, отправьте это сообщение нам, чтобы подтвердить заказ и организовать доставку.'
        })
      };

      let deliveryMethodName = '';
      let deliveryAddressText = '';

      if (locationZone === 'baku') {
        if (bakuDeliveryMethod === 'metro') {
          const category = getMetroStationCategory(selectedMetroStation);
          const tariffText = category === 'near' ? 'Yaxın stansiya (1 AZN)' : 'Uzaq stansiya (2 AZN)';
          deliveryMethodName = `Metroya Çatdırılma (${selectedMetroStation})`;
          deliveryAddressText = `${selectedMetroStation} Metrosu (${tariffText})`;
        } else {
          deliveryMethodName = 'Bakı Daxili Ünvana Çatdırılma';
          deliveryAddressText = address.trim();
        }
      } else {
        deliveryMethodName = 'Bakı Xarici (Poçt/Kargo ilə Çatdırılma)';
        deliveryAddressText = address.trim();
      }

      const activeEmail = email.trim() || loginEmail.trim();

      const payload = {
        customer_name: name.trim(),
        customer_phone: formattedPhone,
        customer_email: activeEmail || undefined,
        customer_instagram: activeEmail || 'Yoxdur',
        delivery_address: deliveryAddressText,
        delivery_method: deliveryMethodName,
        total_amount_azn: totalAmount,
        checkout_platform: 'whatsapp' as const,
        subtotal: subtotal,
        discount: discountAmount,
        shipping_fee: shippingCost,
        coupon_code: appliedCoupon || null,
        items: items.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price_azn: item.price_azn,
          subtotal_azn: item.price_azn * item.quantity
        }))
      };

      const response = await submitOrderAtomic(payload);

      if (response.success && response.orderId) {
        const rawCode = String(response.orderId).substring(0, 6).toUpperCase();
        const preorderCode = `RC2026${rawCode}`;
        
        let message = `🔴 *RUBIKSHOP.AZ - ${tMsg.title} (${preorderCode})* 🔴\n\n`;
        message += `🎫 *Sifariş / Ön Sifariş Kodu:* ${preorderCode}\n`;
        message += `👤 *${tMsg.customer}:* ${name.trim()}\n`;
        message += `📞 *${tMsg.phone}:* ${formattedPhone}\n`;
        if (activeEmail) {
          message += `📧 *${tMsg.emailLabel}:* ${activeEmail}\n`;
        }
        message += `\n`;
        
        message += `🏙️ *Şəhər / Məkan:* ${locationZone === 'baku' ? 'Bakı daxili' : 'Bakı xarici (rayon)'}\n`;
        message += `🚚 *${tMsg.delivery}:* ${deliveryMethodName}\n`;

        if (locationZone === 'baku' && bakuDeliveryMethod === 'metro') {
          const category = getMetroStationCategory(selectedMetroStation);
          message += `📍 *${tMsg.metro}:* ${selectedMetroStation} Metrosu (${category === 'near' ? 'Yaxın stansiya - 1 AZN' : 'Uzaq stansiya - 2 AZN'})\n`;
          message += `💰 *Çatdırılma Haqqı:* ${shippingCost.toFixed(2)} AZN\n`;
        } else if (locationZone === 'baku' && bakuDeliveryMethod === 'baku_address') {
          message += `📍 *${tMsg.address}:* ${address.trim()}\n`;
          message += `ℹ️ *Çatdırılma haqqı:* WhatsApp-da sizinlə razılaşdırılacaq\n`;
        } else {
          message += `📍 *Ünvan / Rayon:* ${address.trim()}\n`;
          message += `ℹ️ *Çatdırılma üsulu və haqqı:* WhatsApp-da sizinlə razılaşdırılacaq\n`;
        }
        
        if (isGift && giftNote) {
          message += `🎁 *${tMsg.gift}:* "${giftNote}"\n`;
        }
        
        message += `\n📦 *${tMsg.products}:*\n`;
        items.forEach((item) => {
          const preNote = item.is_preorder 
            ? ` [${t({ az: 'ÖN SİFARİŞ', en: 'PRE-ORDER', ru: 'ПРЕДЗАКАЗ' })} - ${
                locale === 'en' 
                  ? (item.preorder_lead_time || '14-28 business days').replace(/14-28 iş günü/g, '14-28 business days').replace(/iş günü/g, 'business days').replace(/gün/g, 'days')
                  : locale === 'ru'
                  ? (item.preorder_lead_time || '14-28 рабочих дней').replace(/14-28 iş günü/g, '14-28 рабочих дней').replace(/iş günü/g, 'рабочих дней').replace(/gün/g, 'дней')
                  : (item.preorder_lead_time || '14-28 iş günü')
              }]` 
            : '';
          message += `• ${item.title}${preNote} (x${item.quantity}) — ${(item.price_azn * item.quantity).toFixed(2)} AZN\n`;
        });

        if (hasPreorderItems) {
          message += `\n⏳ *${t({ az: 'ƏSAS QEYD', en: 'IMPORTANT NOTE', ru: 'ВАЖНОЕ ПРИМЕЧАНИЕ' })}:* ${t({
            az: 'Bu sifarişdə ön sifariş məhsulları mövcuddur (Çatdırılma: 14-28 iş günü). WhatsApp üzərindən 100% ön ödəniş tələb olunur.',
            en: 'This order contains pre-order items (Delivery: 14-28 business days). 100% advance payment via WhatsApp is required.',
            ru: 'В этом заказе есть товары по предзаказу (Доставка: 14-28 рабочих дней). Требуется 100% предоплата через WhatsApp.'
          })}\n`;
        }

        if (appliedCoupon) {
          message += `\n🎫 *${tMsg.coupon}:* ${appliedCoupon} (-${discountAmount.toFixed(2)} AZN)\n`;
        }
        
        message += `\n💳 *${tMsg.payment}:* ${paymentMethod === 'bank_transfer' ? tMsg.paymentBank : tMsg.paymentCod}\n`;
        message += `💰 *${tMsg.total}:* *${totalAmount.toFixed(2)} AZN*\n\n`;
        message += `⚡ _${tMsg.footer}_`;

        const encodedMessage = encodeURIComponent(message);
        const waLink = `https://wa.me/${waNumber}?text=${encodedMessage}`;

        clearCart();

        if (typeof window !== 'undefined') {
          window.open(waLink, '_blank');
          router.push(`/${locale}/checkout/success?orderId=${response.orderId}&payment=${paymentMethod}&total=${totalAmount.toFixed(2)}&name=${encodeURIComponent(name)}`);
        }
      } else {
        setIsProcessing(false);
        setValidationErrors({
          submit: response.error || t({
            az: 'Sifariş qeyd edilərkən xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.',
            en: 'An error occurred while placing the order. Please try again.',
            ru: 'Произошла ошибка при оформлении заказа. Пожалуйста, попробуйте еще раз.'
          })
        });
      }
    } catch (err: any) {
      setIsProcessing(false);
      setValidationErrors({
        submit: t({
          az: 'Gözlənilməyən xəta baş verdi. İnternet əlaqənizi yoxlayın.',
          en: 'An unexpected error occurred. Please check your internet connection.',
          ru: 'Произошла непредвиденная ошибка. Пожалуйста, проверьте интернет-соединение.'
        })
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
      {/* Back button */}
      <div className="mb-8">
        <Link
          href={`/${locale}/cart`}
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-rubik-brand transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t({ az: 'Səbətə qayıt', en: 'Back to Cart', ru: 'Назад в корзину' })}</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Steps */}
        <div className="lg:col-span-8 space-y-8">
          
          {hasPreorderItems && (
            <div className="p-5 bg-amber-500/10 border-2 border-amber-500/40 rounded-3xl space-y-2 text-amber-900 dark:text-amber-300 shadow-soft-sm">
              <div className="flex items-center gap-2 font-black text-xs md:text-sm text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                <span>{t({ az: 'SƏBƏTDƏ ÖN SİFARİŞ MƏHSULU MÖVCUDDUR', en: 'PRE-ORDER ITEM IN CART', ru: 'В КОРЗИНЕ ЕСТЬ ТОВАР ПО ПРЕДЗАКАЗУ' })}</span>
              </div>
              <p className="text-xs md:text-sm font-bold leading-relaxed">
                {t({
                  az: 'Səbətinizdə ön sifarişlə təmin edilən məhsullar var. Çatdırılma müddəti 14-28 iş günüdür. Ön sifarişin rəsmiləşdirilməsi üçün WhatsApp vasitəsilə 100% ön ödəniş tələb olunur (Qapıda ödəniş seçimi deaktivdir).',
                  en: 'Your cart contains pre-order items. Delivery time is 14-28 business days. 100% advance payment via WhatsApp is required for pre-orders (Cash on delivery disabled).',
                  ru: 'В вашей корзине есть товары по предзаказу. Срок доставки составляет 14-28 рабочих дней. Для оформления предзаказа требуется 100% предоплата через WhatsApp (Оплата при получении отключена).'
                })}
              </p>
            </div>
          )}

          {/* Guest / Account Choice Step */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-soft-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rubik-brand text-white text-xs font-black">
                  1
                </span>
                <h2 className="text-base font-black text-foreground uppercase tracking-wider">
                  {t({ az: 'Müştəri məlumatları', en: 'Customer Information', ru: 'Информация о клиенте' })}
                </h2>
              </div>

              {!isLoggedIn && (
                <div className="flex bg-muted p-1 rounded-xl border border-border">
                  <button
                    onClick={() => setCheckoutMode('guest')}
                    className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                      checkoutMode === 'guest'
                        ? 'bg-card text-foreground shadow-soft-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t({ az: 'Qonaq qismində', en: 'As Guest', ru: 'Как Гость' })}
                  </button>
                  <button
                    onClick={() => setCheckoutMode('login')}
                    className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                      checkoutMode === 'login'
                        ? 'bg-card text-foreground shadow-soft-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t({ az: 'Daxil olmaqla', en: 'With Login', ru: 'С Входом' })}
                  </button>
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {isLoggedIn ? (
                <motion.div
                  key="logged-in"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="text-xs font-bold text-green-900">
                        {t({ az: 'Hesabınıza daxil olmusunuz', en: 'Logged in successfully', ru: 'Вы вошли в систему' })}
                      </p>
                      <p className="text-[10px] text-green-700">
                        {t({ az: 'Məlumatlarınız avtomatik olaraq dolduruldu.', en: 'Your info was auto-filled.', ru: 'Ваши данные были заполнены автоматически.' })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsLoggedIn(false);
                      setName('');
                      setPhone('');
                      setAddress('');
                    }}
                    className="text-[10px] text-green-800 underline font-bold hover:text-green-950"
                  >
                    {t({ az: 'Çıxış et', en: 'Sign Out', ru: 'Выйти' })}
                  </button>
                </motion.div>
              ) : checkoutMode === 'login' ? (
                <motion.form
                  key="login-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleLogin}
                  className="space-y-4 max-w-md"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                        {t({ az: 'E-poçt ünvanı', en: 'Email Address', ru: 'Эл. Почта' })}
                      </label>
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="example@rubikshop.az"
                        className="w-full bg-muted border border-border rounded-xl px-3.5 py-2.5 text-[16px] text-foreground focus:outline-none focus:ring-1 focus:ring-rubik-brand"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                        {t({ az: 'Şifrə', en: 'Password', ru: 'Пароль' })}
                      </label>
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-muted border border-border rounded-xl px-3.5 py-2.5 text-[16px] text-foreground focus:outline-none focus:ring-1 focus:ring-rubik-brand"
                      />
                    </div>
                  </div>
                  {authError && <p className="text-xs text-red-600 font-bold">{authError}</p>}
                  <button
                    type="submit"
                    disabled={isAuthLoading}
                    className="px-5 py-2.5 bg-foreground text-card hover:bg-rubik-brand hover:text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {isAuthLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
                    <span>{t({ az: 'Daxil ol və Doldur', en: 'Login & Autofill', ru: 'Войти и заполнить' })}</span>
                  </button>
                </motion.form>
              ) : (
                <motion.div
                  key="guest-inputs"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <User className="h-3 w-3" /> {dict.checkout?.name || "Ad və Soyad"} *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={dict.checkout?.name_placeholder || "Məs: Mirsəlim Şahbazov"}
                      className={`w-full bg-muted border rounded-xl px-3.5 py-2.5 text-[16px] text-foreground focus:outline-none focus:ring-1 focus:ring-rubik-brand ${
                        validationErrors.name ? 'border-red-500 bg-red-50/10' : 'border-border'
                      }`}
                    />
                    {validationErrors.name && (
                      <p className="text-[9px] text-red-600 font-bold flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {validationErrors.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {dict.checkout?.phone || "Mobil Nömrə"} *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={dict.checkout?.phone_placeholder || "+994 50 123 45 67"}
                      className={`w-full bg-muted border rounded-xl px-3.5 py-2.5 text-[16px] text-foreground focus:outline-none focus:ring-1 focus:ring-rubik-brand ${
                        validationErrors.phone ? 'border-red-500 bg-red-50/10' : 'border-border'
                      }`}
                    />
                    {validationErrors.phone && (
                      <p className="text-[9px] text-red-600 font-bold flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {validationErrors.phone}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {t({ az: 'E-poçt Ünvanı', en: 'Email Address', ru: 'Эл. Почта' })}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@rubikshop.az (Könüllü)"
                      className="w-full bg-muted border border-border rounded-xl px-3.5 py-2.5 text-[16px] text-foreground focus:outline-none focus:ring-1 focus:ring-rubik-brand"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Delivery & Shipping Method */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-soft-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rubik-brand text-white text-xs font-black">
                2
              </span>
              <h2 className="text-base font-black text-foreground uppercase tracking-wider">
                {dict.checkout?.delivery_details || "Çatdırılma detalları"}
              </h2>
            </div>

            {/* Step 1: City / Location Selection */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider block">
                {t({ az: 'Çatdırılma Bölgəsi', en: 'Delivery Region', ru: 'Регион Доставки' })} *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setLocationZone('baku')}
                  className={`p-4 rounded-2xl border text-left transition-all relative cursor-pointer flex items-center justify-between ${
                    locationZone === 'baku'
                      ? 'border-rubik-brand bg-rubik-brand/5 ring-1 ring-rubik-brand'
                      : 'border-border hover:border-foreground/10 bg-background'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rubik-brand/10 text-rubik-brand rounded-xl">
                      <Building className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-foreground">Bakı daxili</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Metro və ya ünvana çatdırılma</p>
                    </div>
                  </div>
                  {locationZone === 'baku' && (
                    <span className="text-rubik-brand bg-white p-1 rounded-full border border-rubik-brand">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setLocationZone('region')}
                  className={`p-4 rounded-2xl border text-left transition-all relative cursor-pointer flex items-center justify-between ${
                    locationZone === 'region'
                      ? 'border-rubik-brand bg-rubik-brand/5 ring-1 ring-rubik-brand'
                      : 'border-border hover:border-foreground/10 bg-background'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-foreground">Bakı xarici (rayon)</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Poçt və ya Kargo vasitəsilə</p>
                    </div>
                  </div>
                  {locationZone === 'region' && (
                    <span className="text-rubik-brand bg-white p-1 rounded-full border border-rubik-brand">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Step 2: Delivery Method Selection */}
            <AnimatePresence mode="wait">
              {locationZone === 'baku' ? (
                <motion.div
                  key="baku-options"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-5 pt-2 border-t border-border/60"
                >
                  <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider block">
                    {t({ az: 'Çatdırılma Üsulu', en: 'Delivery Method', ru: 'Способ Доставки' })} *
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Option 1: Metroya çatdırılma */}
                    <button
                      type="button"
                      onClick={() => setBakuDeliveryMethod('metro')}
                      className={`p-4 rounded-2xl border text-left transition-all relative cursor-pointer ${
                        bakuDeliveryMethod === 'metro'
                          ? 'border-rubik-brand bg-rubik-brand/5 ring-1 ring-rubik-brand'
                          : 'border-border hover:border-foreground/10 bg-background'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg">
                          <Building className="h-4.5 w-4.5" />
                        </div>
                        {bakuDeliveryMethod === 'metro' && (
                          <span className="text-rubik-brand bg-white p-0.5 rounded-full border border-rubik-brand">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-black text-foreground">1. Metroya çatdırılma</h4>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-normal">
                        Sabit tarif, stansiyadan asılı olaraq avtomatik hesablanır.
                      </p>
                      <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                        <span>1.00 AZN - 2.00 AZN</span>
                      </div>
                    </button>

                    {/* Option 2: Ünvana çatdırılma */}
                    <button
                      type="button"
                      onClick={() => setBakuDeliveryMethod('baku_address')}
                      className={`p-4 rounded-2xl border text-left transition-all relative cursor-pointer ${
                        bakuDeliveryMethod === 'baku_address'
                          ? 'border-rubik-brand bg-rubik-brand/5 ring-1 ring-rubik-brand'
                          : 'border-border hover:border-foreground/10 bg-background'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="p-1.5 bg-blue-500/10 text-blue-600 rounded-lg">
                          <MapPin className="h-4.5 w-4.5" />
                        </div>
                        {bakuDeliveryMethod === 'baku_address' && (
                          <span className="text-rubik-brand bg-white p-0.5 rounded-full border border-rubik-brand">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-black text-foreground">2. Ünvana çatdırılma</h4>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-normal">
                        Kuryer vasitəsilə birbaşa ünvanınıza təhvil verilir.
                      </p>
                      <span className="block mt-3 text-[10px] text-amber-600 font-bold">
                        Haqqı WhatsApp-da razılaşdırılacaq
                      </span>
                    </button>
                  </div>

                  {/* Input Fields according to Baku choice */}
                  {bakuDeliveryMethod === 'metro' ? (
                    <div className="space-y-2 pt-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Building className="h-3.5 w-3.5 text-emerald-600" /> Metro stansiyasını seçin *
                      </label>
                      <select
                        value={selectedMetroStation}
                        onChange={(e) => setSelectedMetroStation(e.target.value)}
                        className={`w-full bg-background border rounded-xl px-3.5 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-rubik-brand ${
                          validationErrors.metroStation ? 'border-red-500 bg-red-50/10' : 'border-border'
                        }`}
                      >
                        <option value="">-- Metro stansiyası seçin --</option>
                        <optgroup label="🟢 Yaxın stansiyalar — 1.00 AZN">
                          {NEAR_METRO_STATIONS.map((st) => (
                            <option key={st} value={st}>
                              {st} stansiyası (1.00 AZN)
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="🔵 Uzaq stansiyalar — 2.00 AZN">
                          {FAR_METRO_STATIONS.map((st) => (
                            <option key={st} value={st}>
                              {st} stansiyası (2.00 AZN)
                            </option>
                          ))}
                        </optgroup>
                      </select>

                      {selectedMetroStation && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex justify-between items-center font-bold">
                          <span>📍 Seçilmiş Stansiya: <strong>{selectedMetroStation} Metrosu</strong></span>
                          <span className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-[11px] font-mono">
                            +{getMetroStationPrice(selectedMetroStation, metroPrices).toFixed(2)} AZN
                          </span>
                        </div>
                      )}

                      {validationErrors.metroStation && (
                        <p className="text-[9px] text-red-600 font-bold flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {validationErrors.metroStation}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 pt-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-blue-600" /> Çatdırılma Ünvanı *
                      </label>
                      <textarea
                        rows={3}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Məsələn: Nizami küçəsi 142, bina 3, mənzil 12..."
                        className={`w-full bg-background border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-rubik-brand ${
                          validationErrors.address ? 'border-red-500 bg-red-50/10' : 'border-border'
                        }`}
                      />
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs rounded-xl flex items-center gap-2">
                        <span>ℹ️</span>
                        <p className="font-medium">
                          <strong>Çatdırılma haqqı WhatsApp-da sizinlə razılaşdırılacaq</strong>
                        </p>
                      </div>
                      {validationErrors.address && (
                        <p className="text-[9px] text-red-600 font-bold flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {validationErrors.address}
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="region-options"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-5 pt-2 border-t border-border/60"
                >
                  <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider block">
                    {t({ az: 'Çatdırılma Üsulu', en: 'Delivery Method', ru: 'Способ Доставки' })} *
                  </label>

                  <div className="p-4 rounded-2xl border border-rubik-brand bg-rubik-brand/5 ring-1 ring-rubik-brand">
                    <div className="flex justify-between items-start mb-2">
                      <div className="p-1.5 bg-blue-500/10 text-blue-600 rounded-lg">
                        <Truck className="h-4.5 w-4.5" />
                      </div>
                      <span className="text-rubik-brand bg-white p-0.5 rounded-full border border-rubik-brand">
                        <Check className="h-3 w-3" />
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-foreground">Poçt / Kargo ilə çatdırılma</h4>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-normal">
                      Azərpoçt və ya Kargo şirkəti vasitəsilə rayon mərkəzinizə göndərilir.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-blue-600" /> Rayon adı və Ünvanınız *
                    </label>
                    <textarea
                      rows={3}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Məsələn: Sumqayıt şəhəri, 4-cü məhəllə / Və ya Gəncə şəhəri, Atatürk pr. 15..."
                      className={`w-full bg-background border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-rubik-brand ${
                        validationErrors.address ? 'border-red-500 bg-red-50/10' : 'border-border'
                      }`}
                    />
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs rounded-xl flex items-center gap-2">
                      <span>ℹ️</span>
                      <p className="font-medium">
                        <strong>Çatdırılma üsulu və haqqı WhatsApp-da sizinlə razılaşdırılacaq</strong>
                      </p>
                    </div>
                    {validationErrors.address && (
                      <p className="text-[9px] text-red-600 font-bold flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {validationErrors.address}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Gift Wrapping */}
            <div className="bg-muted/40 p-4 rounded-2xl border border-border space-y-3.5">
              <label className="flex items-center gap-3.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isGift}
                  onChange={(e) => setIsGift(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-rubik-brand focus:ring-rubik-brand cursor-pointer"
                />
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5 select-none">
                  <Gift className="h-4 w-4 text-rubik-brand" />
                  {dict.checkout?.gift_option || "Bu sifariş hədiyyədir? (Hədiyyə kağızı pulsuzdur)"}
                </span>
              </label>

              <AnimatePresence>
                {isGift && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1.5 overflow-hidden pt-1"
                  >
                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">
                      {dict.checkout?.gift_note || "Hədiyyə qeydi (Könüllü)"}
                    </label>
                    <input
                      type="text"
                      value={giftNote}
                      onChange={(e) => setGiftNote(e.target.value)}
                      placeholder={t({
                        az: 'Ad günün mübarək! Ümid edirəm bu flaqman Maqnetik Kubu bəyənəcəksən...',
                        en: 'Happy Birthday! Hope you love this flagship magnetic cube...',
                        ru: 'С Днем Рождения! Надеюсь, тебе понравится этот флагманский магнитный кубик...'
                      })}
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-[16px] text-foreground focus:outline-none focus:ring-1 focus:ring-rubik-brand"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-soft-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rubik-brand text-white text-xs font-black">
                3
              </span>
              <h2 className="text-base font-black text-foreground uppercase tracking-wider">
                {dict.checkout?.payment_details || "Ödəniş detalları"}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`p-4 rounded-2xl border text-left transition-all relative cursor-pointer flex flex-col justify-between ${
                  paymentMethod === 'bank_transfer'
                    ? 'border-rubik-brand bg-rubik-brand/5'
                    : 'border-border hover:border-foreground/10'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="p-1.5 bg-muted rounded-lg text-foreground">
                      <CreditCard className="h-4.5 w-4.5" />
                    </div>
                    {paymentMethod === 'bank_transfer' && (
                      <span className="text-rubik-brand bg-white p-0.5 rounded-full border border-rubik-brand">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-black text-foreground">{dict.checkout?.payment_bank || "Kartla / Köçürmə ilə Ödəniş"}</h4>
                  <p className="text-[10px] text-muted-foreground leading-normal">
                    {dict.checkout?.payment_bank_desc || "Kartdan karta və ya hesaba köçürmə."}
                  </p>
                </div>
                <span className="block mt-4 text-[9px] font-black text-rubik-brand uppercase tracking-wider">
                  {hasPreorderItems ? t({ az: 'Ön Sifariş üçün Məcburi (100% Ödəniş)', en: 'Required for Pre-orders', ru: 'Обязательно для Предзаказа' }) : t({ az: 'Ən çox seçilən', en: 'Most Popular', ru: 'Самый Популярный' })}
                </span>
              </button>

              {!hasPreorderItems ? (
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                    paymentMethod === 'cod'
                      ? 'border-rubik-brand bg-rubik-brand/5'
                      : 'border-border hover:border-foreground/10'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="p-1.5 bg-muted rounded-lg text-foreground">
                        <Wallet className="h-4.5 w-4.5" />
                      </div>
                      {paymentMethod === 'cod' && (
                        <span className="text-rubik-brand bg-white p-0.5 rounded-full border border-rubik-brand">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-black text-foreground">{dict.checkout?.payment_cod || "Qapıda Nəğd Ödəniş"}</h4>
                    <p className="text-[10px] text-muted-foreground leading-normal">
                      {dict.checkout?.payment_cod_desc || "Məhsulu kuryerdən təslim alarkən yerində nəğd ödəniş edin."}
                    </p>
                  </div>
                  <span className="block mt-4 text-[9px] font-black text-muted-foreground uppercase tracking-wider">
                    {t({ az: 'Təhlükəsiz limitli', en: 'Secure COD', ru: 'Надежный Наложенный' })}
                  </span>
                </button>
              ) : (
                <div className="p-4 rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/5 text-left flex flex-col justify-between select-none">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="p-1.5 bg-amber-500/20 text-amber-600 rounded-lg">
                        <Wallet className="h-4.5 w-4.5" />
                      </div>
                      <span className="text-[10px] bg-amber-500/20 text-amber-700 font-extrabold px-2 py-0.5 rounded uppercase">
                        {locale === 'en' ? 'Disabled' : locale === 'ru' ? 'Деактивировано' : 'Deaktivdir'}
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-amber-900 dark:text-amber-300">
                      {locale === 'en' ? 'Cash on Delivery' : locale === 'ru' ? 'Оплата при получении' : 'Qapıda Ödəniş'}
                    </h4>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium leading-snug">
                      {locale === 'en' ? 'Pre-order items require 100% advance payment, so cash on delivery is disabled for this order.' : locale === 'ru' ? 'Для предзаказа требуется 100% предоплата, поэтому оплата при получении недоступна.' : 'Ön sifariş məhsullarında 100% ön ödəniş tələb olunduğundan qapıda nəğd ödəniş seçimi bu sifariş üçün gizlədilmişdir.'}
                    </p>
                  </div>
                  <span className="block mt-4 text-[9px] font-black text-amber-600 uppercase tracking-wider">
                    {locale === 'en' ? 'Pre-order Condition' : locale === 'ru' ? 'Условие Предзаказа' : 'Ön Sifariş Şərti'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Terms checkbox */}
          <div className="space-y-2.5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="h-4 w-4 mt-0.5 rounded border-border text-rubik-brand focus:ring-rubik-brand cursor-pointer"
              />
              <span className="text-xs text-muted-foreground leading-relaxed select-none">
                {dict.checkout?.accept_terms || "İstifadə Şərtlərini qəbul edirəm"}
              </span>
            </label>
            {validationErrors.terms && (
              <p className="text-[10px] text-red-600 font-bold flex items-center gap-1 px-1">
                <AlertCircle className="h-3 w-3" /> {validationErrors.terms}
              </p>
            )}
          </div>

        </div>

        {/* Right Sidebar: Order Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-soft-sm space-y-5">
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider pb-3.5 border-b border-border flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-rubik-brand" />
              {dict.checkout?.order_summary || "Sifariş Xülasəsi"}
            </h3>

            {/* Cart products list */}
            <div className="max-h-60 overflow-y-auto divide-y divide-border/60 pr-1 space-y-3.5">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="relative w-12 h-12 bg-muted/30 border border-border rounded-xl overflow-hidden p-1 flex-shrink-0 flex items-center justify-center">
                    <Image
                      src={sanitizeImageUrl(item.image_url, item.id)}
                      alt={item.title}
                      fill
                      referrerPolicy="no-referrer"
                      className="object-contain p-1"
                      sizes="48px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[11px] font-bold text-foreground leading-snug line-clamp-2">{item.title}</h4>
                    <div className="flex items-center justify-between mt-1 text-[10px]">
                      <span className="text-muted-foreground font-mono">
                        {dict.cart.quantity || "Say"}: {item.quantity}
                      </span>
                      <div className="text-right">
                        {item.original_price_azn && item.original_price_azn > item.price_azn && (
                          <span className="block text-[9px] text-muted-foreground line-through font-mono">
                            {(item.original_price_azn * item.quantity).toFixed(2)} AZN
                          </span>
                        )}
                        <span className="font-bold text-foreground font-mono">{(item.price_azn * item.quantity).toFixed(2)} AZN</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Application */}
            {!appliedCoupon && (
              <div className="pt-4 border-t border-border/80">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-2 block">
                  {t({ az: 'Promo Kodunuz Var?', en: 'Have a Promo Code?', ru: 'Есть Промо-Код?' })}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Məsələn: PROMO10"
                    className="flex-1 bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-rubik-brand transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={isCouponLoading || !couponInput.trim()}
                    className="px-4 py-2.5 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    {isCouponLoading ? (t({ az: 'Yoxlanır...', en: 'Checking...', ru: 'Проверка...' })) : (dict.checkout?.apply_coupon || 'Tətbiq Et')}
                  </button>
                </div>
                {couponError && <p className="text-red-500 text-[10px] mt-1 font-bold">{couponError}</p>}
              </div>
            )}
            
            {/* Coupon display */}
            {appliedCoupon && (
              <div className="flex justify-between items-center bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 p-2.5 rounded-xl border border-green-200/50 text-xs font-bold">
                <span className="flex items-center gap-1.5">
                  <Percent className="h-3.5 w-3.5" />
                  <span>{t({ az: `Kupon (${appliedCoupon})`, en: `Coupon (${appliedCoupon})`, ru: `Купон (${appliedCoupon})` })}</span>
                </span>
                <span className="font-mono">-{discountAmount.toFixed(2)} AZN</span>
              </div>
            )}

            {/* Financial breakdown */}
            <div className="pt-4 border-t border-border/80 space-y-2.5 text-xs">
              {productSavings > 0 && (
                <>
                  <div className="flex justify-between text-muted-foreground">
                    <span>İlkin məhsul dəyəri</span>
                    <span className="line-through font-mono">{origSubtotal.toFixed(2)} AZN</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Məhsul endirimləri</span>
                    <span className="font-mono">-{productSavings.toFixed(2)} AZN</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>{dict.cart.total || "Səbət cəmi"}</span>
                <span className="font-bold text-foreground font-mono">{subtotal.toFixed(2)} AZN</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{dict.checkout?.delivery_fee || "Çatdırılma"}</span>
                <span className="font-bold text-foreground font-mono">
                  {shippingCost === 0 ? (dict.checkout?.free_delivery || 'Pulsuz') : `${shippingCost.toFixed(2)} AZN`}
                </span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-green-600 font-bold">
                  <span>{dict.checkout?.discount || "Kupon Endirimi"}</span>
                  <span className="font-mono">-{discountAmount.toFixed(2)} AZN</span>
                </div>
              )}
              {(productSavings > 0 || discountAmount > 0) && (
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between text-[11px] font-black text-emerald-700 dark:text-emerald-300">
                  <span>CƏMİ QƏNAƏTİNİZ:</span>
                  <span className="font-mono">{(productSavings + discountAmount).toFixed(2)} AZN</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-foreground pt-3.5 border-t border-border">
                <span>{t({ az: 'YEKUN CƏM', en: 'TOTAL AMOUNT', ru: 'ИТОГОВАЯ СУММА' })}</span>
                <span className="font-mono text-base text-rubik-brand">{totalAmount.toFixed(2)} AZN</span>
              </div>
            </div>

            {validationErrors.submit && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs font-bold rounded-xl">
                {validationErrors.submit}
              </div>
            )}

            {/* Main Checkout button */}
            <button
              onClick={handlePlaceOrder}
              disabled={isProcessing}
              className="w-full inline-flex items-center justify-center py-4 bg-rubik-brand hover:bg-rubik-brand-dark text-white font-black text-sm rounded-2xl hover:shadow-soft-lg active:scale-98 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex gap-2"
            >
              {isProcessing ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
              ) : (
                <ShoppingBag className="h-4.5 w-4.5" />
              )}
              <span>
                {isProcessing
                  ? t({ az: 'Sifarişiniz hazırlanır...', en: 'Preparing your order...', ru: 'Ваш заказ обрабатывается...' })
                  : dict.checkout?.submit_whatsapp || 'Sifarişi WhatsApp-a Göndər'}
              </span>
              {!isProcessing && <ChevronRight className="h-4 w-4" />}
            </button>

            <div className="text-center">
              <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1.5">
                <Lock className="h-3 w-3" /> {dict.checkout?.security_notice || "Bütün sifarişlər dərhal qorunur."}
              </span>
            </div>
          </div>

          {/* Guarantee Panel */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-soft-sm space-y-4">
            <h4 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="h-4.5 w-4.5 text-green-600" /> {t({ az: 'Peşəkar Dəstək', en: 'Professional Support', ru: 'Профессиональная Поддержка' })}
            </h4>
            <p className="text-[10px] text-muted-foreground leading-normal">
              {t({
                az: 'Sifarişiniz dərhal peşəkar sürətli kubçulardan ibarət komandamız tərəfindən idarə olunacaqdır. Hər bir kub yola salınmazdan əvvəl xüsusi silikon yağları ilə yağlanıb optimal vəziyyətə gətirilir.',
                en: 'Your order will be handled immediately by our professional speedcubing experts. Each cube is lubed with specialized silicone compounds before dispatch.',
                ru: 'Ваш заказ будет немедленно обработан нашей профессиональной командой спидкуберов. Каждая головоломка смазывается силиконовыми смазками перед отправкой.'
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
