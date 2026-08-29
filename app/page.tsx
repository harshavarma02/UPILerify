'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  Copy, 
  ExternalLink, 
  Send, 
  Mail, 
  RefreshCw, 
  ShieldCheck, 
  Terminal,
  Activity,
  ArrowRight
} from 'lucide-react';

interface OrderData {
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

export default function TestConsole() {
  // Form States
  const [amount, setAmount] = useState('499');
  const [merchantUpi, setMerchantUpi] = useState('merchant@upi');
  const [merchantName, setMerchantName] = useState('My SaaS Product');
  const [useMicroOffset, setUseMicroOffset] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  
  // IMAP Form
  const [gmailAddress, setGmailAddress] = useState('');
  const [gmailAppPassword, setGmailAppPassword] = useState('');
  const [imapStatus, setImapStatus] = useState<string | null>(null);
  const [isTestingImap, setIsTestingImap] = useState(false);

  // Active Order State
  const [activeOrder, setActiveOrder] = useState<OrderData | null>(null);
  const [upiIntentUri, setUpiIntentUri] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // Manual UTR
  const [manualUtr, setManualUtr] = useState('');
  const [utrStatus, setUtrStatus] = useState<string | null>(null);

  // Live Logs & Event Stream
  const [logs, setLogs] = useState<Array<{ id: string; time: string; message: string; type: string }>>([]);

  // Connect to SSE Stream
  useEffect(() => {
    const eventSource = new EventSource('/api/events');
    
    eventSource.addEventListener('order_created', (e) => {
      const data = JSON.parse(e.data);
      addLog(`Created order ${data.order.id} for ₹${data.order.expectedAmount}`, 'order');
    });

    eventSource.addEventListener('payment_verified', (e) => {
      const data = JSON.parse(e.data);
      setActiveOrder((prev) => (prev && prev.id === data.order.id ? data.order : prev));
      addLog(`✅ Verified order ${data.order.id} via ${data.alert.bank} (UTR: ${data.alert.utr})`, 'verified');
    });

    eventSource.addEventListener('log', (e) => {
      const data = JSON.parse(e.data);
      addLog(data.message, data.type);
    });

    return () => {
      eventSource.close();
    };
  }, []);

  const addLog = (message: string, type: string = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [{ id: Math.random().toString(36).slice(2), time, message, type }, ...prev.slice(0, 40)]);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingOrder(true);
    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          merchantUpiId: merchantUpi,
          merchantName: merchantName,
          useMicroOffset,
          webhookUrl: webhookUrl || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveOrder(data.order);
        setUpiIntentUri(data.upiIntentUri);
        setCheckoutUrl(data.checkoutUrl);
      } else {
        alert(data.error || 'Failed to create order');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleTestImap = async () => {
    setIsTestingImap(true);
    setImapStatus('Connecting to Gmail TLS IMAP (Port 993)...');
    try {
      const res = await fetch('/api/imap/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: gmailAddress,
          appPassword: gmailAppPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setImapStatus(`✅ Connected! Active INBOX (${data.mailboxCount} messages)`);
      } else {
        setImapStatus(`❌ ${data.message} ${data.error ? `(${data.error})` : ''}`);
      }
    } catch (err: any) {
      setImapStatus(`❌ ${err.message}`);
    } finally {
      setIsTestingImap(false);
    }
  };

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;
    try {
      const res = await fetch('/api/verify-utr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: activeOrder.id,
          utr: manualUtr,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUtrStatus('✅ Payment verified successfully!');
        setActiveOrder(data.order);
      } else {
        setUtrStatus(`❌ ${data.error}`);
      }
    } catch (err: any) {
      setUtrStatus(`❌ ${err.message}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-blue-500/20">
              U
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">UPIlerify Starter</h1>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-mono font-bold border border-cyan-500/20">
                  v1.0 OSS
                </span>
              </div>
              <p className="text-xs text-slate-400">Zero-Fee UPI Payment Engine & Verification Console</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://upilerify.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors"
            >
              <span>Platform Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://github.com/harshavarma02/upilerify"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <span>GitHub Repo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </header>

        {/* 2-Column Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Create Order & QR Stand (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Create Order Card */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold tracking-wide uppercase text-slate-400 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                  1. Create Payment Order
                </h2>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  0% Fee Direct UPI
                </span>
              </div>

              <form onSubmit={handleCreateOrder} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-hidden focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Merchant UPI VPA</label>
                    <input
                      type="text"
                      required
                      value={merchantUpi}
                      onChange={(e) => setMerchantUpi(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-hidden focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Payee Name</label>
                    <input
                      type="text"
                      value={merchantName}
                      onChange={(e) => setMerchantName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-hidden focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Webhook URL (Optional)</label>
                    <input
                      type="url"
                      placeholder="https://mysite.com/api/webhook"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-hidden focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="offset"
                    checked={useMicroOffset}
                    onChange={(e) => setUseMicroOffset(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-cyan-500"
                  />
                  <label htmlFor="offset" className="text-xs text-slate-400 select-none">
                    Use micro-paisa dynamic collision offset (e.g. ₹{amount}.01, ₹{amount}.02)
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isCreatingOrder}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs tracking-wide shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  {isCreatingOrder ? 'Generating UPI Order...' : 'Generate Dynamic QR & Intent Link'}
                </button>
              </form>
            </div>

            {/* Active Order QR Stand */}
            {activeOrder && upiIntentUri && (
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-300">Active Order: {activeOrder.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      activeOrder.status === 'VERIFIED'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                    }`}>
                      {activeOrder.status}
                    </span>
                  </div>
                  {checkoutUrl && (
                    <a
                      href={checkoutUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Open Checkout Page</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-slate-950 border border-slate-800">
                  {/* Sharp QR Code */}
                  <div className="p-3 bg-white rounded-xl shadow-lg shrink-0">
                    <QRCodeSVG value={upiIntentUri} size={150} level="M" />
                  </div>

                  <div className="space-y-3 flex-1 w-full">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Amount to Scan</span>
                      <div className="text-2xl font-bold font-mono text-white">
                        ₹{activeOrder.expectedAmount.toFixed(2)}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Reference Note</span>
                      <div className="text-xs font-mono font-bold text-cyan-400">
                        {activeOrder.refNote}
                      </div>
                    </div>

                    <button
                      onClick={() => copyToClipboard(upiIntentUri)}
                      className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                    >
                      {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied Intent Link' : 'Copy UPI Intent URI'}</span>
                    </button>
                  </div>
                </div>

                {/* Manual 12-digit UTR Verification Fallback */}
                {activeOrder.status === 'PENDING' && (
                  <form onSubmit={handleManualVerify} className="pt-2 border-t border-slate-800 space-y-2">
                    <label className="block text-xs font-medium text-slate-400">
                      Tier 3 Fallback: Test Manual 12-Digit UTR
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={12}
                        placeholder="e.g. 499012345678"
                        value={manualUtr}
                        onChange={(e) => setManualUtr(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-hidden focus:border-cyan-500"
                      />
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs"
                      >
                        Verify UTR
                      </button>
                    </div>
                    {utrStatus && <p className="text-xs font-mono">{utrStatus}</p>}
                  </form>
                )}
              </div>
            )}

          </div>

          {/* Right Column: IMAP Setup & Live Event Stream (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Live IMAP Tester Card */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold tracking-wide uppercase text-slate-400 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-cyan-400" />
                  2. Live Gmail IMAP Sync
                </h2>
                <span className="text-[10px] font-mono text-slate-500">TLS Port 993</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Gmail Address</label>
                  <input
                    type="email"
                    placeholder="merchant@gmail.com"
                    value={gmailAddress}
                    onChange={(e) => setGmailAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-hidden focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">16-Character App Password</label>
                  <input
                    type="password"
                    placeholder="xxxx xxxx xxxx xxxx"
                    value={gmailAppPassword}
                    onChange={(e) => setGmailAppPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-hidden focus:border-cyan-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleTestImap}
                  disabled={isTestingImap}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingImap ? 'animate-spin' : ''}`} />
                  <span>{isTestingImap ? 'Connecting...' : 'Test Mailbox Connection'}</span>
                </button>

                {imapStatus && (
                  <p className="text-xs font-mono p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                    {imapStatus}
                  </p>
                )}
              </div>
            </div>

            {/* Live SSE Event Stream & Activity Logs */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold tracking-wide uppercase text-slate-400 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  3. Real-Time Event Stream
                </h2>
                <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  SSE Live
                </span>
              </div>

              <div className="h-64 overflow-y-auto space-y-2 p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs">
                {logs.length === 0 ? (
                  <p className="text-slate-600 text-center py-8">Waiting for payment events...</p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2 text-slate-300 leading-relaxed">
                      <span className="text-slate-600 shrink-0">[{log.time}]</span>
                      <span className={
                        log.type === 'verified'
                          ? 'text-emerald-400 font-bold'
                          : log.type === 'order'
                          ? 'text-cyan-400'
                          : 'text-slate-300'
                      }>
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
