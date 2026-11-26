'use client';

import React, { useEffect, useState, use } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Clock, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BrandMarkSvg, BrandBackground } from '@/lib/brand';
import { buildUpiIntentUri } from '@/lib/payments/upiIntent';
import { UtrClaimForm } from './components/UtrClaimForm';
import { UpiAppButtons } from './components/UpiAppButtons';

interface OrderState {
  id: string;
  amount: number;
  expectedAmount: number;
  refNote: string;
  merchantUpiId: string;
  merchantName: string;
  status: 'PENDING' | 'CLAIMED' | 'VERIFIED' | 'EXPIRED';
  claimedUtr?: string;
  claimedAt?: number;
  matchedUtr?: string;
  matchedBank?: string;
}

export default function CheckoutPage({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.orderId;
  const router = useRouter();

  const [order, setOrder] = useState<OrderState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`);
      const data = await res.json();
      if (data.success) {
        setError(null);
        setOrder(data.order);
        return data.order;
      } else {
        setError(data.error || 'Order not found');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
    return null;
  }, [orderId]);

  // Stop polling as soon as a terminal state is received.
  useEffect(() => {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      const latest = await fetchOrder();
      if (disposed) return;
      if (latest?.status === 'VERIFIED' || latest?.status === 'EXPIRED') {
        const status = latest.status === 'VERIFIED' ? 'success' : 'expired';
        router.replace(`/pay/${encodeURIComponent(orderId)}/${status}`);
        return;
      }
      timer = setTimeout(poll, 2500);
    };
    poll();
    return () => {
      disposed = true;
      clearTimeout(timer);
    };
  }, [fetchOrder, orderId, router]);

  if (loading || order?.status === 'VERIFIED' || order?.status === 'EXPIRED') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-8 h-8 rounded-full border-2 border-[#0066FF] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-center">
        <div className="max-w-md p-8 bg-white rounded-3xl border border-slate-200 shadow-xl space-y-4">
          <p className="text-rose-600 font-semibold">{error || 'Order not found'}</p>
          <a href="/" className="text-xs text-[#0066FF] font-bold hover:underline">Return to Test Console</a>
        </div>
      </div>
    );
  }

  const upiParams = {
    merchantUpiId: order.merchantUpiId,
    merchantName: order.merchantName,
    amount: order.expectedAmount,
    refNote: order.refNote,
  };
  const upiIntentUri = buildUpiIntentUri(upiParams);

  return (
    <div className="min-h-screen bg-slate-50 text-[#0A0F1D] flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-800">
      
      <BrandBackground
        variant="light-tactile"
        showEdgeSilhouette
        edgePosition="dual-bleed"
        edgeOpacity={0.08}
        watermarkPosition="dual"
        watermarkOpacity={0.03}
        showGrid
        showArcs
        showGlow
        className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8"
      >
        
        <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/90 shadow-[0_25px_70px_-20px_rgba(15,118,110,0.15)] liquid-border p-6 sm:p-8 space-y-6 relative z-10">
          
          {/* Top Brand & Payee Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-[#0A0F1D] flex items-center justify-center shadow-xs">
                <div className="w-5 h-5">
                  <BrandMarkSvg size="100%" />
                </div>
              </span>
              <div>
                <h2 className="text-xs font-bold font-mono tracking-tight text-[#0A0F1D]">
                  {order.merchantName}
                </h2>
                <span className="text-[10px] text-slate-500 font-mono">0% Fee Direct UPI</span>
              </div>
            </div>

            <a
              href="/"
              className="text-[11px] font-mono font-bold text-slate-500 hover:text-[#0A0F1D] flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Console</span>
            </a>
          </div>

          {/* Amount Display */}
          <div className="text-center space-y-1 py-1">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
              Amount to Pay
            </span>
            <h1 className="text-4xl font-black text-[#0A0F1D] font-mono">
              ₹{order.expectedAmount.toFixed(2)}
            </h1>
            <p className="text-xs text-slate-500">Scan QR Code or Tap Button to Pay with Any UPI App</p>
          </div>

          {order.status === 'CLAIMED' ? (
            /* Claimed State — UTR received, awaiting real bank confirmation */
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-sky-50 border border-sky-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-sky-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-sky-500/20">
                  <Clock className="w-7 h-7 animate-spin [animation-duration:3s]" />
                </div>
                <h2 className="text-lg font-bold text-sky-900">UTR Received — Awaiting Bank Confirmation</h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your UTR{' '}
                  <span className="font-mono font-bold text-[#0A0F1D]">{order.claimedUtr || '—'}</span>{' '}
                  has been recorded. We are matching it against the live bank alert feed and will confirm
                  automatically — usually within seconds.
                </p>
                <p className="text-[11px] text-sky-700 font-medium">
                  No action needed. This page updates by itself.
                </p>
              </div>

              {/* Keep the pay controls visible in case the payment hasn't actually gone through */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner flex items-center justify-center mx-auto max-w-[220px] opacity-60">
                <QRCodeSVG value={upiIntentUri} size={185} level="M" />
              </div>
              <UpiAppButtons params={upiParams} compact />
            </div>
          ) : (
            /* Pending State */
            <div className="space-y-6">
              
              {/* Dynamic Sharp QR Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner flex items-center justify-center mx-auto max-w-[220px]">
                <QRCodeSVG value={upiIntentUri} size={185} level="M" />
              </div>

              {/* Dedicated UPI App Deep Links & Fallback Button */}
              <UpiAppButtons params={upiParams} />

              {/* Awaiting Confirmation Badge */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                <div className="flex items-center gap-2 text-amber-800 font-medium">
                  <Clock className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  <span>Awaiting Bank Confirmation</span>
                </div>
                <span className="font-mono font-bold text-amber-900">{order.refNote}</span>
              </div>

              {/* Fallback UTR Submission Form */}
              <UtrClaimForm orderId={order.id} onClaimed={fetchOrder} />
            </div>
          )}

          <Link href={`/pay/${encodeURIComponent(order.id)}/cancelled`}
            className="block text-center text-xs font-medium text-slate-500 hover:text-slate-900">
            Cancel checkout
          </Link>

          {/* Footer Security Badges */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>0% Fee Direct UPI Payment · Powered by UPIlerify Engine</span>
          </div>

        </div>

      </BrandBackground>
    </div>
  );
}
