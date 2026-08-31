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
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Zap,
  Smartphone,
  Check
} from 'lucide-react';
import { BrandMarkSvg, BrandBackground } from '@/lib/brand';

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
  matchTier?: string;
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
      addLog(`Verified order ${data.order.id} via ${data.alert.bank} (UTR: ${data.alert.utr})`, 'verified');
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

  const handleCreateOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
        setImapStatus(`Connected to ${gmailAddress}! (${data.mailboxCount} emails in INBOX)`);
      } else {
        setImapStatus(`Failed: ${data.message} ${data.error ? `(${data.error})` : ''}`);
      }
    } catch (err: any) {
      setImapStatus(`Error: ${err.message}`);
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
        setUtrStatus('Payment verified successfully!');
        setActiveOrder(data.order);
      } else {
        setUtrStatus(`Failed: ${data.error}`);
      }
    } catch (err: any) {
      setUtrStatus(`Error: ${err.message}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-[#0A0F1D] flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-800">
      
      {/* Brand Background Canvas */}
      <BrandBackground
        variant="light-tactile"
        showEdgeSilhouette
        edgePosition="dual-bleed"
        edgeOpacity={0.10}
        watermarkPosition="dual"
        watermarkOpacity={0.04}
        showGrid
        showArcs
        showGlow
        className="flex-1"
      >
        
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 px-4 sm:px-8 pt-4 pointer-events-none">
          <nav className="max-w-7xl mx-auto flex items-center justify-between bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-full px-5 py-2.5 shadow-lg shadow-slate-900/5 liquid-border pointer-events-auto">
            
            {/* Official Brand Logo */}
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#0A0F1D] flex items-center justify-center shadow-xs">
                <div className="w-5 h-5">
                  <BrandMarkSvg size="100%" />
                </div>
              </span>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-tight text-[#0A0F1D]">
                  UPIlerify
                </span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 text-[10px] font-mono font-bold border border-cyan-200">
                  Starter SDK v1.0
                </span>
              </div>
            </div>

            {/* Right Action Links */}
            <div className="flex items-center gap-2">
              <a
                href="https://upilerify.online"
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-[#0A0F1D] hover:bg-slate-100 transition-colors"
              >
                <span>Website & Docs</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
              <a
                href="https://github.com/harshavarma02/upilerify"
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-2 text-xs font-bold text-[#0A0F1D] cursor-pointer"
              >
                <span className="hidden md:inline text-slate-700 group-hover:text-[#0066FF] transition-colors">
                  Star & Fork Repo
                </span>
                <span className="w-8 h-8 rounded-full bg-[#0A0F1D] text-white flex items-center justify-center transition-all duration-300 group-hover:bg-[#0066FF] group-hover:scale-105 shadow-xs">
                  <ArrowUpRight className="w-4 h-4 text-[#00D2FF]" />
                </span>
              </a>
            </div>

          </nav>
        </header>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-10">
          
          {/* Section Hero Headline */}
          <div className="space-y-4 max-w-3xl">
            <p className="text-xs tracking-widest text-slate-500 font-mono font-bold flex items-center gap-2">
              <span className="w-6 h-px bg-slate-400" />
              OPEN-SOURCE DEVELOPER STARTER & LIVE CONSOLE
            </p>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0A0F1D] leading-tight">
              0% Fee UPI Verification Engine.
            </h1>
            <p className="text-base text-slate-600 leading-relaxed">
              A self-hosted payment orchestrator for Next.js & Node.js. Reconciles incoming bank credit alert emails via Gmail IMAP in sub-2.8s with 0% gateway cuts.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold font-mono">
                0% Middleman Cut
              </span>
              <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 text-xs font-bold font-mono">
                Sub-2.8s Regex Match
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold font-mono">
                13+ Indian Banks
              </span>
            </div>
          </div>

          {/* Top 2 Cards: Step 1 (Create Order) & Step 2 (Scan & Verify) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Card 1: Intent Creation (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-8 rounded-[2rem] bg-white/90 backdrop-blur-xl border border-slate-200/90 shadow-[0_20px_60px_-15px_rgba(15,118,110,0.12)] liquid-border">
              <div className="space-y-6">
                
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-cyan-50 text-cyan-600 font-bold text-xs flex items-center justify-center border border-cyan-200">
                      1
                    </span>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 font-mono">
                      CREATE PAYMENT ORDER
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
                    0% Gateway Fee
                  </span>
                </div>

                <form onSubmit={handleCreateOrder} className="space-y-5">
                  {/* Amount Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide font-mono mb-1.5">
                      Amount (INR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400 font-mono">
                        ₹
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full pl-9 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xl font-bold font-mono text-[#0A0F1D] focus:outline-hidden focus:bg-white focus:border-[#0066FF] transition-all"
                      />
                    </div>

                    {/* Quick Amount Preset Chips */}
                    <div className="flex items-center gap-1.5 mt-2.5">
                      {['100', '499', '1000', '2500'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setAmount(preset)}
                          className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                            amount === preset
                              ? 'bg-[#0A0F1D] text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          ₹{preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Merchant VPA */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide font-mono mb-1.5">
                      Destination UPI ID (VPA)
                    </label>
                    <input
                      type="text"
                      required
                      value={merchantUpi}
                      onChange={(e) => setMerchantUpi(e.target.value)}
                      placeholder="merchant@upi"
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-mono text-[#0A0F1D] focus:outline-hidden focus:bg-white focus:border-[#0066FF] transition-all"
                    />
                  </div>

                  {/* Merchant Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide font-mono mb-1.5">
                      Merchant Display Name
                    </label>
                    <input
                      type="text"
                      value={merchantName}
                      onChange={(e) => setMerchantName(e.target.value)}
                      placeholder="My SaaS Store"
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-[#0A0F1D] focus:outline-hidden focus:bg-white focus:border-[#0066FF] transition-all"
                    />
                  </div>

                  {/* Micro-paisa Offset Checkbox */}
                  <div className="flex items-center gap-2.5 pt-1">
                    <input
                      type="checkbox"
                      id="microOffset"
                      checked={useMicroOffset}
                      onChange={(e) => setUseMicroOffset(e.target.checked)}
                      className="w-4 h-4 rounded text-[#0066FF] focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="microOffset" className="text-xs text-slate-600 select-none cursor-pointer">
                      Use micro-paisa dynamic collision offset (+₹0.01)
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isCreatingOrder}
                    className="w-full py-3.5 px-6 rounded-2xl bg-[#0A0F1D] hover:bg-[#0066FF] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-slate-900/10 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{isCreatingOrder ? 'Generating...' : 'Generate Dynamic QR & Intent'}</span>
                    <ArrowRight className="w-4 h-4 text-[#00D2FF]" />
                  </button>
                </form>

              </div>
            </div>

            {/* Card 2: Luxury Dark Verification Stage (7 Cols) */}
            <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-8 rounded-[2rem] bg-[#0A0F1D] text-white border border-slate-800 shadow-2xl relative overflow-hidden liquid-border-dark">
              
              {/* Corner Ambient Glow */}
              <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

              <div className="space-y-6 relative z-10">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-cyan-500/20 text-[#00D2FF] font-bold text-xs flex items-center justify-center border border-cyan-500/30">
                      2
                    </span>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                      SCAN & LIVE VERIFICATION STAGE
                    </h2>
                  </div>
                  {activeOrder && (
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                      activeOrder.status === 'VERIFIED'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                    }`}>
                      {activeOrder.status}
                    </span>
                  )}
                </div>

                {activeOrder && upiIntentUri ? (
                  <div className="space-y-6">
                    
                    {/* Inner 2-column Stage */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-stretch">
                      
                      {/* Left: Step Progress Pipeline (7 Cols) */}
                      <div className="sm:col-span-7 flex flex-col justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                        <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wide">
                          Verification Pipeline
                        </span>

                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-[#00D2FF] flex items-center justify-center font-mono font-bold text-[10px]">
                              1
                            </span>
                            <span className="text-slate-300 font-medium">Dynamic UPI Intent URI Active</span>
                          </div>

                          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-[10px]">
                              2
                            </span>
                            <span className="text-slate-300 font-medium">Gmail IMAP TLS Listener Watching</span>
                          </div>

                          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                            <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-mono font-bold text-[10px]">
                              3
                            </span>
                            <span className="text-slate-300 font-medium">Sub-2.8s Regex Multi-Bank Match</span>
                          </div>
                        </div>

                        {/* Order Meta Footer */}
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                          <span>Ref: <strong className="text-cyan-400">{activeOrder.refNote}</strong></span>
                          <span>ID: {activeOrder.id.slice(0, 10)}...</span>
                        </div>
                      </div>

                      {/* Right: Sharp QR Stand (5 Cols) */}
                      <div className="sm:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-3">
                        <div className="p-3 bg-white rounded-2xl shadow-xl">
                          <QRCodeSVG value={upiIntentUri} size={130} level="M" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-xl font-bold font-mono text-white">
                            ₹{activeOrder.expectedAmount.toFixed(2)}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">
                            Scan to Pay (0% Cut)
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Bottom Action Deck */}
                    <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-3">
                      {checkoutUrl && (
                        <a
                          href={checkoutUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all"
                        >
                          <Smartphone className="w-4 h-4 text-[#00D2FF]" />
                          <span>Open Customer Pay Page</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}

                      <button
                        onClick={() => copyToClipboard(upiIntentUri)}
                        className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold font-mono flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied Intent URI' : 'Copy Intent URI'}</span>
                      </button>
                    </div>

                  </div>
                ) : (
                  <div className="py-20 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-slate-400 font-medium">
                      Fill Step 1 and click <strong>&quot;Generate Dynamic QR&quot;</strong> to start live stage.
                    </p>
                  </div>
                )}

              </div>
            </div>

          </div>

          {/* Bottom 2 Cards: IMAP Setup & Real-time Log Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Card 3: Live Gmail IMAP Sync (5 Cols) */}
            <div className="lg:col-span-5 p-6 sm:p-8 rounded-[2rem] bg-white/90 backdrop-blur-xl border border-slate-200/90 shadow-[0_20px_60px_-15px_rgba(15,118,110,0.12)] liquid-border space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-cyan-50 text-cyan-600 font-bold text-xs flex items-center justify-center border border-cyan-200">
                    3
                  </span>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 font-mono">
                    GMAIL IMAP TLS CONNECTOR
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-slate-500">Port 993 TLS</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide font-mono mb-1.5">
                    Gmail Address
                  </label>
                  <input
                    type="email"
                    placeholder="merchant@gmail.com"
                    value={gmailAddress}
                    onChange={(e) => setGmailAddress(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-mono text-[#0A0F1D] focus:outline-hidden focus:bg-white focus:border-[#0066FF] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide font-mono mb-1.5">
                    16-Character App Password
                  </label>
                  <input
                    type="password"
                    placeholder="xxxx xxxx xxxx xxxx"
                    value={gmailAppPassword}
                    onChange={(e) => setGmailAppPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-mono text-[#0A0F1D] focus:outline-hidden focus:bg-white focus:border-[#0066FF] transition-all"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Generate at: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-[#0066FF] hover:underline font-mono">Google App Passwords ↗</a>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleTestImap}
                  disabled={isTestingImap}
                  className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-[#0A0F1D] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingImap ? 'animate-spin' : ''}`} />
                  <span>{isTestingImap ? 'Connecting...' : 'Test Mailbox Connection'}</span>
                </button>

                {imapStatus && (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700">
                    {imapStatus}
                  </div>
                )}
              </div>
            </div>

            {/* Card 4: SSE Terminal & Live Log Inspector (7 Cols) */}
            <div className="lg:col-span-7 p-6 sm:p-8 rounded-[2rem] bg-white/90 backdrop-blur-xl border border-slate-200/90 shadow-[0_20px_60px_-15px_rgba(15,118,110,0.12)] liquid-border space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-cyan-50 text-cyan-600 font-bold text-xs flex items-center justify-center border border-cyan-200">
                    4
                  </span>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 font-mono">
                    REAL-TIME SSE EVENT STREAM
                  </h2>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live SSE
                </span>
              </div>

              {/* Terminal Box */}
              <div className="rounded-2xl overflow-hidden bg-[#0A0F1D] text-slate-200 border border-slate-800 shadow-inner">
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    <span className="text-[11px] font-mono text-slate-400 ml-2">upilerify-event-daemon</span>
                  </div>
                </div>

                <div className="h-60 overflow-y-auto p-4 font-mono text-xs space-y-2">
                  {logs.length === 0 ? (
                    <p className="text-slate-600 text-center py-16">
                      Awaiting live payment events & bank alerts...
                    </p>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-slate-500 shrink-0">[{log.time}]</span>
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

        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200/80 py-8 px-4 sm:px-8 text-center text-xs text-slate-500 font-mono">
          <p>
            UPIlerify Open-Source Starter Kit · Released under the MIT License · Made for Indian Developers & Founders
          </p>
        </footer>

      </BrandBackground>
    </div>
  );
}
