export type UserRole = 'super_admin' | 'gas_owner' | 'customer' | 'delivery';

export interface User {
  id: number;
  uid: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

export type StationStatus = 'pending_approval' | 'approved' | 'rejected' | 'suspended';

export interface GasStation {
  id: number;
  ownerId?: number;
  businessName: string;
  stationCode: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  county?: string;
  deliveryRadiusKm: number;
  operatingHours: string;
  licenseNumber?: string;
  status: StationStatus;
  rating: number | string;
  ratingCount: number;
  rejectionReason?: string;
  activationFeePaid?: boolean;
  activationPaymentRef?: string;
  approvedAt?: string;
  createdAt: string;
  // Computed / joined fields
  productCount?: number;
  ownerName?: string;
  ownerEmail?: string;
}

export type CylinderSize = '6kg' | '13kg' | '22.5kg' | '45kg' | 'Accessory';
export type ProductCategory = 'lpg_gas' | 'accessory';
export type OrderMode = 'refill' | 'exchange' | 'new_cylinder';

export interface Product {
  id: number;
  stationId: number;
  name: string;
  brand: string;
  cylinderSize: CylinderSize;
  category: ProductCategory;
  refillPrice: string | number;
  exchangePrice: string | number;
  newCylinderPrice: string | number;
  description?: string;
  stockQuantity: number;
  lowStockThreshold: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type DeliveryMethod = 'delivery' | 'pickup';

export interface OrderItem {
  id?: number;
  orderId?: number;
  productId: number;
  productName: string;
  cylinderSize: CylinderSize;
  orderMode: OrderMode;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  stationId: number;
  orderType: string;
  deliveryMethod: DeliveryMethod;
  deliveryAddress?: string;
  customerPhone: string;
  customerName: string;
  subtotal: string | number;
  deliveryFee: string | number;
  totalAmount: string | number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryPersonName?: string;
  deliveryPersonPhone?: string;
  notes?: string;
  estimatedDeliveryMinutes?: number;
  deliveredAt?: string;
  createdAt: string;
  // Joined fields
  stationName?: string;
  stationPhone?: string;
  items?: OrderItem[];
  payments?: Payment[];
}

export interface Payment {
  id: number;
  orderId: number;
  userId: number;
  amount: string | number;
  method: string;
  phoneNumber: string;
  mpesaReceiptNumber?: string;
  status: string;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  createdAt: string;
}

export interface EmailNotification {
  id: number;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  templateType: string;
  content: string;
  status: string;
  sentAt: string;
}

export interface CartItem {
  product: Product;
  orderMode: OrderMode;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}
