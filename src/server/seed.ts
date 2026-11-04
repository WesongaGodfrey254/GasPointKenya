import { db } from '../db/index.ts';
import { hashPassword } from './security.ts';
import { users, gasStations, products, orders, orderItems, payments, emailNotifications } from '../db/schema.ts';
import { sql } from 'drizzle-orm';

export async function ensureTablesExist() {
  const tableStatements = [
    sql`CREATE TABLE IF NOT EXISTS "users" (
      "id" serial PRIMARY KEY NOT NULL,
      "uid" text NOT NULL UNIQUE,
      "email" text NOT NULL,
      "password_hash" text,
      "full_name" text,
      "phone" text,
      "role" text DEFAULT 'customer' NOT NULL,
      "avatar_url" text,
      "created_at" timestamp DEFAULT now()
    );`,

    sql`CREATE TABLE IF NOT EXISTS "gas_stations" (
      "id" serial PRIMARY KEY NOT NULL,
      "owner_id" integer REFERENCES "users"("id"),
      "business_name" text NOT NULL,
      "station_code" text NOT NULL UNIQUE,
      "email" text NOT NULL,
      "phone" text NOT NULL,
      "address" text NOT NULL,
      "city" text NOT NULL,
      "county" text,
      "delivery_radius_km" integer DEFAULT 15,
      "operating_hours" text DEFAULT '7:30 AM - 8:30 PM',
      "license_number" text,
      "status" text DEFAULT 'pending_approval' NOT NULL,
      "rating" numeric(3, 2) DEFAULT '4.80',
      "rating_count" integer DEFAULT 12,
      "rejection_reason" text,
      "activation_fee_paid" boolean DEFAULT false,
      "activation_payment_ref" text,
      "approved_at" timestamp,
      "created_at" timestamp DEFAULT now()
    );`,

    sql`CREATE TABLE IF NOT EXISTS "products" (
      "id" serial PRIMARY KEY NOT NULL,
      "station_id" integer REFERENCES "gas_stations"("id"),
      "name" text NOT NULL,
      "brand" text NOT NULL,
      "cylinder_size" text NOT NULL,
      "category" text DEFAULT 'lpg_gas' NOT NULL,
      "refill_price" numeric(10, 2) NOT NULL,
      "exchange_price" numeric(10, 2) NOT NULL,
      "new_cylinder_price" numeric(10, 2) NOT NULL,
      "description" text,
      "stock_quantity" integer DEFAULT 0 NOT NULL,
      "low_stock_threshold" integer DEFAULT 5 NOT NULL,
      "image_url" text,
      "is_active" boolean DEFAULT true NOT NULL,
      "created_at" timestamp DEFAULT now()
    );`,

    sql`CREATE TABLE IF NOT EXISTS "orders" (
      "id" serial PRIMARY KEY NOT NULL,
      "order_number" text NOT NULL UNIQUE,
      "user_id" integer REFERENCES "users"("id"),
      "station_id" integer REFERENCES "gas_stations"("id"),
      "order_type" text DEFAULT 'refill' NOT NULL,
      "delivery_method" text DEFAULT 'delivery' NOT NULL,
      "delivery_address" text,
      "customer_phone" text NOT NULL,
      "customer_name" text NOT NULL,
      "subtotal" numeric(10, 2) NOT NULL,
      "delivery_fee" numeric(10, 2) DEFAULT '0.00' NOT NULL,
      "total_amount" numeric(10, 2) NOT NULL,
      "order_status" text DEFAULT 'pending' NOT NULL,
      "payment_status" text DEFAULT 'pending' NOT NULL,
      "delivery_person_name" text,
      "delivery_person_phone" text,
      "notes" text,
      "estimated_delivery_minutes" integer DEFAULT 35,
      "delivered_at" timestamp,
      "created_at" timestamp DEFAULT now()
    );`,

    sql`CREATE TABLE IF NOT EXISTS "order_items" (
      "id" serial PRIMARY KEY NOT NULL,
      "order_id" integer REFERENCES "orders"("id"),
      "product_id" integer REFERENCES "products"("id"),
      "product_name" text NOT NULL,
      "cylinder_size" text NOT NULL,
      "order_mode" text DEFAULT 'refill' NOT NULL,
      "quantity" integer DEFAULT 1 NOT NULL,
      "unit_price" numeric(10, 2) NOT NULL,
      "subtotal" numeric(10, 2) NOT NULL
    );`,

    sql`CREATE TABLE IF NOT EXISTS "payments" (
      "id" serial PRIMARY KEY NOT NULL,
      "order_id" integer REFERENCES "orders"("id"),
      "user_id" integer REFERENCES "users"("id"),
      "amount" numeric(10, 2) NOT NULL,
      "method" text DEFAULT 'pay_on_delivery' NOT NULL,
      "phone_number" text NOT NULL,
      "mpesa_receipt_number" text,
      "status" text DEFAULT 'pending' NOT NULL,
      "checkout_request_id" text,
      "merchant_request_id" text,
      "created_at" timestamp DEFAULT now()
    );`,

    sql`CREATE TABLE IF NOT EXISTS "email_notifications" (
      "id" serial PRIMARY KEY NOT NULL,
      "recipient_email" text NOT NULL,
      "recipient_name" text,
      "subject" text NOT NULL,
      "template_type" text NOT NULL,
      "content" text NOT NULL,
      "status" text DEFAULT 'sent' NOT NULL,
      "sent_at" timestamp DEFAULT now()
    );`,
  ];

  for (const stmt of tableStatements) {
    try {
      await db.execute(stmt);
    } catch (err) {
      console.error('Error executing table statement:', err);
    }
  }
}

export async function seedDatabaseIfEmpty() {
  try {
    await ensureTablesExist();

    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      return; // Already seeded
    }

    console.log('Seeding initial GasPoint database records...');

    // 1. Create Super Admin User (configured via .env, no hardcoded personal credentials)
    const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || 'admin@gaspoint.co.ke').trim().toLowerCase();
    const superAdminPass = process.env.SUPER_ADMIN_PASSWORD || 'GasPointAdmin2026!';
    const superAdminHash = hashPassword(superAdminPass);
    const superAdminName = process.env.SUPER_ADMIN_NAME || 'Super Administrator';
    const superAdminPhone = process.env.SUPER_ADMIN_PHONE || '+254700000000';

    const [superAdmin] = await db.insert(users).values({
      uid: 'admin-super-uid-1',
      email: superAdminEmail,
      passwordHash: superAdminHash,
      fullName: superAdminName,
      phone: superAdminPhone,
      role: 'super_admin',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    }).returning();

    // 2. Create Gas Station Owners
    const [owner1] = await db.insert(users).values({
      uid: 'owner-uid-nairobi-gas',
      email: 'john.kamau@nairobigas.co.ke',
      fullName: 'John Kamau (Westlands Gas Hub)',
      phone: '+254722100200',
      role: 'gas_owner',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    }).returning();

    const [owner2] = await db.insert(users).values({
      uid: 'owner-uid-rubis-kilimani',
      email: 'mary.odhiambo@rubiskilimani.co.ke',
      fullName: 'Mary Odhiambo (Rubis Kilimani Point)',
      phone: '+254733400500',
      role: 'gas_owner',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    }).returning();

    const [pendingOwner] = await db.insert(users).values({
      uid: 'owner-uid-apex-flame',
      email: 'david.mutua@apexflame.com',
      fullName: 'David Mutua (Apex Flame South B)',
      phone: '+254711889900',
      role: 'gas_owner',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    }).returning();

    // 3. Create Sample Customer
    const [sampleCustomer] = await db.insert(users).values({
      uid: 'customer-uid-sarah',
      email: 'sarah.mwangi@gmail.com',
      fullName: 'Sarah Mwangi',
      phone: '+254790112233',
      role: 'customer',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    }).returning();

    // 4. Create Gas Stations
    const [station1] = await db.insert(gasStations).values({
      ownerId: owner1.id,
      businessName: 'TotalEnergies & ProGas Westlands Hub',
      stationCode: 'GP-NBI-001',
      email: 'orders@westlandsgashub.co.ke',
      phone: '+254722100200',
      address: 'Mpaka Road, Westlands Commercial Center',
      city: 'Nairobi',
      county: 'Nairobi County',
      deliveryRadiusKm: 18,
      operatingHours: '7:00 AM - 9:00 PM',
      licenseNumber: 'EPRA/LPG/2026/8941',
      status: 'approved',
      rating: '4.90',
      ratingCount: 38,
      approvedAt: new Date(),
    }).returning();

    const [station2] = await db.insert(gasStations).values({
      ownerId: owner2.id,
      businessName: 'Rubis K-Gas & Afrigas Express Kilimani',
      stationCode: 'GP-NBI-002',
      email: 'sales@rubiskilimani.co.ke',
      phone: '+254733400500',
      address: 'Argwings Kodhek Rd, Opp Yaya Centre',
      city: 'Nairobi',
      county: 'Nairobi County',
      deliveryRadiusKm: 15,
      operatingHours: '7:30 AM - 8:30 PM',
      licenseNumber: 'EPRA/LPG/2026/7219',
      status: 'approved',
      rating: '4.85',
      ratingCount: 29,
      approvedAt: new Date(),
    }).returning();

    // Pending Gas Station waiting for Super Admin approval
    await db.insert(gasStations).values({
      ownerId: pendingOwner.id,
      businessName: 'Apex Flame Gas Point South B',
      stationCode: 'GP-NBI-003',
      email: 'info@apexflame.com',
      phone: '+254711889900',
      address: 'Kapiti Estate, Plainsview Road, South B',
      city: 'Nairobi',
      county: 'Nairobi County',
      deliveryRadiusKm: 12,
      operatingHours: '8:00 AM - 8:00 PM',
      licenseNumber: 'EPRA/LPG/2026/9932-PENDING',
      status: 'pending_approval',
      rating: '5.00',
      ratingCount: 0,
    });

    // 5. Create Products for Station 1
    const p1 = await db.insert(products).values([
      {
        stationId: station1.id,
        name: 'TotalEnergies LPG Gas Cylinder',
        brand: 'TotalEnergies',
        cylinderSize: '6kg',
        category: 'lpg_gas',
        refillPrice: '1250.00',
        exchangePrice: '1350.00',
        newCylinderPrice: '4800.00',
        description: 'Original factory-sealed TotalEnergies 6kg gas cylinder with safety tamper-evident seal and KEBS certification.',
        stockQuantity: 42,
        lowStockThreshold: 10,
        imageUrl: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=400&auto=format&fit=crop&q=80',
        isActive: true,
      },
      {
        stationId: station1.id,
        name: 'TotalEnergies LPG Gas Cylinder',
        brand: 'TotalEnergies',
        cylinderSize: '13kg',
        category: 'lpg_gas',
        refillPrice: '2800.00',
        exchangePrice: '2950.00',
        newCylinderPrice: '8900.00',
        description: 'Standard 13kg cylinder suitable for family cooking. Tested for zero leaks and verified accurate net weight.',
        stockQuantity: 28,
        lowStockThreshold: 8,
        imageUrl: 'https://images.unsplash.com/photo-1542013936693-884638332954?w=400&auto=format&fit=crop&q=80',
        isActive: true,
      },
      {
        stationId: station1.id,
        name: 'Pro Gas Cylinder',
        brand: 'Pro Gas',
        cylinderSize: '13kg',
        category: 'lpg_gas',
        refillPrice: '2750.00',
        exchangePrice: '2900.00',
        newCylinderPrice: '8700.00',
        description: 'High pressure safety tested Pro Gas 13kg cylinder with quick-snap valve.',
        stockQuantity: 3, // Low stock example!
        lowStockThreshold: 5,
        imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=400&auto=format&fit=crop&q=80',
        isActive: true,
      },
      {
        stationId: station1.id,
        name: 'Commercial Heavy-Duty Gas Cylinder',
        brand: 'TotalEnergies',
        cylinderSize: '22.5kg',
        category: 'lpg_gas',
        refillPrice: '4900.00',
        exchangePrice: '5100.00',
        newCylinderPrice: '14200.00',
        description: 'Commercial 22.5kg cylinder for restaurants, bakeries, and catering operations.',
        stockQuantity: 12,
        lowStockThreshold: 4,
        imageUrl: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=400&auto=format&fit=crop&q=80',
        isActive: true,
      },
      {
        stationId: station1.id,
        name: 'EPRA Certified Gas Regulator with Pressure Gauge',
        brand: 'TotalEnergies',
        cylinderSize: 'Accessory',
        category: 'accessory',
        refillPrice: '1450.00',
        exchangePrice: '1450.00',
        newCylinderPrice: '1450.00',
        description: 'Low-pressure anti-leak gas regulator featuring an easy-read dial gauge to monitor remaining gas level.',
        stockQuantity: 25,
        lowStockThreshold: 5,
        imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80',
        isActive: true,
      },
      {
        stationId: station1.id,
        name: 'Heavy-Duty Reinforced Gas Hose (2 Meters + Clamps)',
        brand: 'Generic',
        cylinderSize: 'Accessory',
        category: 'accessory',
        refillPrice: '850.00',
        exchangePrice: '850.00',
        newCylinderPrice: '850.00',
        description: 'Three-layer high-durability rubber gas hose with rust-proof jubilee clamps. Resists cracking and punctures.',
        stockQuantity: 35,
        lowStockThreshold: 5,
        imageUrl: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&auto=format&fit=crop&q=80',
        isActive: true,
      },
    ]).returning();

    // 6. Products for Station 2
    await db.insert(products).values([
      {
        stationId: station2.id,
        name: 'Rubis K-Gas LPG Cylinder',
        brand: 'Rubis K-Gas',
        cylinderSize: '6kg',
        category: 'lpg_gas',
        refillPrice: '1200.00',
        exchangePrice: '1300.00',
        newCylinderPrice: '4750.00',
        description: 'Genuine Rubis K-Gas 6kg cylinder with blue safety seal. Reliable and clean burning flame.',
        stockQuantity: 30,
        lowStockThreshold: 8,
        imageUrl: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=400&auto=format&fit=crop&q=80',
        isActive: true,
      },
      {
        stationId: station2.id,
        name: 'Rubis K-Gas LPG Cylinder',
        brand: 'Rubis K-Gas',
        cylinderSize: '13kg',
        category: 'lpg_gas',
        refillPrice: '2750.00',
        exchangePrice: '2900.00',
        newCylinderPrice: '8800.00',
        description: 'Genuine Rubis K-Gas 13kg cylinder. Factory calibrated for exact gas volume and maximum safety.',
        stockQuantity: 24,
        lowStockThreshold: 6,
        imageUrl: 'https://images.unsplash.com/photo-1542013936693-884638332954?w=400&auto=format&fit=crop&q=80',
        isActive: true,
      },
      {
        stationId: station2.id,
        name: 'Afrigas LPG Cylinder',
        brand: 'Afrigas',
        cylinderSize: '13kg',
        category: 'lpg_gas',
        refillPrice: '2780.00',
        exchangePrice: '2920.00',
        newCylinderPrice: '8850.00',
        description: 'Afrigas clean-cooking 13kg cylinder with security seal.',
        stockQuantity: 18,
        lowStockThreshold: 5,
        imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=400&auto=format&fit=crop&q=80',
        isActive: true,
      },
      {
        stationId: station2.id,
        name: 'Cast Iron Heavy Duty Gas Burner Head',
        brand: 'Generic',
        cylinderSize: 'Accessory',
        category: 'accessory',
        refillPrice: '1200.00',
        exchangePrice: '1200.00',
        newCylinderPrice: '1200.00',
        description: 'Screw-on top grill burner for 6kg gas cylinders. Sturdy and energy efficient.',
        stockQuantity: 20,
        lowStockThreshold: 5,
        imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80',
        isActive: true,
      },
    ]);

    // 7. Seed Sample Orders
    const [sampleOrder1] = await db.insert(orders).values({
      orderNumber: 'GP-2026-9041',
      userId: sampleCustomer.id,
      stationId: station1.id,
      orderType: 'refill',
      deliveryMethod: 'delivery',
      deliveryAddress: 'House 4B, Woodvale Grove, Westlands, Nairobi',
      customerPhone: '+254790112233',
      customerName: 'Sarah Mwangi',
      subtotal: '2800.00',
      deliveryFee: '0.00',
      totalAmount: '2800.00',
      orderStatus: 'out_for_delivery',
      paymentStatus: 'pending',
      deliveryPersonName: 'Jackson Mutiso',
      deliveryPersonPhone: '+254714556677',
      estimatedDeliveryMinutes: 20,
      notes: 'Please test valve connection upon arrival.',
    }).returning();

    await db.insert(orderItems).values({
      orderId: sampleOrder1.id,
      productId: p1[1].id,
      productName: 'TotalEnergies LPG Gas Cylinder - 13kg',
      cylinderSize: '13kg',
      orderMode: 'refill',
      quantity: 1,
      unitPrice: '2800.00',
      subtotal: '2800.00',
    });

    await db.insert(payments).values({
      orderId: sampleOrder1.id,
      userId: sampleCustomer.id,
      amount: '2800.00',
      method: 'pay_on_delivery',
      phoneNumber: '254790112233',
      status: 'pending',
    });

    // Delivered Order
    const [sampleOrder2] = await db.insert(orders).values({
      orderNumber: 'GP-2026-8812',
      userId: sampleCustomer.id,
      stationId: station1.id,
      orderType: 'new_cylinder',
      deliveryMethod: 'delivery',
      deliveryAddress: 'Parklands Avenue Apt 12, Nairobi',
      customerPhone: '+254790112233',
      customerName: 'Sarah Mwangi',
      subtotal: '4800.00',
      deliveryFee: '0.00',
      totalAmount: '4800.00',
      orderStatus: 'delivered',
      paymentStatus: 'completed',
      deliveryPersonName: 'Jackson Mutiso',
      deliveryPersonPhone: '+254714556677',
      deliveredAt: new Date(Date.now() - 86400000 * 2),
      notes: 'Gate code 4910',
    }).returning();

    await db.insert(orderItems).values({
      orderId: sampleOrder2.id,
      productId: p1[0].id,
      productName: 'TotalEnergies LPG Gas Cylinder - 6kg',
      cylinderSize: '6kg',
      orderMode: 'new_cylinder',
      quantity: 1,
      unitPrice: '4800.00',
      subtotal: '4800.00',
    });

    await db.insert(payments).values({
      orderId: sampleOrder2.id,
      userId: sampleCustomer.id,
      amount: '4800.00',
      method: 'pay_on_delivery',
      phoneNumber: '254790112233',
      status: 'successful',
    });

    // 8. Seed sample automated email notifications
    await db.insert(emailNotifications).values([
      {
        recipientEmail: superAdminEmail,
        recipientName: superAdminName,
        subject: '[Action Required] New Gas Point Application: Apex Flame South B',
        templateType: 'superadmin_approval_request',
        content: 'David Mutua has submitted a new Gas Point registration for "Apex Flame Gas Point South B" with License EPRA/LPG/2026/9932-PENDING. Please review and verify this station.',
        status: 'sent',
      },
      {
        recipientEmail: 'orders@westlandsgashub.co.ke',
        recipientName: 'TotalEnergies Westlands Hub',
        subject: 'New Order Received #GP-2026-9041 (Pay on Delivery)',
        templateType: 'order_receipt',
        content: 'Customer Sarah Mwangi placed an order for TotalEnergies 13kg refill. Total: Ksh 2,800 with free delivery to Woodvale Grove, Westlands. You will make your payment on delivery.',
        status: 'sent',
      },
      {
        recipientEmail: 'sarah.mwangi@gmail.com',
        recipientName: 'Sarah Mwangi',
        subject: 'Your GasPoint Order #GP-2026-9041 is Out for Delivery!',
        templateType: 'order_dispatched',
        content: 'Good news! Your 13kg cylinder order is on its way. Delivery driver Jackson Mutiso (+254714556677) will arrive in approximately 20 minutes. Please keep your empty cylinder ready.',
        status: 'sent',
      },
    ]);

    console.log('GasPoint database seeded successfully!');
  } catch (err) {
    console.error('Error during initial database seed:', err);
  }
}
