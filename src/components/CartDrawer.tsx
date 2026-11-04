import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import {
  X,
  Trash2,
  Plus,
  Minus,
  Truck,
  Store,
  Wallet,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface CartDrawerProps {
  onOrderSuccess: (orderId: number, orderNumber: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onOrderSuccess }) => {
  const {
    cart,
    selectedStation,
    deliveryMethod,
    deliveryAddress,
    notes,
    setDeliveryMethod,
    setDeliveryAddress,
    setNotes,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    deliveryFee,
    total,
    isCartOpen,
    setIsCartOpen,
  } = useCart();

  const { currentUser } = useAuth();
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '0790112233');
  const [customerName, setCustomerName] = useState(currentUser?.fullName || 'Sarah Mwangi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<{
    id: number;
    orderNumber: string;
    notice: string;
  } | null>(null);

  if (!isCartOpen) return null;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStation) {
      setError('Please select a gas station first');
      return;
    }
    if (cart.length === 0) {
      setError('Your cart is empty');
      return;
    }
    if (!customerPhone || !customerName) {
      setError('Please provide your name and phone number for delivery contact');
      return;
    }
    if (deliveryMethod === 'delivery' && !deliveryAddress) {
      setError('Please enter your delivery estate/house address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const orderPayload = {
        userId: currentUser?.id,
        stationId: selectedStation.id,
        deliveryMethod,
        deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress : 'Station Pick-up',
        customerPhone,
        customerName,
        customerEmail: currentUser?.email || 'customer@gaspoint.co.ke',
        notes,
        items: cart.map((item) => ({
          productId: item.product.id,
          orderMode: item.orderMode,
          quantity: item.quantity,
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to place order');

      const notice =
        deliveryMethod === 'pickup'
          ? 'You will pay at station at pickup'
          : 'You will make your payment on delivery';

      clearCart();
      setPlacedOrder({
        id: data.id,
        orderNumber: data.orderNumber,
        notice,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPlacedOrder = () => {
    if (!placedOrder) return;
    setIsCartOpen(false);
    onOrderSuccess(placedOrder.id, placedOrder.orderNumber);
    setPlacedOrder(null);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs flex justify-end">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-50 overflow-hidden"
        >
          {/* Drawer Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div>
              <h3 className="font-bold text-base">Your Cart</h3>
              <p className="text-xs text-slate-300">
                {selectedStation ? selectedStation.businessName : 'Select a provider'}
              </p>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {cart.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Truck className="w-8 h-8" />
                </div>
                <h4 className="font-semibold text-slate-800 text-base">Your cart is empty</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Browse through the LPG cylinders and safety accessories to add items to your cart.
                </p>
              </div>
            ) : (
              <>
                {/* Cart Items List */}
                <div className="divide-y divide-slate-100">
                  {cart.map((item, idx) => (
                    <div key={`${item.product.id}-${item.orderMode}-${idx}`} className="py-3 flex gap-3">
                      <img
                        src={item.product.imageUrl || 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=100'}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h5 className="font-bold text-xs text-slate-900 truncate">
                            {item.product.name}
                          </h5>
                          <button
                            onClick={() => removeFromCart(item.product.id, item.orderMode)}
                            className="text-slate-400 hover:text-red-500 p-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 my-1">
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {item.orderMode === 'refill'
                              ? 'Refill Gas'
                              : item.orderMode === 'exchange'
                              ? 'Brand Exchange'
                              : 'Complete Cylinder'}
                          </span>
                          <span className="text-xs text-slate-500">{item.product.cylinderSize}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-0.5">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.orderMode, item.quantity - 1)}
                              className="p-1 rounded text-slate-600 hover:bg-slate-100"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.orderMode, item.quantity + 1)}
                              className="p-1 rounded text-slate-600 hover:bg-slate-100"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="font-bold text-sm text-slate-900">
                            KSh {item.subtotal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery Options */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Fulfillment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('delivery')}
                      className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                        deliveryMethod === 'delivery'
                          ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 ring-2 ring-emerald-600/20'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Truck className={`w-4 h-4 ${deliveryMethod === 'delivery' ? 'text-emerald-700' : 'text-slate-400'}`} />
                      <div>
                        <div className="text-xs font-bold">Doorstep Delivery</div>
                        <div className="text-[10px] text-emerald-600 font-semibold">FREE</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('pickup')}
                      className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                        deliveryMethod === 'pickup'
                          ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 ring-2 ring-emerald-600/20'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Store className={`w-4 h-4 ${deliveryMethod === 'pickup' ? 'text-emerald-700' : 'text-slate-400'}`} />
                      <div>
                        <div className="text-xs font-bold">Station Pickup</div>
                        <div className="text-[10px] text-emerald-600 font-semibold">FREE</div>
                      </div>
                    </button>
                  </div>

                  {/* Customer Information Form */}
                  <div className="space-y-2.5 pt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                        Recipient Name
                      </label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Sarah Mwangi"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                        Phone Number for Delivery Contact
                      </label>
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="0712345678"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                      />
                    </div>

                    {deliveryMethod === 'delivery' && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                          Delivery Address & House Number
                        </label>
                        <input
                          type="text"
                          required
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder="e.g. Westlands, Mpaka Rd, Apt 4B"
                          className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                        Special Instructions / Landmark (Optional)
                      </label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. Ring bell at main gate"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Drawer Footer with Totals and Checkout */}
          {cart.length > 0 && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-800">KSh {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span className="font-semibold text-slate-800">
                    {deliveryFee === 0 ? 'FREE' : `KSh ${deliveryFee.toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Payable:</span>
                  <span className="text-emerald-700">KSh {total.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] leading-relaxed flex items-start gap-2">
                <Wallet className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  {deliveryMethod === 'pickup'
                    ? 'You will pay at station at pickup'
                    : 'You will make your payment on delivery'}
                </span>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleCheckout}
                className="w-full py-3 px-4 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{loading ? 'Placing Order...' : 'Complete Order'}</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Order Placed Confirmation */}
      {placedOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-emerald-100 p-6 text-center space-y-4"
          >
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">Order Placed Successfully!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Order <span className="font-mono font-bold text-slate-800">#{placedOrder.orderNumber}</span> has been sent to{' '}
                <span className="font-semibold">{selectedStation?.businessName || 'your gas station'}</span>.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-semibold flex items-center justify-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{placedOrder.notice}</span>
            </div>
            <button
              type="button"
              onClick={handleViewPlacedOrder}
              className="w-full py-3 px-4 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-700/20 transition-all"
            >
              Track My Order
            </button>
          </motion.div>
        </div>
      )}
    </>
  );
};
