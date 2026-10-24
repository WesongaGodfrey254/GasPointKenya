import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, CheckCircle, AlertCircle, Loader2, ArrowRight, ShieldCheck, X } from 'lucide-react';

interface MpesaModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  orderNumber: string;
  amount: number;
  stationName: string;
  defaultPhone?: string;
  onPaymentSuccess: (receiptNumber: string) => void;
}

export const MpesaModal: React.FC<MpesaModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  amount,
  stationName,
  defaultPhone = '0790112233',
  onPaymentSuccess,
}) => {
  const [phoneNumber, setPhoneNumber] = useState(defaultPhone);
  const [step, setStep] = useState<'input' | 'push_sent' | 'pin_prompt' | 'verifying' | 'success'>('input');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [checkoutRequestId, setCheckoutRequestId] = useState('');
  const [receiptCode, setReceiptCode] = useState('');

  if (!isOpen) return null;

  const handleSendStkPush = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStep('push_sent');

    try {
      const res = await fetch('/api/payments/mpesa-stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          phoneNumber,
          amount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate STK push');
      }

      setCheckoutRequestId(data.checkoutRequestId);
      // Simulate quick STK push arriving on phone screen
      setTimeout(() => {
        setStep('pin_prompt');
      }, 1200);
    } catch (err: any) {
      setError(err.message);
      setStep('input');
    }
  };

  const handleConfirmPin = async () => {
    if (!pin || pin.length < 4) {
      setError('Please enter your 4-digit M-Pesa PIN');
      return;
    }

    setStep('verifying');
    setError(null);

    try {
      const generatedReceipt = `Q${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(10000000 + Math.random() * 90000000)}K`;

      const res = await fetch('/api/payments/mpesa-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          checkoutRequestId,
          resultCode: 0,
          mpesaReceiptNumber: generatedReceipt,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment verification failed');

      setReceiptCode(generatedReceipt);
      setStep('success');

      setTimeout(() => {
        onPaymentSuccess(generatedReceipt);
      }, 1600);
    } catch (err: any) {
      setError(err.message);
      setStep('pin_prompt');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-emerald-100"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-green-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs border border-white/20">
              <Smartphone className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-wide flex items-center gap-1.5">
                Lipa na M-Pesa
                <span className="text-[10px] bg-emerald-500/40 text-emerald-100 uppercase tracking-widest px-1.5 py-0.5 rounded-sm">
                  STK Push
                </span>
              </h3>
              <p className="text-xs text-emerald-100/80">Safaricom Instant Payment Gateway</p>
            </div>
          </div>
          {step !== 'verifying' && step !== 'success' && (
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Order Summary banner */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 mb-5 flex justify-between items-center text-sm">
            <div>
              <div className="text-xs text-slate-500 font-medium">Order #{orderNumber}</div>
              <div className="font-semibold text-slate-800 line-clamp-1">{stationName}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">Payable Amount</div>
              <div className="text-lg font-bold text-emerald-700">
                KSh {amount.toLocaleString()}
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'input' && (
            <form onSubmit={handleSendStkPush} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  M-Pesa Registered Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-medium text-sm">
                    🇰🇪 +254
                  </div>
                  <input
                    type="tel"
                    required
                    value={phoneNumber.replace(/^\+?254/, '')}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="712345678"
                    className="w-full pl-20 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 font-medium text-slate-800"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  An instant Safaricom STK prompt will appear on your phone asking for your M-Pesa PIN.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                >
                  <span>Request STK Push</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>256-bit Encrypted Official Safaricom Daraja API</span>
              </div>
            </form>
          )}

          {step === 'push_sent' && (
            <div className="py-8 text-center space-y-4">
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto" />
              <div>
                <h4 className="font-semibold text-slate-800 text-base">Sending STK Push Prompt...</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Connecting to Safaricom network for <span className="font-semibold">{phoneNumber}</span>
                </p>
              </div>
            </div>
          )}

          {step === 'pin_prompt' && (
            <div className="space-y-4">
              {/* Phone Simulation Card */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 text-xs text-slate-400">
                  <span className="font-mono font-bold text-emerald-400">SAFARICOM M-PESA</span>
                  <span>SIM 1</span>
                </div>
                <div className="text-sm font-medium mb-3">
                  Do you want to pay <span className="text-emerald-400 font-bold">KSh {amount.toLocaleString()}</span> to <span className="text-white font-semibold">GASPOINT LPG</span> for Account <span className="font-mono">{orderNumber}</span>?
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] text-slate-300 uppercase tracking-wider font-semibold">
                    Enter M-Pesa PIN
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    autoFocus
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full text-center tracking-[0.5em] text-2xl font-bold py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 text-center">
                    Enter any 4-digit demo PIN (e.g., 1234)
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPin}
                  className="flex-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all"
                >
                  Authorize Payment
                </button>
              </div>
            </div>
          )}

          {step === 'verifying' && (
            <div className="py-8 text-center space-y-4">
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto" />
              <div>
                <h4 className="font-semibold text-slate-800 text-base">Verifying M-Pesa Transaction...</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Awaiting confirmation callback from Safaricom servers
                </p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-lg">Payment Confirmed!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  M-Pesa Ref: <span className="font-mono font-bold text-emerald-700">{receiptCode}</span>
                </p>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                Your order is confirmed and sent to {stationName} for immediate dispatch.
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
