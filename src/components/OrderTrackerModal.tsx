import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Order } from '../types/index.ts';
import {
  CheckCircle2,
  Clock,
  Truck,
  Phone,
  ShieldCheck,
  PackageCheck,
  Receipt,
  X,
  Flame,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  orderId,
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrder();
      const interval = setInterval(fetchOrder, 6000);
      return () => clearInterval(interval);
    }
  }, [isOpen, orderId]);

  if (!isOpen) return null;

  const getStepState = (stepIndex: number) => {
    if (!order) return 'upcoming';
    const status = order.orderStatus;
    const payment = order.paymentStatus;

    // Step 0: Order Placed
    if (stepIndex === 0) return 'completed';

    // Step 1: Payment Verified
    if (stepIndex === 1) {
      return payment === 'completed' ? 'completed' : 'current';
    }

    // Step 2: Preparing & Safety Tested
    if (stepIndex === 2) {
      if (['preparing', 'out_for_delivery', 'delivered'].includes(status)) return 'completed';
      if (status === 'confirmed') return 'current';
      return 'upcoming';
    }

    // Step 3: Out for Delivery
    if (stepIndex === 3) {
      if (status === 'delivered') return 'completed';
      if (status === 'out_for_delivery') return 'current';
      return 'upcoming';
    }

    // Step 4: Delivered
    if (stepIndex === 4) {
      if (status === 'delivered') return 'completed';
      return 'upcoming';
    }

    return 'upcoming';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <Truck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">Order Tracking</h3>
                {order && (
                  <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded-full text-emerald-300">
                    #{order.orderNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Real-time delivery progress & cylinder safety inspection status
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchOrder}
              title="Refresh status"
              className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          {loading && !order ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Loading order information...
            </div>
          ) : order ? (
            <>
              {/* Status Banner */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                    Current Status
                  </div>
                  <div className="text-xl font-bold text-slate-900 mt-0.5 capitalize flex items-center gap-2">
                    {order.orderStatus === 'out_for_delivery' ? (
                      <span className="text-emerald-700 flex items-center gap-1.5">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
                        </span>
                        Out For Delivery
                      </span>
                    ) : order.orderStatus === 'delivered' ? (
                      <span className="text-green-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-5 h-5" />
                        Delivered Successfully
                      </span>
                    ) : (
                      <span>{order.orderStatus.replace('_', ' ')}</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Station: <span className="font-semibold">{order.stationName || 'GasPoint Hub'}</span>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-emerald-100 sm:text-right">
                  <div className="text-xs text-slate-500 font-medium">Estimated Arrival</div>
                  <div className="text-lg font-bold text-slate-900 flex items-center gap-1.5 sm:justify-end">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>~{order.estimatedDeliveryMinutes || 25} Mins</span>
                  </div>
                </div>
              </div>

              {/* Visual Progress Stepper */}
              <div className="py-2">
                <div className="relative flex items-center justify-between">
                  {/* Background line */}
                  <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-200 z-0" />

                  {/* Steps */}
                  {[
                    { label: 'Placed', icon: Receipt },
                    { label: 'Paid (M-Pesa)', icon: ShieldCheck },
                    { label: 'Safety Check', icon: Flame },
                    { label: 'Dispatched', icon: Truck },
                    { label: 'Delivered', icon: PackageCheck },
                  ].map((step, idx) => {
                    const state = getStepState(idx);
                    const StepIcon = step.icon;

                    return (
                      <div key={idx} className="relative z-10 flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                            state === 'completed'
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-4 ring-emerald-50'
                              : state === 'current'
                              ? 'bg-amber-500 text-white animate-pulse ring-4 ring-amber-100'
                              : 'bg-white border-2 border-slate-300 text-slate-400'
                          }`}
                        >
                          <StepIcon className="w-5 h-5" />
                        </div>
                        <span
                          className={`text-[11px] font-semibold mt-2 ${
                            state === 'completed'
                              ? 'text-emerald-700'
                              : state === 'current'
                              ? 'text-amber-600'
                              : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Staff & Address Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Driver Card */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Assigned Delivery Personnel</div>
                    <div className="font-bold text-slate-800 text-sm mt-0.5">
                      {order.deliveryPersonName || 'Jackson Mutiso (EPRA Certified)'}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <a
                        href={`tel:${order.deliveryPersonPhone || '+254714556677'}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200/70 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{order.deliveryPersonPhone || '+254 714 556677'}</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Delivery Location Card */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60">
                  <div className="text-xs text-slate-500 font-medium">Delivery Destination</div>
                  <div className="font-semibold text-slate-800 text-sm mt-0.5">
                    {order.deliveryAddress || 'Pick-up at station'}
                  </div>
                  {order.notes && (
                    <div className="text-xs text-slate-500 mt-2 bg-white p-2 rounded-lg border border-slate-200/60">
                      <span className="font-medium text-slate-700">Notes:</span> {order.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Items & Payment Summary */}
              <div className="border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="font-bold text-slate-900 text-sm">Order Items</h4>
                  <button
                    onClick={() => setShowReceipt(!showReceipt)}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>{showReceipt ? 'Hide Receipt' : 'View Full Receipt'}</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-100 py-2">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, i) => (
                      <div key={i} className="py-2.5 flex items-center justify-between text-sm">
                        <div>
                          <div className="font-semibold text-slate-800">{item.productName}</div>
                          <div className="text-xs text-slate-500">
                            Mode:{' '}
                            <span className="font-medium capitalize text-emerald-700">
                              {item.orderMode.replace('_', ' ')}
                            </span>{' '}
                            • Qty: {item.quantity}
                          </div>
                        </div>
                        <div className="font-bold text-slate-900">
                          KSh {Number(item.subtotal).toLocaleString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 py-2">Standard LPG Cylinder Package</div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>KSh {Number(order.subtotal).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee:</span>
                    <span>KSh {Number(order.deliveryFee).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-slate-900 pt-1.5 border-t border-slate-200">
                    <span>Total Amount Paid:</span>
                    <span className="text-emerald-700">KSh {Number(order.totalAmount).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* LPG Safety & Exchange Reminder */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <AlertTriangle className="w-4 h-4" />
                  <span>LPG Safe Cylinder Exchange Protocol</span>
                </div>
                <p className="leading-relaxed">
                  When our rider arrives, ensure your empty cylinder is unplugged from the regulator. Our certified rider will inspect your rubber hose and perform a free soap-bubble leak test upon installation.
                </p>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-red-500 text-sm">
              Unable to find order details.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
