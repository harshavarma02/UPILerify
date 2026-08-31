'use client';

import React, { useEffect, useState, use } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, Clock, ShieldCheck, Smartphone, ExternalLink, ArrowLeft } from 'lucide-react';
import { BrandMarkSvg, BrandBackground } from '@/lib/brand';

interface OrderState {
  id: string;
  amount: number;
  expectedAmount: number;
  refNote: string;
  merchantUpiId: string;
  merchantName: string;
  status: 'PENDING' | 'VERIFIED' | 'EXPIRED';
  matchedUtr?: string;
  matchedBank?: string;
}

export default function CheckoutPage({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.orderId;

  const [order, setOrder] = useState<OrderState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Poll for status
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`);
        const data = await res.json();
        if (data.success) {
          setOrder(data.order);
          if (data.order.status === 'VERIFIED') {
            clearInterval(interval);
          }
        } else {
          setError(data.error || 'Order not found');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
    interval = setInterval(fetchOrder, 2500);

    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) {
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

  const upiIntentUri = `upi://pay?pa=${encodeURIComponent(order.merchantUpiId)}&pn=${encodeURIComponent(
    order.merchantName
  )}&am=${order.expectedAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(order.refNote)}`;

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

          {order.status === 'VERIFIED' ? (
            /* Verified State */
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-emerald-800">Payment Verified!</h2>
              <p className="text-xs text-slate-600">
                UTR: <span className="font-mono font-bold text-[#0A0F1D]">{order.matchedUtr || 'Auto-matched'}</span>
              </p>
              <p className="text-[11px] text-emerald-700 font-medium">100% direct settlement confirmed into merchant bank.</p>
            </div>
          ) : (
            /* Pending State */
            <div className="space-y-6">
              
              {/* Dynamic Sharp QR Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner flex items-center justify-center mx-auto max-w-[220px]">
                <QRCodeSVG value={upiIntentUri} size={185} level="M" />
              </div>

              {/* Mobile Pay Deep Link Button */}
              <a
                href={upiIntentUri}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#0A0F1D] hover:bg-[#0066FF] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 transition-all duration-200 cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-[#00D2FF]" />
                <span>Pay with GPay / PhonePe / Paytm</span>
              </a>

              {/* Awaiting Confirmation Badge */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                <div className="flex items-center gap-2 text-amber-800 font-medium">
                  <Clock className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  <span>Awaiting Bank Confirmation</span>
                </div>
                <span className="font-mono font-bold text-amber-900">{order.refNote}</span>
              </div>
            </div>
          )}

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
