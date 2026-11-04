import React, { useState, useEffect } from 'react';
import { GasStation, Product, OrderMode, Order } from '../types/index.ts';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Store,
  MapPin,
  Clock,
  Star,
  ShieldCheck,
  Check,
  Flame,
  Search,
  ArrowRight,
  Truck,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { OrderTrackerModal } from './OrderTrackerModal.tsx';

interface CustomerDashboardProps {
  onOpenSafetyGuide: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ onOpenSafetyGuide }) => {
  const { currentUser } = useAuth();
  const { selectedStation, setSelectedStation, addToCart, cart } = useCart();

  const [stations, setStations] = useState<GasStation[]>([]);
  const [loadingStations, setLoadingStations] = useState(true);
  const [stationSearch, setStationSearch] = useState('');

  // Selected station products
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Customer orders
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'providers' | 'orders'>('providers');
  const [trackingOrderId, setTrackingOrderId] = useState<number | null>(null);

  // Selected mode for each product card: { [productId]: OrderMode }
  const [productOrderModes, setProductOrderModes] = useState<Record<number, OrderMode>>({});

  // Fetch stations
  const fetchStations = async () => {
    try {
      const res = await fetch('/api/stations?status=approved');
      if (res.ok) {
        const data = await res.json();
        setStations(data);
        if (!selectedStation && data.length > 0) {
          setSelectedStation(data[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStations(false);
    }
  };

  // Fetch products for selected station
  const fetchProducts = async (stationId: number) => {
    setLoadingProducts(true);
    try {
      const res = await fetch(`/api/products?stationId=${stationId}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Fetch customer orders
  const fetchCustomerOrders = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/orders?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setCustomerOrders(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  useEffect(() => {
    if (selectedStation) {
      fetchProducts(selectedStation.id);
    }
  }, [selectedStation]);

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchCustomerOrders();
    }
  }, [activeTab, currentUser]);

  const filteredStations = stations.filter(
    (s) =>
      s.businessName.toLowerCase().includes(stationSearch.toLowerCase()) ||
      s.city.toLowerCase().includes(stationSearch.toLowerCase()) ||
      s.address.toLowerCase().includes(stationSearch.toLowerCase())
  );

  const filteredProducts = products.filter((p) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'accessory') return p.category === 'accessory';
    return p.cylinderSize === selectedCategory;
  });

  const handleOrderModeChange = (productId: number, mode: OrderMode) => {
    setProductOrderModes((prev) => ({
      ...prev,
      [productId]: mode,
    }));
  };

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F3D2E] via-emerald-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>EPRA & KEBS Certified Kenyan LPG Network</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Fast, Reliable Cooking Gas Delivered to Your Doorstep.
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Choose your nearest verified GasPoint depot, select your cylinder refill or exchange, and pay on delivery or at the station when you pick up.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('providers')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                activeTab === 'providers'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              Browse Gas Stations & Catalogue
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                activeTab === 'orders'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              My Orders & Live Tracking
            </button>
            <button
              onClick={onOpenSafetyGuide}
              className="px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-amber-500/20 border border-amber-400/40 text-amber-200 hover:bg-amber-500/30 transition-all flex items-center gap-1.5"
            >
              <Flame className="w-4 h-4 text-amber-400" />
              <span>LPG Safety Rules</span>
            </button>
          </div>
        </div>

        {/* Ambient flame graphic glow */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 pointer-events-none bg-gradient-to-l from-emerald-400 to-transparent blur-3xl" />
      </div>

      {activeTab === 'providers' ? (
        <>
          {/* Section 1: Choose Gas Point Provider */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Store className="w-5 h-5 text-emerald-600" />
                  <span>Choose Your GasPoint Provider</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Select a certified depot near your estate for fastest 30-minute delivery or pickup
                </p>
              </div>

              {/* Station search */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search estate or station..."
                  value={stationSearch}
                  onChange={(e) => setStationSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white shadow-xs"
                />
              </div>
            </div>

            {/* Providers Cards Grid */}
            {loadingStations ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-44 rounded-2xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : filteredStations.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
                No verified gas stations found matching your search.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStations.map((st) => {
                  const isSelected = selectedStation?.id === st.id;
                  return (
                    <div
                      key={st.id}
                      onClick={() => setSelectedStation(st)}
                      className={`cursor-pointer rounded-2xl p-5 border transition-all text-left relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/40 shadow-md ring-2 ring-emerald-600/20'
                          : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold text-slate-900 text-base line-clamp-1">
                            {st.businessName}
                          </div>
                          {isSelected && (
                            <span className="shrink-0 flex items-center gap-1 bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                              <Check className="w-3 h-3" />
                              Active
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{st.address}, {st.city}</span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-1 font-semibold text-amber-600">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            <span>{st.rating} ({st.ratingCount || 12})</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{st.operatingHours}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                          Radius: <strong className="text-slate-700">{st.deliveryRadiusKm} km</strong>
                        </span>
                        <span className={`font-bold ${isSelected ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {isSelected ? 'Currently Viewing Catalogue' : 'Tap to View Products →'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Product Catalogue for Selected Station */}
          {selectedStation && (
            <div className="space-y-5 pt-4">
              {/* Selected Station Banner */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      {selectedStation.stationCode}
                    </span>
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      EPRA Licensed Station
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    {selectedStation.businessName} Catalogue
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedStation.address} • Phone: {selectedStation.phone} • FREE Delivery & Station Pickup
                  </p>
                </div>

                {/* Category Filter Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: 'All Products' },
                    { id: '6kg', label: '6kg Cylinders' },
                    { id: '13kg', label: '13kg Cylinders' },
                    { id: '22.5kg', label: '22.5kg Commercial' },
                    { id: 'accessory', label: 'Accessories' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                        selectedCategory === cat.id
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Products Cards */}
              {loadingProducts ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-80 rounded-2xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
                  No products found in this category for {selectedStation.businessName}.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((prod) => {
                    const activeMode: OrderMode = productOrderModes[prod.id] || 'refill';
                    const isAccessory = prod.category === 'accessory';

                    // Price based on selected mode
                    let currentPrice = Number(prod.refillPrice);
                    if (activeMode === 'exchange') currentPrice = Number(prod.exchangePrice);
                    if (activeMode === 'new_cylinder') currentPrice = Number(prod.newCylinderPrice);

                    const isLowStock = prod.stockQuantity <= prod.lowStockThreshold;
                    const isOutOfStock = prod.stockQuantity <= 0;

                    return (
                      <div
                        key={prod.id}
                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        {/* Image & Stock Badge */}
                        <div className="relative h-44 bg-slate-50 overflow-hidden">
                          <img
                            src={prod.imageUrl || 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=400'}
                            alt={prod.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-3 left-3 flex gap-2">
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-xs text-white">
                              {prod.brand}
                            </span>
                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-600 text-white">
                              {prod.cylinderSize}
                            </span>
                          </div>

                          <div className="absolute top-3 right-3">
                            {isOutOfStock ? (
                              <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-red-600 text-white">
                                Out of Stock
                              </span>
                            ) : isLowStock ? (
                              <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-amber-500 text-white animate-pulse">
                                Only {prod.stockQuantity} left
                              </span>
                            ) : (
                              <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-emerald-900/80 backdrop-blur-xs text-emerald-200">
                                {prod.stockQuantity} in stock
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Product Info & Order Mode Switcher */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-base leading-snug">
                              {prod.name}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {prod.description}
                            </p>
                          </div>

                          {/* Refill / Exchange / New Cylinder Selector */}
                          {!isAccessory ? (
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Select Order Type:
                              </label>
                              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl text-center">
                                <button
                                  type="button"
                                  onClick={() => handleOrderModeChange(prod.id, 'refill')}
                                  className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all ${
                                    activeMode === 'refill'
                                      ? 'bg-white text-emerald-800 shadow-xs'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  Refill
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOrderModeChange(prod.id, 'exchange')}
                                  className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all ${
                                    activeMode === 'exchange'
                                      ? 'bg-white text-emerald-800 shadow-xs'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  Exchange
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOrderModeChange(prod.id, 'new_cylinder')}
                                  className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all ${
                                    activeMode === 'new_cylinder'
                                      ? 'bg-white text-emerald-800 shadow-xs'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  New Set
                                </button>
                              </div>
                              <p className="text-[10px] text-slate-400 italic">
                                {activeMode === 'refill'
                                  ? 'Swap empty cylinder of same brand'
                                  : activeMode === 'exchange'
                                  ? 'Swap cylinder of another brand'
                                  : 'Purchase complete brand new cylinder'}
                              </p>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500 py-1">
                              High-durability safety certified accessory
                            </div>
                          )}

                          {/* Price and Add to Cart */}
                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                            <div>
                              <div className="text-[10px] text-slate-400 font-medium">Price</div>
                              <div className="text-lg font-black text-emerald-800">
                                KSh {currentPrice.toLocaleString()}
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={isOutOfStock}
                              onClick={() => addToCart(prod, activeMode, 1)}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-700/20 flex items-center gap-1.5 transition-all hover:scale-[1.02]"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>Add to Cart</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* Section: Customer Orders & History */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">My Orders & Deliveries</h2>
              <p className="text-xs text-slate-500">Track current cylinder orders and view transaction receipts</p>
            </div>
            <button
              onClick={fetchCustomerOrders}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {customerOrders.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-800">No Orders Yet</h4>
              <p className="text-xs max-w-sm mx-auto">
                Select your preferred GasPoint provider above and place your first LPG cylinder order!
              </p>
              <button
                onClick={() => setActiveTab('providers')}
                className="mt-3 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
              >
                Browse Gas Stations
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {customerOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
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
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ord.orderStatus.replace('_', ' ')}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                          ord.paymentStatus === 'completed'
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : 'text-amber-700 bg-amber-50 border-amber-200'
                        }`}
                      >
                        {ord.paymentStatus === 'completed'
                          ? 'Paid'
                          : ord.deliveryMethod === 'pickup'
                          ? 'Pay at station'
                          : 'Pay on delivery'}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-slate-900">
                      {ord.stationName || 'GasPoint Depot'}
                    </div>

                    <div className="text-xs text-slate-500">
                      Method: <strong className="capitalize">{ord.deliveryMethod}</strong> • Total: <strong className="text-emerald-800">KSh {Number(ord.totalAmount).toLocaleString()}</strong> • {new Date(ord.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setTrackingOrderId(ord.id)}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <Truck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Track Order</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Order Tracker Modal */}
      {trackingOrderId && (
        <OrderTrackerModal
          isOpen={true}
          orderId={trackingOrderId}
          onClose={() => setTrackingOrderId(null)}
        />
      )}
    </div>
  );
};
