import React, { useState, useEffect } from 'react';
import { GasStation, Product, Order, OrderStatus } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Store,
  Package,
  Truck,
  TrendingUp,
  AlertTriangle,
  Plus,
  Edit2,
  CheckCircle2,
  Clock,
  Phone,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Search,
  Check,
  X,
  FileCheck,
  Upload,
  Trash2,
  Image as ImageIcon,
  CreditCard,
  Send,
  Wallet,
} from 'lucide-react';

export const OwnerDashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();

  const [station, setStation] = useState<GasStation | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'analytics'>('orders');

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [selectedOrderForDispatch, setSelectedOrderForDispatch] = useState<Order | null>(null);
  const [driverName, setDriverName] = useState('Jackson Mutiso');
  const [driverPhone, setDriverPhone] = useState('+254714556677');
  const [deliveryMinutes, setDeliveryMinutes] = useState('25');

  // Activation Fee Payment State (KSh 3,000 on 0706184411)
  const [paymentRefInput, setPaymentRefInput] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentSubmitMsg, setPaymentSubmitMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Inventory (Station Stock & Pricing starts empty as configured)
  const [products, setProducts] = useState<Product[]>([]);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    brand: 'TotalEnergies',
    cylinderSize: '13kg',
    category: 'lpg_gas',
    refillPrice: '',
    exchangePrice: '',
    newCylinderPrice: '',
    stockQuantity: '',
    lowStockThreshold: '5',
    description: '',
    imageUrl: '',
  });

  // Analytics
  const [analytics, setAnalytics] = useState<any>(null);

  const fetchStationData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // Find station owned by currentUser or fallback to station 1 / 3
      const res = await fetch('/api/stations?all=true');
      if (res.ok) {
        const stationsList: GasStation[] = await res.json();
        const myStation =
          stationsList.find((s) => s.ownerId === currentUser.id) ||
          stationsList.find((s) => s.email.toLowerCase() === currentUser.email.toLowerCase()) ||
          stationsList[0];

        setStation(myStation || null);

        if (myStation) {
          // Fetch orders
          const ordRes = await fetch(`/api/orders?stationId=${myStation.id}`);
          if (ordRes.ok) setOrders(await ordRes.json());

          // Fetch products
          const prodRes = await fetch(`/api/products?stationId=${myStation.id}`);
          if (prodRes.ok) setProducts(await prodRes.json());

          // Fetch analytics
          const anaRes = await fetch(`/api/stations/${myStation.id}/analytics`);
          if (anaRes.ok) setAnalytics(await anaRes.json());
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStationData();
  }, [currentUser]);

  // Handle Order Status Update
  const handleUpdateOrderStatus = async (
    orderId: number,
    newStatus: OrderStatus,
    driverInfo?: { name: string; phone: string; minutes: number }
  ) => {
    try {
      const payload: any = { orderStatus: newStatus };
      if (driverInfo) {
        payload.deliveryPersonName = driverInfo.name;
        payload.deliveryPersonPhone = driverInfo.phone;
        payload.estimatedDeliveryMinutes = driverInfo.minutes;
      }

      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSelectedOrderForDispatch(null);
        fetchStationData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Mark payment as collected (on delivery or at station pickup)
  const handleMarkPaymentCollected = async (orderId: number) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: 'completed' }),
      });
      if (res.ok) {
        fetchStationData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Product Stock Increment / Decrement
  const handleUpdateStock = async (productId: number, newStock: number) => {
    if (newStock < 0) return;
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockQuantity: newStock }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, stockQuantity: newStock } : p))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Image Upload from device (convert to base64 data url)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2.5 * 1024 * 1024) {
        alert('File size exceeds 2.5MB. Please upload a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct((prev) => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Add Product to Station
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!station) return;
    setSubmittingProduct(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProduct,
          stationId: station.id,
        }),
      });

      if (res.ok) {
        setIsAddProductOpen(false);
        setNewProduct({
          name: '',
          brand: 'TotalEnergies',
          cylinderSize: '13kg',
          category: 'lpg_gas',
          refillPrice: '',
          exchangePrice: '',
          newCylinderPrice: '',
          stockQuantity: '',
          lowStockThreshold: '5',
          description: '',
          imageUrl: '',
        });
        fetchStationData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingProduct(false);
    }
  };

  // Delete Product from Station
  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('Are you sure you want to remove this product from your station inventory?')) return;
    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Activation Payment Reference (KSh 3,000 on 0706184411)
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!station || !paymentRefInput.trim()) return;
    setPaymentSubmitting(true);
    setPaymentSubmitMsg(null);
    try {
      const res = await fetch(`/api/stations/${station.id}/submit-activation-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mpesaReference: paymentRefInput.trim(),
          phoneNumber: station.phone,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPaymentSubmitMsg({ type: 'success', text: data.message });
        setStation((prev) => prev ? { ...prev, activationPaymentRef: paymentRefInput.trim().toUpperCase() } : null);
        setPaymentRefInput('');
      } else {
        setPaymentSubmitMsg({ type: 'error', text: data.error || 'Failed to submit payment reference' });
      }
    } catch (err: any) {
      setPaymentSubmitMsg({ type: 'error', text: err.message || 'Network error submitting payment' });
    } finally {
      setPaymentSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-sm">
        Loading GasPoint Owner Dashboard...
      </div>
    );
  }

  if (!station) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
        <Store className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">No Gas Point Station Registered</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          You are currently signed in as a Gas Point Owner, but haven't registered your physical station yet.
        </p>
      </div>
    );
  }

  // PENDING VERIFICATION & ACTIVATION SCREEN (Super Admin must approve first after KSh 3,000 fee on 0706184411)
  if (station.status === 'pending_approval') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-6">
        <div className="bg-white border-2 border-amber-300 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-lg">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-800 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full">
              Status: Awaiting Admin Approval & Activation
            </span>
            <h2 className="text-2xl font-black text-slate-900 pt-2">
              {station.businessName}
            </h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Station Code: <strong className="font-mono text-emerald-700">{station.stationCode}</strong> • License: <strong className="font-mono">{station.licenseNumber}</strong>
            </p>
          </div>

          {/* Activation Fee Payment Requirement Box */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/60 rounded-2xl p-6 text-left border-2 border-emerald-300 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-700" />
                <h3 className="font-extrabold text-sm text-slate-900">
                  Required Activation Fee for Account Approval
                </h3>
              </div>
              <span className="text-sm font-black text-emerald-800 bg-white px-3 py-1 rounded-full border border-emerald-200 shadow-xs">
                KSh 3,000
              </span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              To have your station verified and approved by the Super Admin to access the system, please pay the one-time platform onboarding and EPRA compliance review fee of <strong>KSh 3,000</strong>.
            </p>

            {/* M-Pesa Payment Details */}
            <div className="bg-white rounded-xl p-4 border border-emerald-200 space-y-2">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span>M-Pesa Payment Instructions:</span>
              </div>
              <ol className="text-xs text-slate-700 space-y-1.5 list-decimal list-inside">
                <li>Go to <strong>M-Pesa</strong> menu on your phone</li>
                <li>Select <strong>Send Money</strong></li>
                <li>Enter Phone Number: <strong className="font-mono text-emerald-800 text-sm bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">0706184411</strong></li>
                <li>Enter Amount: <strong className="text-slate-900 font-bold">KSh 3,000</strong></li>
                <li>Enter Account / Reference: <strong className="font-mono text-slate-900">{station.stationCode}</strong></li>
                <li>Enter your PIN to complete the transfer</li>
              </ol>
            </div>

            {/* Confirmation Code Submission Form */}
            <form onSubmit={handleSubmitPayment} className="space-y-3 pt-1">
              <label className="block text-xs font-bold text-slate-800">
                After paying, enter your M-Pesa Transaction Reference Code:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. QHK894120M"
                  value={paymentRefInput}
                  onChange={(e) => setPaymentRefInput(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2.5 rounded-xl border border-emerald-300 bg-white font-mono text-xs uppercase focus:outline-emerald-600"
                />
                <button
                  type="submit"
                  disabled={paymentSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{paymentSubmitting ? 'Submitting...' : 'Submit Payment Ref'}</span>
                </button>
              </div>

              {paymentSubmitMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold ${
                    paymentSubmitMsg.type === 'success'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-red-100 text-red-900 border border-red-300'
                  }`}
                >
                  {paymentSubmitMsg.text}
                </div>
              )}

              {station.activationPaymentRef && (
                <div className="p-3 rounded-xl bg-emerald-100/80 border border-emerald-300 text-emerald-950 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    Payment Reference <strong>{station.activationPaymentRef}</strong> has been submitted. The Super Admin is verifying receipt of KSh 3,000 on <strong>0706184411</strong> and will approve your station.
                  </span>
                </div>
              )}
            </form>
          </div>

          {/* Compliance Info */}
          <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-slate-700" />
              <span>Inspection & Safety Compliance</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Address: <strong>{station.address}, {station.city}</strong> • Contact: <strong>{station.phone}</strong>. Once approved, you can immediately add your cylinder stock, pricing, and upload pictures.
            </p>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs">
            <button
              onClick={fetchStationData}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Check Approval Status</span>
            </button>
            <button
              onClick={() => logout()}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all"
            >
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // REJECTED SCREEN
  if (station.status === 'rejected') {
    return (
      <div className="max-w-xl mx-auto p-8 bg-red-50 border border-red-200 rounded-3xl text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-600 mx-auto" />
        <h3 className="text-xl font-bold text-red-900">Application Rejected</h3>
        <p className="text-xs text-slate-700">
          Reason: {station.rejectionReason || 'Incomplete licensing documents.'}
        </p>
        <button
          onClick={() => logout()}
          className="text-xs font-semibold text-slate-800 underline"
        >
          Log Out & Return to Login
        </button>
      </div>
    );
  }

  // APPROVED DASHBOARD
  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'all') return true;
    if (orderFilter === 'pending') return o.orderStatus === 'pending' || o.orderStatus === 'confirmed';
    if (orderFilter === 'preparing') return o.orderStatus === 'preparing';
    if (orderFilter === 'in_transit') return o.orderStatus === 'out_for_delivery';
    if (orderFilter === 'delivered') return o.orderStatus === 'delivered';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Station Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
              {station.stationCode}
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Verified & Active Provider
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">{station.businessName}</h1>
          <p className="text-xs text-slate-500">
            {station.address}, {station.city} • EPRA License: {station.licenseNumber || 'EPRA/LPG/VALID'} • Delivery Radius: {station.deliveryRadiusKm}km
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Fulfillment Board</span>
            {orders.filter((o) => o.orderStatus !== 'delivered').length > 0 && (
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
                {orders.filter((o) => o.orderStatus !== 'delivered').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'inventory'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Inventory & Cylinders</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'analytics'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Sales History & Trends</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ORDERS FULFILLMENT BOARD */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: 'All Orders' },
                { id: 'pending', label: 'New Orders' },
                { id: 'preparing', label: 'Preparing / Tested' },
                { id: 'in_transit', label: 'Out for Delivery' },
                { id: 'delivered', label: 'Completed' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setOrderFilter(f.id)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                    orderFilter === f.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <button
              onClick={fetchStationData}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Orders</span>
            </button>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-sm">
              No orders found in this fulfillment state.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-800">
                          #{ord.orderNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            ord.orderStatus === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.orderStatus === 'out_for_delivery'
                              ? 'bg-blue-100 text-blue-800 animate-pulse'
                              : ord.orderStatus === 'preparing'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.orderStatus.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="font-bold text-sm text-emerald-700">
                        KSh {Number(ord.totalAmount).toLocaleString()}
                      </span>
                    </div>

                    <div className="pt-3 space-y-1.5 text-xs">
                      <div>
                        Customer: <strong className="text-slate-800">{ord.customerName}</strong> (
                        <a href={`tel:${ord.customerPhone}`} className="text-emerald-700 font-semibold underline">
                          {ord.customerPhone}
                        </a>
                        )
                      </div>
                      <div>
                        Destination:{' '}
                        <strong className="text-slate-800">
                          {ord.deliveryMethod === 'delivery' ? ord.deliveryAddress : 'Customer Pickup'}
                        </strong>
                      </div>
                      <div>
                        Payment:{' '}
                        <strong className={ord.paymentStatus === 'completed' ? 'text-emerald-700' : 'text-amber-700'}>
                          {ord.paymentStatus === 'completed'
                            ? 'Paid'
                            : ord.deliveryMethod === 'pickup'
                            ? 'Pay at station at pickup'
                            : 'Pay on delivery'}
                        </strong>
                      </div>
                      {ord.notes && (
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
                          Notes: {ord.notes}
                        </div>
                      )}

                      {ord.deliveryPersonName && (
                        <div className="p-2 bg-emerald-50/70 border border-emerald-100 rounded-lg text-emerald-900 font-medium flex items-center justify-between">
                          <span>Driver: {ord.deliveryPersonName} ({ord.deliveryPersonPhone})</span>
                          <span>ETA: ~{ord.estimatedDeliveryMinutes}m</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions according to status */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
                    {ord.paymentStatus !== 'completed' &&
                    ['out_for_delivery', 'delivered'].includes(ord.orderStatus) ? (
                      <button
                        onClick={() => handleMarkPaymentCollected(ord.id)}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1"
                      >
                        <Wallet className="w-3.5 h-3.5" />
                        <span>Mark Payment Collected</span>
                      </button>
                    ) : null}

                    {ord.orderStatus === 'pending' || ord.orderStatus === 'confirmed' ? (
                      <button
                        onClick={() => handleUpdateOrderStatus(ord.id, 'preparing')}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all"
                      >
                        Start Preparation & Test
                      </button>
                    ) : null}

                    {ord.orderStatus === 'preparing' ? (
                      <button
                        onClick={() => setSelectedOrderForDispatch(ord)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Assign Rider & Dispatch</span>
                      </button>
                    ) : null}

                    {ord.orderStatus === 'out_for_delivery' ? (
                      <button
                        onClick={() => handleUpdateOrderStatus(ord.id, 'delivered')}
                        className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark Delivered</span>
                      </button>
                    ) : null}

                    {ord.orderStatus === 'delivered' ? (
                      <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Order Completed</span>
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INVENTORY & STOCK MANAGEMENT */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Station Stock & Pricing</h3>
              <p className="text-xs text-slate-500">
                Manage your LPG cooking gas cylinders, set refill and exchange rates, and upload product pictures
              </p>
            </div>
            <button
              onClick={() => setIsAddProductOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 self-start sm:self-auto transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>

          {products.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-inner">
                <Package className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-900 text-base">Your Station Stock & Pricing is Empty</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  You haven't listed any cooking gas cylinders yet. Click <strong>Add Product</strong> below to set up your stock, specify your refill and exchange pricing, and upload product pictures.
                </p>
              </div>
              <button
                onClick={() => setIsAddProductOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs inline-flex items-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Product</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Picture & Product</th>
                      <th className="py-3 px-4">Size</th>
                      <th className="py-3 px-4">Refill Price</th>
                      <th className="py-3 px-4">Exchange Price</th>
                      <th className="py-3 px-4">New Cylinder</th>
                      <th className="py-3 px-4">Stock</th>
                      <th className="py-3 px-4">Adjust Stock</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((prod) => {
                      const isLowStock = prod.stockQuantity <= prod.lowStockThreshold;
                      return (
                        <tr key={prod.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center">
                                {prod.imageUrl ? (
                                  <img
                                    src={prod.imageUrl}
                                    alt={prod.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <ImageIcon className="w-5 h-5 text-slate-400" />
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{prod.name}</div>
                                <div className="text-[11px] text-slate-400">{prod.brand}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800">{prod.cylinderSize}</span>
                          </td>
                          <td className="py-3 px-4 font-bold text-emerald-800">
                            KSh {Number(prod.refillPrice).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-bold text-emerald-800">
                            KSh {Number(prod.exchangePrice).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-bold text-emerald-800">
                            KSh {Number(prod.newCylinderPrice).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`font-bold px-2 py-0.5 rounded-md ${
                                isLowStock
                                  ? 'bg-red-100 text-red-800 animate-pulse'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {prod.stockQuantity} {isLowStock ? '(LOW)' : ''}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleUpdateStock(prod.id, prod.stockQuantity - 1)}
                                className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100"
                              >
                                -
                              </button>
                              <button
                                onClick={() => handleUpdateStock(prod.id, prod.stockQuantity + 5)}
                                className="px-2 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold hover:bg-emerald-100"
                              >
                                +5
                              </button>
                              <button
                                onClick={() => handleUpdateStock(prod.id, prod.stockQuantity + 10)}
                                className="px-2 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold hover:bg-emerald-100"
                              >
                                +10
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeleteProduct(prod.id)}
                              title="Delete Product"
                              className="w-7 h-7 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 inline-flex items-center justify-center transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PERSONAL SALES HISTORY & ANALYTICS */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Total Station Revenue</div>
              <div className="text-2xl font-black text-emerald-800 mt-1">
                KSh {analytics.totalRevenue.toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-600 mt-1">From completed orders</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Completed Orders</div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {analytics.completedOrdersCount} / {analytics.totalOrders}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Fulfilled deliveries</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Pending Fulfillment</div>
              <div className="text-2xl font-black text-amber-600 mt-1">
                {analytics.pendingOrdersCount}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">In preparation / transit</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Low Stock Alerts</div>
              <div className={`text-2xl font-black mt-1 ${analytics.lowStockCount > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                {analytics.lowStockCount} Items
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Needs reordering</div>
            </div>
          </div>

          {/* Daily Sales Trends Visual */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">
              Daily Sales Trend (Last 7 Days)
            </h3>
            <div className="grid grid-cols-7 gap-2 pt-4">
              {analytics.dailySalesTrends.map((d: any, idx: number) => {
                const maxRev = Math.max(...analytics.dailySalesTrends.map((t: any) => t.revenue), 10000);
                const heightPercent = Math.max(12, Math.round((d.revenue / maxRev) * 100));

                return (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-700">
                      KSh {d.revenue > 0 ? (d.revenue / 1000).toFixed(1) + 'k' : '0'}
                    </span>
                    <div className="w-full bg-slate-100 rounded-xl h-36 flex items-end p-1.5">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-gradient-to-t from-emerald-700 to-emerald-500 rounded-lg transition-all"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold">{d.date}</span>
                    <span className="text-[9px] text-slate-400">{d.orderCount} orders</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* DISPATCH DRIVER MODAL */}
      {selectedOrderForDispatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-600" />
                <span>Assign Delivery Rider</span>
              </h3>
              <button
                onClick={() => setSelectedOrderForDispatch(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600">
              Dispatching Order <strong>#{selectedOrderForDispatch.orderNumber}</strong> to{' '}
              <strong>{selectedOrderForDispatch.customerName}</strong>.
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Rider Name
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Rider Contact Phone
                </label>
                <input
                  type="tel"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Estimated Delivery Time (Minutes)
                </label>
                <input
                  type="number"
                  value={deliveryMinutes}
                  onChange={(e) => setDeliveryMinutes(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedOrderForDispatch(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  handleUpdateOrderStatus(selectedOrderForDispatch.id, 'out_for_delivery', {
                    name: driverName,
                    phone: driverPhone,
                    minutes: Number(deliveryMinutes) || 25,
                  })
                }
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD PRODUCT MODAL WITH PICTURE UPLOAD */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <form
            onSubmit={handleAddProduct}
            className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 my-8"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Add New LPG Product</h3>
                <p className="text-[11px] text-slate-500">Configure your stock, pricing, and product picture</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddProductOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs max-h-[70vh] overflow-y-auto pr-1">
              <div className="col-span-2">
                <label className="block font-bold text-slate-800 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TotalEnergies 13kg Cooking Gas Cylinder"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-emerald-600 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Brand</label>
                <select
                  value={newProduct.brand}
                  onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Taifa Gas">Taifa Gas</option>
                  <option value="Lake Gas">Lake Gas</option>
                  <option value="Galana Gas">Galana Gas</option>
                  <option value="Supa Gas">Supa Gas</option>
                  <option value="Mpishi Gas">Mpishi Gas</option>
                  <option value="Sea gas">Sea gas</option>
                  <option value="M Gas">M Gas</option>
                  <option value="TotalEnergies">TotalEnergies</option>
                  <option value="Rubis K-Gas">Rubis K-Gas</option>
                  <option value="Afrigas">Afrigas</option>
                  <option value="Shell Gas">Shell Gas</option>
                  <option value="Pro Gas">Pro Gas</option>
                  <option value="Hass Gas">Hass Gas</option>
                  <option value="Ola Energy">Ola Energy</option>
                  <option value="Generic">Generic / Accessory</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Cylinder Size</label>
                <select
                  value={newProduct.cylinderSize}
                  onChange={(e) => setNewProduct({ ...newProduct, cylinderSize: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="6kg">6kg Cylinder</option>
                  <option value="13kg">13kg Cylinder</option>
                  <option value="22.5kg">22.5kg Commercial</option>
                  <option value="45kg">45kg Industrial</option>
                  <option value="Accessory">Accessory / Burner / Regulator</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Refill Price (KSh)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1250"
                  value={newProduct.refillPrice}
                  onChange={(e) => setNewProduct({ ...newProduct, refillPrice: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-emerald-600 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Exchange Price (KSh)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1350"
                  value={newProduct.exchangePrice}
                  onChange={(e) => setNewProduct({ ...newProduct, exchangePrice: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-emerald-600 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">New Complete Cylinder (KSh)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 4800"
                  value={newProduct.newCylinderPrice}
                  onChange={(e) => setNewProduct({ ...newProduct, newCylinderPrice: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-emerald-600 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Initial Stock Quantity</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 25"
                  value={newProduct.stockQuantity}
                  onChange={(e) => setNewProduct({ ...newProduct, stockQuantity: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-emerald-600 font-semibold"
                />
              </div>

              {/* PRODUCT PICTURE UPLOAD & SELECTION */}
              <div className="col-span-2 pt-2 border-t border-slate-100 space-y-2">
                <label className="block font-bold text-slate-900">
                  Product Picture / Photo
                </label>

                {/* Upload from Computer / Phone */}
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 font-bold text-slate-700 flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Picture File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-slate-400">or paste image link below</span>
                </div>

                {/* Image URL input */}
                <input
                  type="url"
                  placeholder="https://... or upload a file above"
                  value={newProduct.imageUrl}
                  onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />

                {/* Quick Presets for realistic Kenyan LPG cylinders */}
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-500 font-semibold">Or pick a quick preset image:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setNewProduct({
                          ...newProduct,
                          imageUrl: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=400&auto=format&fit=crop&q=80',
                        })
                      }
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-medium text-slate-700"
                    >
                      6kg Cylinder
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setNewProduct({
                          ...newProduct,
                          imageUrl: 'https://images.unsplash.com/photo-1542013936693-884638332954?w=400&auto=format&fit=crop&q=80',
                        })
                      }
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-medium text-slate-700"
                    >
                      13kg Cylinder
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setNewProduct({
                          ...newProduct,
                          imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=400&auto=format&fit=crop&q=80',
                        })
                      }
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-medium text-slate-700"
                    >
                      Afrigas / Blue
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setNewProduct({
                          ...newProduct,
                          imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80',
                        })
                      }
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-medium text-slate-700"
                    >
                      Regulator / Burner
                    </button>
                  </div>
                </div>

                {/* Picture Preview */}
                {newProduct.imageUrl && (
                  <div className="mt-2 flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <img
                      src={newProduct.imageUrl}
                      alt="Product Preview"
                      className="w-14 h-14 rounded-lg object-cover border border-slate-200 bg-white"
                    />
                    <div className="text-[11px] text-slate-600">
                      <div className="font-bold text-slate-800">Picture Preview</div>
                      <div className="text-emerald-700 font-semibold">Image loaded successfully</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddProductOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingProduct}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all"
              >
                {submittingProduct ? 'Saving Product...' : 'Save Product'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
