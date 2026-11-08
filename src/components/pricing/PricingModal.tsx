'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { X, Check, Sparkles, Zap, Crown, ShieldCheck, Loader2, ArrowRight, Trophy } from 'lucide-react';
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/lib/stripe';
import { useI18n } from '@/lib/i18n';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  onOpenAuth,
}) => {
  const { data: session } = useSession();
  const { t, language } = useI18n();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentPlan = (session?.user as any)?.plan || 'FREE';
  const isOwner = (session?.user as any)?.role === 'OWNER' || currentPlan === 'OWNER';
  const hasActiveSubscription =
    (session?.user as any)?.subscriptionStatus === 'ACTIVE';

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!session) {
      if (onOpenAuth) {
        onClose();
        onOpenAuth();
      }
      return;
    }

    if (plan.id === 'FREE_TRIAL' || plan.id === 'FREE') {
      onClose();
      return;
    }

    setLoadingPlan(plan.id);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Checkout initialization failed');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMessage(err.message || 'Chyba pripojenia k Stripe / Stripe connection error');
      setLoadingPlan(null);
    }
  };

  const handleOpenPortal = async () => {
    setPortalLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Portal error');
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Chyba zákazníckeho portálu');
      setPortalLoading(false);
    }
  };

  const plans = [
    SUBSCRIPTION_PLANS.FREE_TRIAL,
    SUBSCRIPTION_PLANS.MONTHLY_PASS,
    SUBSCRIPTION_PLANS.ANNUAL_PASS,
  ];

  const isSk = language === 'sk';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-5xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl p-6 sm:p-10 my-auto">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-electric/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-gold/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-brand-electric/20 to-brand-gold/20 border border-brand-electric/30 text-brand-electric text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AURA RAP STUDIO PASS</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {isSk ? 'Vyber si svoje štúdiové predplatné' : 'Choose Your Studio Pass'}
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base mt-2">
            {isSk
              ? 'Začni s 30 dňami zadarmo. Pokračuj flexibilne mesačne (9,99 €) alebo ušetri 50 % s ročným Founder pasom (60 €).'
              : 'Start with 30 days free. Continue month-to-month (9.99 €) or save 50% with the Annual Founder pass (60 €).'}
          </p>

          {isOwner && (
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-gold/20 border border-brand-gold text-brand-gold text-xs font-bold uppercase tracking-wider">
              <Crown className="w-4 h-4 fill-current" />
              <span>13OMI OWNER (LIFETIME FREE ACCESS)</span>
            </div>
          )}

          {hasActiveSubscription && !isOwner && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/80 px-3 py-1 rounded-full flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                {t.currentPlan}: {currentPlan}
              </span>
              <button
                onClick={handleOpenPortal}
                disabled={portalLoading}
                className="text-xs text-zinc-300 hover:text-white underline decoration-dotted flex items-center gap-1"
              >
                {portalLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                {t.manageInStripe}
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="mt-4 p-3 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs text-center">
              {errorMessage}
            </div>
          )}
        </div>

        {/* 13OMI Contest Banner in Modal */}
        <div className="mb-8 p-3.5 rounded-2xl bg-gradient-to-r from-brand-gold/20 via-brand-carbon to-brand-electric/20 border border-brand-gold/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-brand-gold font-bold">
            <Trophy className="w-4 h-4 text-brand-gold shrink-0" />
            <span>
              {isSk
                ? 'SÚŤAŽ O 3 ROČNÉ LICENCIE ZDARMA: Nahraj 16 bars v štúdiu a vyhraj celý rok bez poplatkov!'
                : '13OMI CONTEST: Drop 16 bars in the studio to win a 1-year pass 100% free!'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-brand-gold text-black font-extrabold uppercase text-[10px] tracking-wider shrink-0"
          >
            {isSk ? 'NAHRAŤ V ŠTÚDIU' : 'RECORD NOW'}
          </button>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            const isHighlight = plan.highlight;
            const features = isSk ? plan.featuresSk : plan.features;
            const name = isSk ? plan.nameSk : plan.name;
            const tagline = isSk ? plan.taglineSk : plan.tagline;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-2xl p-6 sm:p-7 transition-all ${
                  isHighlight
                    ? 'bg-gradient-to-b from-brand-concrete/90 to-zinc-950 border-2 border-brand-gold shadow-[0_0_30px_rgba(200,164,93,0.2)] md:-translate-y-2'
                    : 'bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Popular / Discount Badge */}
                {isHighlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-brand-gold text-black font-extrabold text-[10px] tracking-wider uppercase shadow-lg flex items-center gap-1">
                    <Crown className="w-3 h-3 fill-current" />
                    <span>{isSk ? '50% ZĽAVA • ODPORÚČANÉ' : '50% OFF • RECOMMENDED'}</span>
                  </div>
                )}

                <div>
                  {/* Plan Title & Icon */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-black text-white">{name}</h3>
                    {plan.id === 'FREE_TRIAL' && <Zap className="w-5 h-5 text-brand-electric" />}
                    {plan.id === 'MONTHLY_PASS' && <Sparkles className="w-5 h-5 text-brand-electric" />}
                    {plan.id === 'ANNUAL_PASS' && <Crown className="w-5 h-5 text-brand-gold" />}
                  </div>

                  <p className="text-xs text-zinc-400 mb-6 min-h-[32px]">{tagline}</p>

                  {/* Price */}
                  <div className="flex items-baseline gap-1.5 mb-6 pb-6 border-b border-zinc-800">
                    <span className="text-3xl sm:text-4xl font-black text-white">
                      {plan.priceEur === 0 ? '0 €' : plan.priceEur === 59.99 ? '60 €' : `${plan.priceEur} €`}
                    </span>
                    <span className="text-xs text-zinc-400 font-semibold">
                      {plan.id === 'FREE_TRIAL' ? (isSk ? '/ prvých 30 dní' : '/ first 30 days') : plan.interval === 'year' ? (isSk ? '/ rok' : '/ year') : (isSk ? '/ mesiac' : '/ month')}
                    </span>
                  </div>

                  {plan.id === 'ANNUAL_PASS' && (
                    <div className="mb-4 text-[11px] text-brand-gold font-bold">
                      {isSk ? '⚡ Vychádza len 5,00 € / mesiac (ušetríš 60 € ročne)' : '⚡ Just 5.00 € / month (Save 60 € yearly)'}
                    </div>
                  )}

                  {/* Features List */}
                  <ul className="space-y-3 mb-8">
                    {features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300">
                        <Check
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            isHighlight ? 'text-brand-gold' : 'text-brand-electric'
                          }`}
                        />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <div>
                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={isCurrent || loadingPlan === plan.id}
                    className={`w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 transition ${
                      isCurrent
                        ? 'bg-zinc-800 text-zinc-400 cursor-default'
                        : isHighlight
                        ? 'bg-gradient-to-r from-brand-gold via-yellow-400 to-amber-500 text-black hover:brightness-110 shadow-lg shadow-brand-gold/25'
                        : plan.id === 'MONTHLY_PASS'
                        ? 'bg-brand-electric hover:bg-blue-600 text-black'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                    }`}
                  >
                    {loadingPlan === plan.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isCurrent ? (
                      t.currentPlan
                    ) : plan.id === 'FREE_TRIAL' ? (
                      isSk ? 'Pokračovať zadarmo' : 'Continue Free'
                    ) : (
                      <>
                        <span>{isSk ? 'Aktivovať plán' : 'Subscribe Now'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-zinc-500 text-center mt-2 flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-zinc-500" />
                    {isSk ? 'Bezpečné platby cez Stripe • Kedykoľvek zrušiteľné' : 'Secure payments via Stripe • Cancel anytime'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
