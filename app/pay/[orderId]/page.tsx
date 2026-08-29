'use client';

import React, { useEffect, useState, use } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, Clock, ShieldCheck, Smartphone, ExternalLink } from 'lucide-react';

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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-center">
        <div className="max-w-md p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-4">
          <p className="text-rose-400 font-semibold">{error || 'Order not found'}</p>
          <a href="/" className="text-xs text-cyan-400 hover:underline">Return to Console</a>
        </div>
      </div>
    );
  }

  const upiIntentUri = `upi://pay?pa=${encodeURIComponent(order.merchantUpiId)}&pn=${encodeURIComponent(
    order.merchantName
  )}&am=${order.expectedAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(order.refNote)}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
        
        {/* Merchant Branding Header */}
        <div className="text-center space-y-1">
          <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-widest">
            {order.merchantName}
          </span>
          <h1 className="text-3xl font-black text-white font-mono">
            ₹{order.expectedAmount.toFixed(2)}
          </h1>
          <p className="text-xs text-slate-400">Scan QR or Tap Button to Pay with Any UPI App</p>
        </div>

        {order.status === 'VERIFIED' ? (
          /* Payment Verified Success State */
          <div className="p-6 rounded-2xl bg-emerald-950/60 border border-emerald-800/60 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-emerald-400">Payment Verified!</h2>
            <p className="text-xs text-slate-300">
              UTR: <span className="font-mono font-bold text-white">{order.matchedUtr || 'Auto-matched'}</span>
            </p>
            <p className="text-[11px] text-slate-400">Direct settlement verified into merchant bank.</p>
          </div>
        ) : (
          /* Pending Payment QR Display */
          <div className="space-y-6">
            <div className="p-4 bg-white rounded-2xl shadow-xl flex items-center justify-center mx-auto max-w-[220px]">
              <QRCodeSVG value={upiIntentUri} size={190} level="M" />
            </div>

            {/* Mobile 1-Tap UPI Intent Button */}
            <a
              href={upiIntentUri}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>Pay with UPI App (GPay / PhonePe)</span>
            </a>

            {/* Verification Status Banner */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-amber-400">
                <Clock className="w-4 h-4 animate-spin" />
                <span>Awaiting Bank Confirmation</span>
              </div>
              <span className="font-mono text-slate-500">{order.refNote}</span>
            </div>
          </div>
        )}

        {/* Footer Security Badges */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-slate-400" />
          <span>0% Fee Direct UPI Payment · Secured by UPIlerify</span>
        </div>

      </div>
    </div>
  );
}
