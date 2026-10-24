import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// Users table (Customers, Gas Point Owners, Super Admin, Delivery Staff)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID or system ID
  email: text('email').notNull(),
  passwordHash: text('password_hash'),
  fullName: text('full_name'),
  phone: text('phone'),
  role: text('role').notNull().default('customer'), // 'super_admin' | 'gas_owner' | 'customer' | 'delivery'
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Gas Stations / Providers (owned by a gas_owner user)
export const gasStations = pgTable('gas_stations', {
  id: serial('id').primaryKey(),
  ownerId: integer('owner_id').references(() => users.id),
  businessName: text('business_name').notNull(),
  stationCode: text('station_code').notNull().unique(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  county: text('county'),
  deliveryRadiusKm: integer('delivery_radius_km').default(15),
  operatingHours: text('operating_hours').default('7:30 AM - 8:30 PM'),
  licenseNumber: text('license_number'),
  status: text('status').notNull().default('pending_approval'), // 'pending_approval' | 'approved' | 'rejected' | 'suspended'
  rating: numeric('rating', { precision: 3, scale: 2 }).default('4.80'),
  ratingCount: integer('rating_count').default(12),
  rejectionReason: text('rejection_reason'),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Products & Inventory for each Gas Station
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  stationId: integer('station_id').references(() => gasStations.id),
  name: text('name').notNull(),
  brand: text('brand').notNull(), // 'TotalEnergies', 'Rubis K-Gas', 'Afrigas', 'Shell Gas', 'Pro Gas', 'Hass Gas', etc.
  cylinderSize: text('cylinder_size').notNull(), // '6kg', '13kg', '22.5kg', '45kg', 'Accessory'
  category: text('category').notNull().default('lpg_gas'), // 'lpg_gas', 'accessory'
  refillPrice: numeric('refill_price', { precision: 10, scale: 2 }).notNull(),
  exchangePrice: numeric('exchange_price', { precision: 10, scale: 2 }).notNull(),
  newCylinderPrice: numeric('new_cylinder_price', { precision: 10, scale: 2 }).notNull(),
  description: text('description'),
  stockQuantity: integer('stock_quantity').notNull().default(0),
  lowStockThreshold: integer('low_stock_threshold').notNull().default(5),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Orders
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  userId: integer('user_id').references(() => users.id),
  stationId: integer('station_id').references(() => gasStations.id),
  orderType: text('order_type').notNull().default('refill'), // 'refill' | 'exchange' | 'new_cylinder' | 'mixed'
  deliveryMethod: text('delivery_method').notNull().default('delivery'), // 'delivery' | 'pickup'
  deliveryAddress: text('delivery_address'),
  customerPhone: text('customer_phone').notNull(),
  customerName: text('customer_name').notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  deliveryFee: numeric('delivery_fee', { precision: 10, scale: 2 }).notNull().default('0.00'),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  orderStatus: text('order_status').notNull().default('pending'), // 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled'
  paymentStatus: text('payment_status').notNull().default('pending'), // 'pending' | 'completed' | 'failed'
  deliveryPersonName: text('delivery_person_name'),
  deliveryPersonPhone: text('delivery_person_phone'),
  notes: text('notes'),
  estimatedDeliveryMinutes: integer('estimated_delivery_minutes').default(35),
  deliveredAt: timestamp('delivered_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Order Items
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id),
  productId: integer('product_id').references(() => products.id),
  productName: text('product_name').notNull(),
  cylinderSize: text('cylinder_size').notNull(),
  orderMode: text('order_mode').notNull().default('refill'), // 'refill' | 'exchange' | 'new_cylinder'
  quantity: integer('quantity').notNull().default(1),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
});

// Payments (M-Pesa & others)
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id),
  userId: integer('user_id').references(() => users.id),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  method: text('method').notNull().default('mpesa'),
  phoneNumber: text('phone_number').notNull(),
  mpesaReceiptNumber: text('mpesa_receipt_number'),
  status: text('status').notNull().default('pending'), // 'pending' | 'successful' | 'failed'
  checkoutRequestId: text('checkout_request_id'),
  merchantRequestId: text('merchant_request_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Automated Email Notifications and Audit Log
export const emailNotifications = pgTable('email_notifications', {
  id: serial('id').primaryKey(),
  recipientEmail: text('recipient_email').notNull(),
  recipientName: text('recipient_name'),
  subject: text('subject').notNull(),
  templateType: text('template_type').notNull(), // 'owner_welcome', 'superadmin_approval_request', 'owner_approved', 'order_receipt', 'order_dispatched', 'order_delivered'
  content: text('content').notNull(),
  status: text('status').notNull().default('sent'), // 'sent' | 'pending' | 'failed'
  sentAt: timestamp('sent_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  orders: many(orders),
  ownedStation: one(gasStations, {
    fields: [users.id],
    references: [gasStations.ownerId],
  }),
}));

export const gasStationsRelations = relations(gasStations, ({ one, many }) => ({
  owner: one(users, {
    fields: [gasStations.ownerId],
    references: [users.id],
  }),
  products: many(products),
  orders: many(orders),
}));

export const productsRelations = relations(products, ({ one }) => ({
  station: one(gasStations, {
    fields: [products.stationId],
    references: [gasStations.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  station: one(gasStations, {
    fields: [orders.stationId],
    references: [gasStations.id],
  }),
  items: many(orderItems),
  payments: many(payments),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}));
