'use client';

import * as React from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  CheckCircle,
  ShoppingBag,
  ArrowRight,
  PhoneCall,
  Calendar,
  DollarSign,
  User,
  Truck,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'az';

  const [waNumber, setWaNumber] = React.useState('994506684925');
  const [formattedWaNumber, setFormattedWaNumber] = React.useState('+994 50 668 49 25');

  React.useEffect(() => {
    async function fetchSuccessSettings() {
      try {
        const { getSettings } = await import('@/lib/actions/settings');
        const paymentRes = await getSettings('payment');
        if (paymentRes.success && paymentRes.data?.whatsappNumber) {
          const raw = paymentRes.data.whatsappNumber.replace(/[^0-9]/g, '');
          setWaNumber(raw ? raw : '994506684925');
          setFormattedWaNumber(paymentRes.data.whatsappNumber);
        }
      } catch (err) {
        console.error('Error fetching success settings:', err);
      }
    }
    fetchSuccessSettings();
  }, []);

  const orderId = searchParams.get('orderId') || 'W-5219A9B4';
  const paymentMethod = searchParams.get('payment') || 'bank_transfer';
  const totalAmount = searchParams.get('total') || '145.00';
  const customerName = searchParams.get('name') || 'Dəyərli Müştəri';

  const formattedOrderId = React.useMemo(() => {
    return String(orderId).substring(0, 8).toUpperCase();
  }, [orderId]);

  const currentDate = React.useMemo(() => {
    const d = new Date();
    return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()} — ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-soft-xl">
        
        {/* Success Header Visuals */}
        <div className="bg-gradient-to-br from-rubik-green/10 via-rubik-green/[0.02] to-background p-8 md:p-12 text-center space-y-4 border-b border-border">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="inline-flex p-4 bg-rubik-green text-white rounded-full shadow-soft-lg"
          >
            <CheckCircle className="h-10 w-10 animate-pulse" />
          </motion.div>
          
          <div className="space-y-2">
            <h1 className="text-xl md:text-3xl font-black text-foreground">Sifarişiniz Uğurla Qeydə Alındı!</h1>
            <p className="text-xs md:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Təşəkkür edirik, <strong>{customerName}</strong>! Sifarişiniz sistemimizə yükləndi və WhatsApp ödəniş mütəxəssisinə göndərildi.
            </p>
          </div>

          <div className="pt-2">
            <a
              href={`https://wa.me/${waNumber}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-rubik-green hover:bg-rubik-green-dark text-white font-black text-xs rounded-xl transition-all shadow-soft-md"
            >
              <PhoneCall className="h-4 w-4" />
              <span>WhatsApp ilə dərhal əlaqə qur</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Invoice Detail Section */}
        <div className="p-6 md:p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Column 1: Order Information */}
            <div className="space-y-4 bg-muted/40 p-5 rounded-2xl border border-border/60">
              <h3 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-rubik-brand" />
                Sifariş Detalları
              </h3>
              
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sifariş ID:</span>
                  <span className="font-black font-mono text-rubik-brand">#{formattedOrderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tarix:</span>
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> {currentDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ödəniş Metodu:</span>
                  <span className="font-semibold text-foreground">
                    {paymentMethod === 'bank_transfer' ? 'Kartdan karta (Bank köçürməsi)' : 'Qapıda nəğd'}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border/80">
                  <span className="text-foreground font-bold">Ödəniləcək Cəm:</span>
                  <span className="font-black text-foreground font-mono">{totalAmount} AZN</span>
                </div>
              </div>
            </div>

            {/* Column 2: What to do next */}
            <div className="space-y-4 bg-muted/40 p-5 rounded-2xl border border-border/60">
              <h3 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-yellow-500 animate-spin" />
                Növbəti Addımlar
              </h3>
              
              <ul className="space-y-3 text-[11px] text-muted-foreground leading-normal">
                <li className="flex items-start gap-2">
                  <span className="flex items-center justify-center w-5 h-5 bg-foreground text-card text-[10px] font-bold rounded-full shrink-0">1</span>
                  <span><strong>WhatsApp müraciəti:</strong> Əgər WhatsApp-a yönləndirilməmisinizsə, yuxarıdakı yaşıl düyməyə basaraq sifariş ID-nizi bizə göndərin.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex items-center justify-center w-5 h-5 bg-foreground text-card text-[10px] font-bold rounded-full shrink-0">2</span>
                  <span><strong>Ödəniş Təsdiqi:</strong> Kartdan karta ödəniş etdikdən sonra ödəniş qəbzini bizə WhatsApp ilə göndərin.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex items-center justify-center w-5 h-5 bg-foreground text-card text-[10px] font-bold rounded-full shrink-0">3</span>
                  <span><strong>Kuryer Göndərişi:</strong> Ödəniş və ya sifariş təsdiq edildikdən sonra məhsulunuz xüsusi olaraq hazırlanır, yağlanır və yola salınır.</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Core Support / Contact info */}
          <div className="bg-rubik-brand/5 border border-rubik-brand/20 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rubik-brand text-white rounded-xl">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="text-center sm:text-left">
                <h4 className="text-xs font-black text-foreground">Kömək lazımdır? Bizə yazın</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">Hər hansı bir sualınız və ya xüsusi istəyiniz olarsa dərhal dəstək veririk.</p>
              </div>
            </div>
            <a
              href={`https://wa.me/${waNumber}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-black text-rubik-brand hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>{formattedWaNumber}</span>
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-border flex flex-col sm:flex-row gap-3">
            <Link
              href={`/${locale}`}
              className="flex-1 inline-flex items-center justify-center py-3 bg-muted hover:bg-muted/80 text-foreground font-black text-xs rounded-xl transition-all border border-border"
            >
              <span>Ana səhifəyə dön</span>
            </Link>
            <Link
              href={`/${locale}/catalog`}
              className="flex-1 inline-flex items-center justify-center py-3 bg-foreground text-card hover:bg-rubik-brand hover:text-white font-black text-xs rounded-xl transition-all flex gap-1 items-center"
            >
              <span>Yeni kublar kəşf et</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-background">
      <React.Suspense
        fallback={
          <div className="max-w-md mx-auto px-4 py-24 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-rubik-brand border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-xs text-muted-foreground font-semibold">Təşəkkür səhifəsi yüklənir...</p>
          </div>
        }
      >
        <SuccessContent />
      </React.Suspense>
    </div>
  );
}
