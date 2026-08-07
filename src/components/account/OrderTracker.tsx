'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import {
  Clock,
  CheckCircle2,
  Package,
  Truck,
  Gift,
  AlertCircle,
  HelpCircle,
  PhoneCall,
  MapPin,
  Calendar
} from 'lucide-react';

export type OrderStatus = 'awaiting_payment' | 'confirmed' | 'packed' | 'shipped' | 'delivered';

interface OrderTrackerProps {
  status: OrderStatus | string;
  orderId: string;
  updatedAt?: string;
  locale?: string;
}

export function OrderTracker({ status, orderId, updatedAt, locale }: OrderTrackerProps) {
  const [waNumber, setWaNumber] = React.useState('994506684925');

  React.useEffect(() => {
    async function fetchTrackerSettings() {
      try {
        const { getSettings } = await import('@/lib/actions/settings');
        const paymentRes = await getSettings('payment');
        if (paymentRes.success && paymentRes.data?.whatsappNumber) {
          const raw = paymentRes.data.whatsappNumber.replace(/[^0-9]/g, '');
          setWaNumber(raw ? raw : '994506684925');
        }
      } catch (err) {
        console.error('Error fetching tracker settings:', err);
      }
    }
    fetchTrackerSettings();
  }, []);

  // Normalize status string safely
  const currentStatus: OrderStatus = React.useMemo(() => {
    const s = (status || '').toLowerCase();
    if (s.includes('awaiting') || s.includes('payment') || s.includes('gözlənilir')) return 'awaiting_payment';
    if (s.includes('confirm') || s.includes('təsdiq')) return 'confirmed';
    if (s.includes('pack') || s.includes('hazır')) return 'packed';
    if (s.includes('ship') || s.includes('yol') || s.includes('göndər')) return 'shipped';
    if (s.includes('deliver') || s.includes('təslim')) return 'delivered';
    return 'awaiting_payment'; // Fallback default
  }, [status]);

  const steps = [
    {
      key: 'awaiting_payment',
      title: locale === 'en' ? 'Awaiting Payment' : locale === 'ru' ? 'Ожидание Оплаты' : 'Ödəniş Gözlənilir',
      description: locale === 'en' ? 'Order registered, requires confirmation via WhatsApp.' : locale === 'ru' ? 'Заказ зарегистрирован, требуется подтверждение в WhatsApp.' : 'Sifariş qeydə alınıb, WhatsApp vasitəsilə təsdiqlənməlidir.',
      icon: Clock,
      color: 'text-amber-500 bg-amber-50 border-amber-200'
    },
    {
      key: 'confirmed',
      title: locale === 'en' ? 'Confirmed' : locale === 'ru' ? 'Подтверждено' : 'Təsdiqləndi',
      description: locale === 'en' ? 'Payment or order details confirmed by administrator.' : locale === 'ru' ? 'Оплата или детали заказа подтверждены администратором.' : 'Ödəniş və ya sifariş detalları inzibatçı tərəfindən təsdiqlənib.',
      icon: CheckCircle2,
      color: 'text-blue-500 bg-blue-50 border-blue-200'
    },
    {
      key: 'packed',
      title: locale === 'en' ? 'Processing & Packing' : locale === 'ru' ? 'Сборка и Упаковка' : 'Hazırlanır',
      description: locale === 'en' ? 'Product inspected, professionally lubricated and packaged.' : locale === 'ru' ? 'Товар проверен, профессионально смазан и упакован.' : 'Məhsul yoxlanılır, professional şəkildə silikonlanır və paketlənir.',
      icon: Package,
      color: 'text-purple-500 bg-purple-50 border-purple-200'
    },
    {
      key: 'shipped',
      title: locale === 'en' ? 'In Transit' : locale === 'ru' ? 'В пути' : 'Yoldadır',
      description: locale === 'en' ? 'Our fast courier is delivering your order to your address.' : locale === 'ru' ? 'Наш курьер доставляет ваш заказ по вашему адресу.' : 'Sürətli kuryerimiz sifarişinizi ünvanınıza doğru çatdırır.',
      icon: Truck,
      color: 'text-orange-500 bg-orange-50 border-orange-200'
    },
    {
      key: 'delivered',
      title: locale === 'en' ? 'Delivered' : locale === 'ru' ? 'Доставлен' : 'Təslim Edildi',
      description: locale === 'en' ? 'Product handed over to you. Enjoy the professional cube world!' : locale === 'ru' ? 'Товар вручен вам. Наслаждайтесь миром кубиков!' : 'Məhsul sizə təhvil verildi. Professional kub dünyasından zövq alın!',
      icon: Gift,
      color: 'text-green-500 bg-green-50 border-green-200'
    }
  ];

  const getStepIndex = (s: OrderStatus) => {
    return steps.findIndex((step) => step.key === s);
  };

  const currentIndex = getStepIndex(currentStatus);

  return (
    <div className="bg-card border border-border rounded-3xl p-6 shadow-soft-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <span className="text-[10px] font-black text-rubik-brand uppercase tracking-widest">{locale === 'en' ? 'Live Tracking' : locale === 'ru' ? 'Отслеживание' : 'Canlı İzləmə'}</span>
          <h3 className="text-sm font-black text-foreground uppercase tracking-wider mt-0.5">
            {locale === 'en' ? 'Order Lifecycle' : locale === 'ru' ? 'Жизненный Цикл Заказа' : 'Sifariş Lifecycle'} (#{(orderId || '').substring(0, 8).toUpperCase()})
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rubik-brand opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rubik-brand"></span>
          </span>
          <span className="text-[10px] font-bold text-muted-foreground">
            {locale === 'en' ? 'Status updated: ' : locale === 'ru' ? 'Статус обновлен: ' : 'Status yeniləndi: '}{updatedAt || (locale === 'en' ? 'Now' : locale === 'ru' ? 'Сейчас' : 'İndi')}
          </span>
        </div>
      </div>

      {/* Visual Stepper Timeline */}
      <div className="relative pt-4 pb-2">
        {/* Connection Line */}
        <div className="absolute top-[26px] left-6 right-6 h-0.5 bg-muted/80 hidden md:block" />
        <div
          className="absolute top-[26px] left-6 h-0.5 bg-rubik-brand transition-all duration-500 hidden md:block"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 92}%` }}
        />

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-4 relative z-10">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div key={step.key} className="flex md:flex-col items-start md:items-center text-left md:text-center gap-4 md:gap-2 relative">
                {/* Visual Node Dot */}
                <div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isCompleted
                      ? 'bg-rubik-brand border-rubik-brand text-white shadow-soft-sm'
                      : isCurrent
                      ? 'bg-background border-rubik-brand text-rubik-brand ring-4 ring-rubik-brand/10 shadow-soft-md scale-105'
                      : 'bg-muted/40 border-border text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-4.5 w-4.5" />
                  )}
                </div>

                {/* Content details */}
                <div className="space-y-1">
                  <h4
                    className={`text-xs font-black tracking-tight transition-colors ${
                      isCurrent ? 'text-rubik-brand' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {step.title}
                  </h4>
                  <p className="text-[10px] text-muted-foreground leading-normal max-w-[160px] md:mx-auto">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* High-conversion warning or assistance box */}
      {currentStatus === 'awaiting_payment' && (
        <div className="p-4 bg-amber-50/50 border border-amber-200/80 rounded-2xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1.5">
            <p className="font-bold text-amber-900 leading-none">{locale === 'en' ? 'Payment & Confirmation Pending' : locale === 'ru' ? 'Ожидается Оплата и Подтверждение' : 'Ödəniş və Təsdiq Gözlənilir'}</p>
            <p className="text-amber-700 leading-normal">
              {locale === 'en'
                ? 'Please confirm your order via WhatsApp with the admin so it can be handed to delivery.'
                : locale === 'ru'
                ? 'Пожалуйста, подтвердите ваш заказ через WhatsApp с администратором.'
                : 'Sifarişinizin kuryer xidmətinə təhvil verilməsi üçün WhatsApp üzərindən adminlə əlaqə saxlayaraq sifarişinizi təsdiqləməyiniz xahiş olunur.'}
            </p>
            <a
              href={`https://wa.me/${waNumber}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[10px] font-black text-amber-900 hover:underline"
            >
              <PhoneCall className="h-3 w-3" />
              <span>{locale === 'en' ? 'Confirm via WhatsApp now' : locale === 'ru' ? 'Подтвердить в WhatsApp' : 'Dərhal WhatsApp ilə təsdiqlə'}</span>
            </a>
          </div>
        </div>
      )}

      {currentStatus === 'shipped' && (
        <div className="p-4 bg-blue-50/50 border border-blue-200/80 rounded-2xl flex items-start gap-3">
          <Truck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1.5">
            <p className="font-bold text-blue-900 leading-none">{locale === 'en' ? 'Your Order is with the Courier!' : locale === 'ru' ? 'Ваш Заказ у Курьера!' : 'Sifarişiniz Kuryerdədir!'}</p>
            <p className="text-blue-700 leading-normal">
              {locale === 'en'
                ? 'Our fast courier is on the way and will contact you soon. Please keep your phone active.'
                : locale === 'ru'
                ? 'Наш курьер в пути и скоро свяжется с вами. Пожалуйста, держите телефон включенным.'
                : 'Sürətli çatdırılma kuryerimiz artıq yoldadır və tezliklə sizinlə əlaqə saxlayacaqdır. Zəhmət olmasa telefonunuzu aktiv saxlayın.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
