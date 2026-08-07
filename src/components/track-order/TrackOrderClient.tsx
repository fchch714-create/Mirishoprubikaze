'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Clock,
  CheckCircle2,
  Package,
  Truck,
  AlertCircle,
  HelpCircle,
  PhoneCall,
  ChevronRight,
  ShieldCheck,
  User,
  Phone,
  Mail,
  ListOrdered,
  ArrowRight,
  Loader2,
  ShoppingBag,
  Gift
} from 'lucide-react';
import { trackOrderOrPreorderAction } from '@/lib/actions/preorders';
import { OrderTracker } from '@/components/account/OrderTracker';
import { sanitizeImageUrl } from '@/lib/image';

interface TrackOrderClientProps {
  locale: string;
}

export function TrackOrderClient({ locale }: TrackOrderClientProps) {
  const [code, setCode] = React.useState('');
  const [contact, setContact] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<any | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !contact.trim()) {
      setErrorMessage('Zəhmət olmasa Sifariş Kodunu və Telefon/Email məlumatını daxil edin.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    setResult(null);

    try {
      const res = await trackOrderOrPreorderAction(code, contact);
      if (res.success) {
        setResult(res);
      } else {
        setErrorMessage(res.error || 'Axtarış nəticə vermədi.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Sistem xətası baş verdi. Yenidən cəhd edin.');
    } finally {
      setIsLoading(false);
    }
  };

  const statusBadges: Record<string, { label: string; bg: string; text: string }> = {
    pending_payment: { label: 'Ödəniş Və Ya Təsdiq Gözlənilir', bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-600 dark:text-amber-400' },
    paid_confirmed: { label: 'Ödəniş Təsdiqlənib / Növbədədir', bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-600 dark:text-blue-400' },
    assigned: { label: 'Stok Təyin Edilib / Hazırlanır', bg: 'bg-purple-500/10 border-purple-500/30', text: 'text-purple-600 dark:text-purple-400' },
    fulfilled: { label: 'Çatdırıldı / Tamamlandı', bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-600 dark:text-emerald-400' },
    cancelled: { label: 'Ləğv Edilib', bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-600 dark:text-red-400' }
  };

  return (
    <div className="w-full bg-background min-h-screen pb-24">
      {/* Breadcrumb Header */}
      <div className="bg-muted/40 py-4 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Link href={`/${locale}`} className="hover:text-rubik-brand transition-colors">
            Ana Səhifə
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-semibold">Sifarişimi Yoxla</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12 space-y-8">
        {/* Page Hero Title */}
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rubik-brand/10 text-rubik-brand text-xs font-black uppercase tracking-wider">
            <Search className="w-3.5 h-3.5" />
            Canlı Status & Növbə İzləmə
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
            Sifarişinizi Və Ya Ön Sifarişinizi Yoxlayın
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Hesab açmadan (Guest kimi) Sifariş Kodu (məs: RC2026A8K9) və Telefon nömrəniz (və ya Email) ilə anlıq növbə sırasını və çatdırılma statusunu öyrənin.
          </p>
        </div>

        {/* Lookup Search Form Box */}
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-soft-md space-y-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Field 1: Order Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-rubik-brand" />
                  Sifariş / Ön Sifariş Kodu *
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Məsələn: RC2026A8K9 və ya 8-xanalı kod"
                  className="w-full bg-muted border border-border rounded-2xl px-4 py-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-rubik-brand/50 transition-all uppercase"
                  required
                />
              </div>

              {/* Field 2: Phone or Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-rubik-brand" />
                  Telefon Nömrəsi Və Ya Email *
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Məsələn: +994501234567 və ya user@email.com"
                  className="w-full bg-muted border border-border rounded-2xl px-4 py-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-rubik-brand/50 transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 bg-rubik-brand hover:bg-rubik-brand-dark text-white font-black text-sm rounded-2xl transition-all shadow-soft-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sifariş axtarılır...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>Sifarişimi Yoxla</span>
                </>
              )}
            </button>
          </form>

          {/* Error Notice */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-600 dark:text-red-400 text-xs font-extrabold flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results Render Area */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="space-y-6"
            >
              {result.type === 'preorder' ? (
                /* PRE-ORDER RESULT CARD */
                <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-soft-lg space-y-6">
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-black rounded-lg uppercase tracking-wider">
                          Ön Sifariş
                        </span>
                        <span className="text-xs font-mono font-bold text-muted-foreground">
                          {new Date(result.data.created_at).toLocaleDateString('az-AZ')}
                        </span>
                      </div>
                      <h2 className="text-xl font-black text-foreground mt-1">
                        Sifariş Kodu: <span className="text-rubik-brand">{result.data.preorder_code}</span>
                      </h2>
                    </div>

                    <div className={`p-3.5 border rounded-2xl ${statusBadges[result.data.status]?.bg || 'bg-muted border-border'}`}>
                      <span className={`text-xs font-black uppercase tracking-wider block ${statusBadges[result.data.status]?.text || 'text-foreground'}`}>
                        {statusBadges[result.data.status]?.label || result.data.status}
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Queue Position Spotlight */}
                  {result.data.queue_position ? (
                    <div className="p-5 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border-2 border-amber-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-500 text-slate-950 rounded-xl font-black text-lg">
                          #{result.data.queue_position}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-amber-900 dark:text-amber-300">
                            Canlı Növbə Sıranız: #{result.data.queue_position}
                          </h4>
                          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                            {locale === 'en' ? 'Your position in line among confirmed pre-orders.' : locale === 'ru' ? 'Ваша очередь среди подтвержденных предзаказов.' : 'Ödənişi təsdiqlənmiş ön sifarişlər arasında cari növbə yeriniz.'}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-extrabold text-amber-800 dark:text-amber-300 bg-amber-500/20 px-3 py-1.5 rounded-xl self-start sm:self-auto shrink-0">
                        {locale === 'en' ? 'Delivery:' : locale === 'ru' ? 'Доставка:' : 'Çatdırılma:'} {
                          locale === 'en'
                            ? (result.data.product?.preorder_lead_time || '14-28 business days').replace(/14-28 iş günü/g, '14-28 business days').replace(/iş günü/g, 'business days').replace(/gün/g, 'days')
                            : locale === 'ru'
                            ? (result.data.product?.preorder_lead_time || '14-28 рабочих дней').replace(/14-28 iş günü/g, '14-28 рабочих дней').replace(/iş günü/g, 'рабочих дней').replace(/gün/g, 'дней')
                            : (result.data.product?.preorder_lead_time || '14-28 iş günü')
                        }
                      </span>
                    </div>
                  ) : (
                    <div className="p-4 bg-muted/40 border border-border rounded-2xl text-xs font-bold text-muted-foreground">
                      ℹ️ {locale === 'en' ? 'Once payment is confirmed, your live queue position will automatically activate here.' : locale === 'ru' ? 'После подтверждения оплаты ваша позиция в очереди автоматически появится здесь.' : 'Ödəniş təsdiqləndikdən sonra canlı növbə sıranız avtomatik olaraq burada aktivləşəcəkdir.'}
                    </div>
                  )}

                  {/* Customer & Product Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Customer Info */}
                    <div className="space-y-3 bg-muted/30 border border-border p-5 rounded-2xl">
                      <h3 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                        <User className="w-4 h-4 text-rubik-brand" />
                        Müştəri Məlumatı
                      </h3>
                      <div className="space-y-1.5 text-xs text-muted-foreground font-semibold">
                        <p><strong className="text-foreground">Ad Soyad:</strong> {result.data.customer_name}</p>
                        <p><strong className="text-foreground">Telefon:</strong> {result.data.customer_phone}</p>
                        {result.data.customer_email && (
                          <p><strong className="text-foreground">Email:</strong> {result.data.customer_email}</p>
                        )}
                        <p><strong className="text-foreground">Sayı:</strong> {result.data.quantity} ədəd</p>
                      </div>
                    </div>

                    {/* Product Card */}
                    {result.data.product && (
                      <div className="space-y-3 bg-muted/30 border border-border p-5 rounded-2xl flex items-center gap-4">
                        <div className="relative w-16 h-16 bg-card border border-border rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-1">
                          <Image
                            src={sanitizeImageUrl(result.data.product.image_url, result.data.product.id)}
                            alt={result.data.product.title_az}
                            fill
                            referrerPolicy="no-referrer"
                            className="object-contain p-1"
                          />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <h4 className="text-xs font-bold text-foreground line-clamp-2 leading-snug">
                            {result.data.product.title_az}
                          </h4>
                          <span className="text-xs font-black text-rubik-brand font-mono block">
                            {result.data.product.price_azn} AZN
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Help Support Footer Button */}
                  <div className="pt-2 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <p className="text-xs text-muted-foreground">
                      Sifarişinizlə bağlı hər hansı sualınız var? WhatsApp dəstək xəttimizlə dərhal əlaqə saxlayın.
                    </p>
                    <a
                      href={`https://wa.me/994506684925?text=${encodeURIComponent(`Salam, ön sifariş kodum ${result.data.preorder_code} üzrə məlumat almaq istəyirəm.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-all shadow-soft-sm inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>WhatsApp Dəstək</span>
                    </a>
                  </div>
                </div>
              ) : (
                /* STANDARD ORDER RESULT CARD WITH TRACKER */
                <div className="space-y-6">
                  <div className="bg-card border border-border rounded-3xl p-6 shadow-soft-md space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-4">
                      <div>
                        <span className="text-xs font-bold text-muted-foreground">Sifariş Kodu</span>
                        <h3 className="text-lg font-black text-foreground">#{result.data.code}</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-muted-foreground">Məbləğ</span>
                        <h3 className="text-lg font-black text-rubik-brand font-mono">{result.data.total_amount_azn} AZN</h3>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p><strong className="text-foreground">Müştəri:</strong> {result.data.customer_name} ({result.data.customer_phone})</p>
                      <p><strong className="text-foreground">Ünvan:</strong> {result.data.delivery_address || 'Təyin edilməyib'}</p>
                    </div>
                  </div>

                  <OrderTracker status={result.data.status} orderId={result.data.id} updatedAt={new Date(result.data.created_at).toLocaleDateString('az-AZ')} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
