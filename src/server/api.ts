import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/index.ts';
import {
  users,
  gasStations,
  products,
  orders,
  orderItems,
  payments,
  emailNotifications,
} from '../db/schema.ts';
import { eq, desc, and, sql } from 'drizzle-orm';
import { seedDatabaseIfEmpty } from './seed.ts';

export const apiRouter = Router();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Ensure DB is seeded on first API call
let isSeeded = false;
apiRouter.use(async (_req, _res, next) => {
  if (!isSeeded) {
    try {
      await seedDatabaseIfEmpty();
      isSeeded = true;
    } catch (e) {
      console.error('Seed error:', e);
    }
  }
  next();
});

// Helper to send transactional emails to the log
async function sendEmailLog(
  recipientEmail: string,
  recipientName: string,
  subject: string,
  templateType: string,
  content: string
) {
  try {
    await db.insert(emailNotifications).values({
      recipientEmail,
      recipientName,
      subject,
      templateType,
      content,
      status: 'sent',
    });
  } catch (err) {
    console.error('Failed to log email:', err);
  }
}

// ----------------------------------------------------
// AUTHENTICATION & REGISTRATION
// ----------------------------------------------------

// User Login (Direct Super Admin credentials or registered user credentials)
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const isSuperAdminEmail = cleanEmail === 'wesongagodfrey60@gmail.com';

    // Look up user in database
    const userRes = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);

    if (userRes.length === 0) {
      // Direct Super Admin fallback initialization if logging in directly for first time
      if (isSuperAdminEmail) {
        if (password !== 'Wesonga.godfrey@5783#') {
          return res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
        }
        const [newAdmin] = await db.insert(users).values({
          uid: 'admin-super-uid-1',
          email: cleanEmail,
          passwordHash: hashPassword(password),
          fullName: 'Godfrey Wesonga (Super Admin)',
          phone: '+254712345678',
          role: 'super_admin',
        }).returning();
        return res.json({ user: newAdmin, token: `session-admin-${newAdmin.id}` });
      }
      return res.status(401).json({ error: 'No account found with this email. Please register first.' });
    }

    const user = userRes[0];
    const inputHash = hashPassword(password);

    // Super Admin password verification (Wesonga.godfrey@5783#)
    const isSuperAdminPass = isSuperAdminEmail && password === 'Wesonga.godfrey@5783#';
    let isValid = false;

    if (isSuperAdminEmail) {
      isValid = isSuperAdminPass || user.passwordHash === inputHash;
    } else {
      isValid = user.passwordHash ? (user.passwordHash === inputHash) : (password.length >= 4);
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
    }

    // Ensure password_hash is persisted or updated for super admin
    if (isSuperAdminEmail && user.passwordHash !== inputHash) {
      await db.update(users).set({ passwordHash: inputHash }).where(eq(users.id, user.id));
      user.passwordHash = inputHash;
    } else if (!user.passwordHash) {
      await db.update(users).set({ passwordHash: inputHash }).where(eq(users.id, user.id));
      user.passwordHash = inputHash;
    }

    // If role is gas_owner, fetch station to check approval status
    let station = null;
    if (user.role === 'gas_owner') {
      const stRes = await db.select().from(gasStations).where(eq(gasStations.ownerId, user.id)).limit(1);
      if (stRes.length > 0) {
        station = stRes[0];
      }
    }

    return res.json({
      user,
      station,
      token: `session-${user.id}-${Date.now()}`,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// User Registration (Role choice: Customer or Gas Service Provider)
apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const {
      role, // 'customer' | 'gas_owner'
      email,
      password,
      fullName,
      phone,
      address,
      // For gas service provider (gas_owner):
      businessName,
      city,
      county,
      deliveryRadiusKm,
      operatingHours,
      licenseNumber,
    } = req.body;

    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    if (password.length < 5) {
      return res.status(400).json({ error: 'Password must be at least 5 characters' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate email
    const existing = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists. Please log in.' });
    }

    const isSuperAdminEmail = cleanEmail === 'wesongagodfrey60@gmail.com';
    const assignedRole = isSuperAdminEmail ? 'super_admin' : role;
    const uid = `${assignedRole}-${Date.now()}`;
    const pHash = hashPassword(password);

    const [newUser] = await db.insert(users).values({
      uid,
      email: cleanEmail,
      passwordHash: pHash,
      fullName,
      phone: phone || '',
      role: assignedRole,
    }).returning();

    let newStation = null;

    if (assignedRole === 'gas_owner') {
      const stCity = city || 'Nairobi';
      const stationCode = `GP-${stCity.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

      const [st] = await db.insert(gasStations).values({
        ownerId: newUser.id,
        businessName: businessName || `${fullName} LPG Services`,
        stationCode,
        email: cleanEmail,
        phone: phone || '',
        address: address || 'Main Road Depot',
        city: stCity,
        county: county || `${stCity} County`,
        deliveryRadiusKm: Number(deliveryRadiusKm) || 15,
        operatingHours: operatingHours || '7:30 AM - 8:30 PM',
        licenseNumber: licenseNumber || `EPRA/LPG/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'pending_approval',
      }).returning();
      newStation = st;

      // Seed starter catalog for the new station
      await db.insert(products).values([
        {
          stationId: st.id,
          name: `${st.businessName} 6kg LPG Cylinder`,
          brand: 'TotalEnergies',
          cylinderSize: '6kg',
          category: 'lpg_gas',
          refillPrice: '1250.00',
          exchangePrice: '1350.00',
          newCylinderPrice: '4800.00',
          description: 'Standard 6kg certified cooking gas cylinder with safety seal.',
          stockQuantity: 25,
          lowStockThreshold: 5,
          imageUrl: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=400',
          isActive: true,
        },
        {
          stationId: st.id,
          name: `${st.businessName} 13kg LPG Cylinder`,
          brand: 'TotalEnergies',
          cylinderSize: '13kg',
          category: 'lpg_gas',
          refillPrice: '2800.00',
          exchangePrice: '2950.00',
          newCylinderPrice: '8900.00',
          description: '13kg certified cylinder for family households and commercial kitchens.',
          stockQuantity: 20,
          lowStockThreshold: 5,
          imageUrl: 'https://images.unsplash.com/photo-1542013936693-884638332954?w=400',
          isActive: true,
        },
      ]);

      // Automated email to Super Admin for verification
      await sendEmailLog(
        'wesongagodfrey60@gmail.com',
        'Super Admin',
        `[Action Required] New Gas Service Provider Registration: ${st.businessName}`,
        'superadmin_approval_request',
        `New gas service provider "${st.businessName}" (${cleanEmail}, ${phone}) has registered and requires Super Admin review. EPRA License: ${st.licenseNumber}. Please log in to approve or reject.`
      );

      // Welcome email to provider
      await sendEmailLog(
        cleanEmail,
        fullName,
        'GasPoint Provider Registration Received - Awaiting Verification',
        'owner_welcome',
        `Hello ${fullName}, your GasPoint provider application for "${st.businessName}" (Code: ${stationCode}) is received. The Super Admin must verify your safety and licensing documentation before your station is published to customers.`
      );
    } else {
      // Welcome email to customer
      await sendEmailLog(
        cleanEmail,
        fullName,
        'Welcome to GasPoint Kenya - Cooking Gas Delivery',
        'customer_welcome',
        `Hello ${fullName}, your customer account is now registered! Log in to browse all verified gas depots and order cooking gas to your doorstep.`
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Account successfully registered! Please log in with your credentials.',
      user: newUser,
      station: newStation,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// ----------------------------------------------------
// USERS & AUTH SYNC
// ----------------------------------------------------
apiRouter.post('/users/sync', async (req: Request, res: Response) => {
  try {
    const { uid, email, fullName, phone, role } = req.body;
    if (!uid || !email) {
      return res.status(400).json({ error: 'UID and email are required' });
    }

    // Default Godfrey to super_admin as configured in system setup
    const isPrimaryAdmin = email.toLowerCase() === 'wesongagodfrey60@gmail.com';
    const assignedRole = isPrimaryAdmin ? 'super_admin' : (role || 'customer');

    const existing = await db.select().from(users).where(eq(users.uid, uid)).limit(1);

    if (existing.length > 0) {
      // If role specified or isPrimaryAdmin, update
      let currentUser = existing[0];
      if (isPrimaryAdmin && currentUser.role !== 'super_admin') {
        const [updated] = await db
          .update(users)
          .set({ role: 'super_admin' })
          .where(eq(users.id, currentUser.id))
          .returning();
        currentUser = updated;
      }
      return res.json(currentUser);
    }

    const [newUser] = await db
      .insert(users)
      .values({
        uid,
        email,
        fullName: fullName || email.split('@')[0],
        phone: phone || '',
        role: assignedRole,
      })
      .returning();

    return res.status(201).json(newUser);
  } catch (err: any) {
    console.error('User sync error:', err);
    return res.status(500).json({ error: err.message || 'Failed to sync user' });
  }
});

apiRouter.get('/users', async (_req: Request, res: Response) => {
  try {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    return res.json(allUsers);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// GAS STATIONS (PROVIDERS)
// ----------------------------------------------------

// List gas stations (with optional role or status filter)
apiRouter.get('/stations', async (req: Request, res: Response) => {
  try {
    const { status, all } = req.query;
    let query = db
      .select({
        id: gasStations.id,
        ownerId: gasStations.ownerId,
        businessName: gasStations.businessName,
        stationCode: gasStations.stationCode,
        email: gasStations.email,
        phone: gasStations.phone,
        address: gasStations.address,
        city: gasStations.city,
        county: gasStations.county,
        deliveryRadiusKm: gasStations.deliveryRadiusKm,
        operatingHours: gasStations.operatingHours,
        licenseNumber: gasStations.licenseNumber,
        status: gasStations.status,
        rating: gasStations.rating,
        ratingCount: gasStations.ratingCount,
        rejectionReason: gasStations.rejectionReason,
        approvedAt: gasStations.approvedAt,
        createdAt: gasStations.createdAt,
        ownerName: users.fullName,
        ownerEmail: users.email,
      })
      .from(gasStations)
      .leftJoin(users, eq(gasStations.ownerId, users.id))
      .orderBy(desc(gasStations.createdAt));

    const stationList = await query;

    // Filter if requested and not 'all'
    if (status && status !== 'all') {
      const filtered = stationList.filter((s) => s.status === status);
      return res.json(filtered);
    }

    // Default for customer view: only show approved unless requested by admin
    if (!all && !status) {
      const approvedOnly = stationList.filter((s) => s.status === 'approved');
      return res.json(approvedOnly);
    }

    return res.json(stationList);
  } catch (err: any) {
    console.error('Fetch stations error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Get single station with product inventory
apiRouter.get('/stations/:id', async (req: Request, res: Response) => {
  try {
    const stationId = parseInt(req.params.id, 10);
    const stationRes = await db
      .select()
      .from(gasStations)
      .where(eq(gasStations.id, stationId))
      .limit(1);

    if (stationRes.length === 0) {
      return res.status(404).json({ error: 'Station not found' });
    }

    const stationProducts = await db
      .select()
      .from(products)
      .where(and(eq(products.stationId, stationId), eq(products.isActive, true)))
      .orderBy(products.category, products.cylinderSize);

    return res.json({
      ...stationRes[0],
      products: stationProducts,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Register a new Gas Point Station (Mini-Admin Owner)
apiRouter.post('/stations/register', async (req: Request, res: Response) => {
  try {
    const {
      businessName,
      ownerName,
      ownerEmail,
      ownerPhone,
      address,
      city,
      county,
      deliveryRadiusKm,
      operatingHours,
      licenseNumber,
      userId,
    } = req.body;

    if (!businessName || !ownerEmail || !ownerPhone || !address || !city) {
      return res.status(400).json({ error: 'Please provide all required business details' });
    }

    let actualOwnerId = userId;

    // If userId not provided, find or create gas_owner user
    if (!actualOwnerId) {
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, ownerEmail))
        .limit(1);

      if (existingUser.length > 0) {
        actualOwnerId = existingUser[0].id;
        await db
          .update(users)
          .set({ role: 'gas_owner', fullName: ownerName, phone: ownerPhone })
          .where(eq(users.id, actualOwnerId));
      } else {
        const [newOwner] = await db
          .insert(users)
          .values({
            uid: `owner-${Date.now()}`,
            email: ownerEmail,
            fullName: ownerName || businessName,
            phone: ownerPhone,
            role: 'gas_owner',
          })
          .returning();
        actualOwnerId = newOwner.id;
      }
    } else {
      // Ensure user has gas_owner role
      await db
        .update(users)
        .set({ role: 'gas_owner' })
        .where(eq(users.id, actualOwnerId));
    }

    const stationCode = `GP-${city.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const [newStation] = await db
      .insert(gasStations)
      .values({
        ownerId: actualOwnerId,
        businessName,
        stationCode,
        email: ownerEmail,
        phone: ownerPhone,
        address,
        city,
        county: county || `${city} County`,
        deliveryRadiusKm: Number(deliveryRadiusKm) || 15,
        operatingHours: operatingHours || '7:30 AM - 8:30 PM',
        licenseNumber: licenseNumber || `EPRA/LPG/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'pending_approval',
      })
      .returning();

    // Add standard starter inventory for the station so they can start immediately after approval
    await db.insert(products).values([
      {
        stationId: newStation.id,
        name: `${businessName} 6kg LPG Cylinder`,
        brand: 'TotalEnergies',
        cylinderSize: '6kg',
        category: 'lpg_gas',
        refillPrice: '1250.00',
        exchangePrice: '1350.00',
        newCylinderPrice: '4800.00',
        description: 'Standard 6kg certified cooking gas cylinder with safety seal.',
        stockQuantity: 25,
        lowStockThreshold: 5,
        imageUrl: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=400&auto=format&fit=crop&q=80',
        isActive: true,
      },
      {
        stationId: newStation.id,
        name: `${businessName} 13kg LPG Cylinder`,
        brand: 'TotalEnergies',
        cylinderSize: '13kg',
        category: 'lpg_gas',
        refillPrice: '2800.00',
        exchangePrice: '2950.00',
        newCylinderPrice: '8900.00',
        description: '13kg certified cylinder for family households and commercial kitchens.',
        stockQuantity: 20,
        lowStockThreshold: 5,
        imageUrl: 'https://images.unsplash.com/photo-1542013936693-884638332954?w=400&auto=format&fit=crop&q=80',
        isActive: true,
      },
      {
        stationId: newStation.id,
        name: 'Anti-Leak Safety Regulator with Dial Gauge',
        brand: 'Generic',
        cylinderSize: 'Accessory',
        category: 'accessory',
        refillPrice: '1450.00',
        exchangePrice: '1450.00',
        newCylinderPrice: '1450.00',
        description: 'EPRA compliant low pressure gas regulator with built-in leak shutoff.',
        stockQuantity: 15,
        lowStockThreshold: 3,
        imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80',
        isActive: true,
      },
    ]);

    // Send automated email to Super Admin for verification
    await sendEmailLog(
      'wesongagodfrey60@gmail.com',
      'Super Admin',
      `[Action Required] New Gas Point Registration: ${businessName}`,
      'superadmin_approval_request',
      `A new gas point "${businessName}" located at "${address}, ${city}" has been registered by ${ownerName} (${ownerEmail}, ${ownerPhone}). License: ${newStation.licenseNumber}. Please log in to your GasPoint Super Admin Dashboard to inspect and approve or reject this application.`
    );

    // Send automated welcome email to Owner
    await sendEmailLog(
      ownerEmail,
      ownerName,
      `GasPoint Registration Received - Pending Super Admin Approval`,
      'owner_welcome',
      `Hello ${ownerName}, thank you for registering "${businessName}" with GasPoint. Your station code is ${stationCode}. Your profile is currently under review by the GasPoint Super Admin. You will receive an automated notification once your license and safety credentials are verified.`
    );

    return res.status(201).json(newStation);
  } catch (err: any) {
    console.error('Register station error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Super Admin verifies, approves, rejects, or suspends Gas Station
apiRouter.patch('/stations/:id/status', async (req: Request, res: Response) => {
  try {
    const stationId = parseInt(req.params.id, 10);
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected', 'suspended', 'pending_approval'].includes(status)) {
      return res.status(400).json({ error: 'Invalid station status' });
    }

    const station = await db
      .select()
      .from(gasStations)
      .where(eq(gasStations.id, stationId))
      .limit(1);

    if (station.length === 0) {
      return res.status(404).json({ error: 'Station not found' });
    }

    const current = station[0];
    const updateData: any = {
      status,
      rejectionReason: rejectionReason || null,
    };

    if (status === 'approved') {
      updateData.approvedAt = new Date();
    }

    const [updatedStation] = await db
      .update(gasStations)
      .set(updateData)
      .where(eq(gasStations.id, stationId))
      .returning();

    // Automated email notifications to Gas Point Owner
    if (status === 'approved') {
      await sendEmailLog(
        current.email,
        current.businessName,
        `🎉 Congratulations! Your GasPoint Station "${current.businessName}" is Approved!`,
        'owner_approved',
        `Great news! Your gas point "${current.businessName}" (Code: ${current.stationCode}) has been verified and approved by the Super Admin. You now have full access to your GasPoint Owner Dashboard to manage inventory, track orders, assign delivery staff, and monitor real-time sales.`
      );
    } else if (status === 'rejected') {
      await sendEmailLog(
        current.email,
        current.businessName,
        `Update on your GasPoint Station Application "${current.businessName}"`,
        'owner_rejected',
        `Your application for "${current.businessName}" could not be approved at this time. Reason provided by Super Admin: "${rejectionReason || 'Incomplete regulatory/EPRA documentation'}". Please contact support at info@gaspoint.co.ke.`
      );
    }

    return res.json(updatedStation);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Super Admin deletes a Gas Point Station (Mini Admin) with complete cascade
apiRouter.delete('/stations/:id', async (req: Request, res: Response) => {
  try {
    const stationId = parseInt(req.params.id, 10);

    const station = await db
      .select()
      .from(gasStations)
      .where(eq(gasStations.id, stationId))
      .limit(1);

    if (station.length === 0) {
      return res.status(404).json({ error: 'Station not found' });
    }

    const currentStation = station[0];

    // 1. Delete all order items and payments for orders from this station
    const stationOrders = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.stationId, stationId));

    for (const ord of stationOrders) {
      await db.delete(orderItems).where(eq(orderItems.orderId, ord.id));
      await db.delete(payments).where(eq(payments.orderId, ord.id));
    }

    // 2. Delete all orders for this station
    await db.delete(orders).where(eq(orders.stationId, stationId));

    // 3. Delete any order items linked to products of this station
    const stationProducts = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.stationId, stationId));

    for (const prod of stationProducts) {
      await db.delete(orderItems).where(eq(orderItems.productId, prod.id));
    }

    // 4. Delete products belonging to this station
    await db.delete(products).where(eq(products.stationId, stationId));

    // 5. Delete the gas station record itself
    await db.delete(gasStations).where(eq(gasStations.id, stationId));

    // 6. Send email notification to owner
    await sendEmailLog(
      currentStation.email,
      currentStation.businessName,
      `GasPoint Notice: Station "${currentStation.businessName}" deleted by Super Admin`,
      'station_deleted',
      `Your gas point "${currentStation.businessName}" has been deleted from the GasPoint system by the Super Admin.`
    );

    return res.json({ success: true, message: 'Station and all related inventory deleted successfully' });
  } catch (err: any) {
    console.error('Delete station error:', err);
    return res.status(500).json({ error: err.message || 'Failed to delete station' });
  }
});

// Super Admin deletes a User (Customer or Mini-Admin)
apiRouter.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);

    const userRes = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (userRes.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetUser = userRes[0];

    // Protect Super Admin account
    if (targetUser.role === 'super_admin' || targetUser.email.toLowerCase() === 'wesongagodfrey60@gmail.com') {
      return res.status(403).json({ error: 'Cannot delete the Super Admin account' });
    }

    // 1. If user owns gas stations, cascade delete stations first
    const userStations = await db.select({ id: gasStations.id }).from(gasStations).where(eq(gasStations.ownerId, userId));
    for (const st of userStations) {
      const stOrders = await db.select({ id: orders.id }).from(orders).where(eq(orders.stationId, st.id));
      for (const ord of stOrders) {
        await db.delete(orderItems).where(eq(orderItems.orderId, ord.id));
        await db.delete(payments).where(eq(payments.orderId, ord.id));
      }
      await db.delete(orders).where(eq(orders.stationId, st.id));
      await db.delete(products).where(eq(products.stationId, st.id));
      await db.delete(gasStations).where(eq(gasStations.id, st.id));
    }

    // 2. Delete user's customer orders
    const userOrders = await db.select({ id: orders.id }).from(orders).where(eq(orders.userId, userId));
    for (const ord of userOrders) {
      await db.delete(orderItems).where(eq(orderItems.orderId, ord.id));
      await db.delete(payments).where(eq(payments.orderId, ord.id));
    }
    await db.delete(orders).where(eq(orders.userId, userId));
    await db.delete(payments).where(eq(payments.userId, userId));

    // 3. Delete user
    await db.delete(users).where(eq(users.id, userId));

    return res.json({ success: true, message: `User ${targetUser.email} deleted successfully` });
  } catch (err: any) {
    console.error('Delete user error:', err);
    return res.status(500).json({ error: err.message || 'Failed to delete user' });
  }
});

// Gas Station Owner Personal Analytics & Daily Sales
apiRouter.get('/stations/:id/analytics', async (req: Request, res: Response) => {
  try {
    const stationId = parseInt(req.params.id, 10);

    const stationOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.stationId, stationId))
      .orderBy(desc(orders.createdAt));

    const totalOrders = stationOrders.length;
    const completedOrders = stationOrders.filter(
      (o) => o.orderStatus === 'delivered' || o.paymentStatus === 'completed'
    );
    const totalRevenue = completedOrders.reduce(
      (sum, o) => sum + Number(o.totalAmount || 0),
      0
    );

    const pendingOrdersCount = stationOrders.filter(
      (o) => o.orderStatus === 'pending' || o.orderStatus === 'confirmed' || o.orderStatus === 'preparing'
    ).length;

    // Daily sales breakdown for the last 7 days
    const dailySalesMap: { [dateStr: string]: { date: string; revenue: number; orderCount: number } } = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      dailySalesMap[dateKey] = { date: displayDate, revenue: 0, orderCount: 0 };
    }

    stationOrders.forEach((o) => {
      if (o.paymentStatus === 'completed' || o.orderStatus === 'delivered') {
        const orderDate = new Date(o.createdAt || Date.now()).toISOString().split('T')[0];
        if (dailySalesMap[orderDate]) {
          dailySalesMap[orderDate].revenue += Number(o.totalAmount || 0);
          dailySalesMap[orderDate].orderCount += 1;
        }
      }
    });

    const dailySalesTrends = Object.values(dailySalesMap);

    // Inventory status
    const stationProducts = await db
      .select()
      .from(products)
      .where(eq(products.stationId, stationId));

    const lowStockItems = stationProducts.filter(
      (p) => p.stockQuantity <= p.lowStockThreshold
    );

    return res.json({
      totalOrders,
      completedOrdersCount: completedOrders.length,
      pendingOrdersCount,
      totalRevenue,
      dailySalesTrends,
      lowStockCount: lowStockItems.length,
      lowStockItems,
      totalProductCount: stationProducts.length,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// PRODUCTS & INVENTORY
// ----------------------------------------------------

apiRouter.get('/products', async (req: Request, res: Response) => {
  try {
    const { stationId, category, cylinderSize } = req.query;
    let productList = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(products.category, products.cylinderSize);

    if (stationId) {
      productList = productList.filter((p) => p.stationId === Number(stationId));
    }
    if (category) {
      productList = productList.filter((p) => p.category === category);
    }
    if (cylinderSize) {
      productList = productList.filter((p) => p.cylinderSize === cylinderSize);
    }

    return res.json(productList);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/products', async (req: Request, res: Response) => {
  try {
    const {
      stationId,
      name,
      brand,
      cylinderSize,
      category,
      refillPrice,
      exchangePrice,
      newCylinderPrice,
      description,
      stockQuantity,
      lowStockThreshold,
      imageUrl,
    } = req.body;

    if (!stationId || !name || !brand || !cylinderSize || !refillPrice) {
      return res.status(400).json({ error: 'Missing required product information' });
    }

    const [newProduct] = await db
      .insert(products)
      .values({
        stationId: Number(stationId),
        name,
        brand,
        cylinderSize,
        category: category || 'lpg_gas',
        refillPrice: String(refillPrice),
        exchangePrice: String(exchangePrice || refillPrice),
        newCylinderPrice: String(newCylinderPrice || Number(refillPrice) * 3),
        description: description || '',
        stockQuantity: Number(stockQuantity) || 0,
        lowStockThreshold: Number(lowStockThreshold) || 5,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=400&auto=format&fit=crop&q=80',
        isActive: true,
      })
      .returning();

    return res.status(201).json(newProduct);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.patch('/products/:id', async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const updates = req.body;

    const [updated] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, productId))
      .returning();

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/products/:id', async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id, 10);
    await db.update(products).set({ isActive: false }).where(eq(products.id, productId));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// ORDERS & CHECKOUT
// ----------------------------------------------------

apiRouter.get('/orders', async (req: Request, res: Response) => {
  try {
    const { userId, stationId } = req.query;

    let query = db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        userId: orders.userId,
        stationId: orders.stationId,
        orderType: orders.orderType,
        deliveryMethod: orders.deliveryMethod,
        deliveryAddress: orders.deliveryAddress,
        customerPhone: orders.customerPhone,
        customerName: orders.customerName,
        subtotal: orders.subtotal,
        deliveryFee: orders.deliveryFee,
        totalAmount: orders.totalAmount,
        orderStatus: orders.orderStatus,
        paymentStatus: orders.paymentStatus,
        deliveryPersonName: orders.deliveryPersonName,
        deliveryPersonPhone: orders.deliveryPersonPhone,
        notes: orders.notes,
        estimatedDeliveryMinutes: orders.estimatedDeliveryMinutes,
        deliveredAt: orders.deliveredAt,
        createdAt: orders.createdAt,
        stationName: gasStations.businessName,
        stationPhone: gasStations.phone,
      })
      .from(orders)
      .leftJoin(gasStations, eq(orders.stationId, gasStations.id))
      .orderBy(desc(orders.createdAt));

    let orderList = await query;

    if (userId) {
      orderList = orderList.filter((o) => o.userId === Number(userId));
    }
    if (stationId) {
      orderList = orderList.filter((o) => o.stationId === Number(stationId));
    }

    return res.json(orderList);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/orders/:id', async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const orderRes = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        userId: orders.userId,
        stationId: orders.stationId,
        orderType: orders.orderType,
        deliveryMethod: orders.deliveryMethod,
        deliveryAddress: orders.deliveryAddress,
        customerPhone: orders.customerPhone,
        customerName: orders.customerName,
        subtotal: orders.subtotal,
        deliveryFee: orders.deliveryFee,
        totalAmount: orders.totalAmount,
        orderStatus: orders.orderStatus,
        paymentStatus: orders.paymentStatus,
        deliveryPersonName: orders.deliveryPersonName,
        deliveryPersonPhone: orders.deliveryPersonPhone,
        notes: orders.notes,
        estimatedDeliveryMinutes: orders.estimatedDeliveryMinutes,
        deliveredAt: orders.deliveredAt,
        createdAt: orders.createdAt,
        stationName: gasStations.businessName,
        stationPhone: gasStations.phone,
      })
      .from(orders)
      .leftJoin(gasStations, eq(orders.stationId, gasStations.id))
      .where(eq(orders.id, orderId))
      .limit(1);

    if (orderRes.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    const orderPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId));

    return res.json({
      ...orderRes[0],
      items,
      payments: orderPayments,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Create Order (Authoritative Server-side total calculation)
apiRouter.post('/orders', async (req: Request, res: Response) => {
  try {
    const {
      userId,
      stationId,
      items, // array of { productId, orderMode, quantity }
      deliveryMethod,
      deliveryAddress,
      customerPhone,
      customerName,
      customerEmail,
      notes,
    } = req.body;

    if (!stationId || !items || !items.length || !customerPhone || !customerName) {
      return res.status(400).json({ error: 'Missing required order details' });
    }

    // Authoritative pricing from database
    let computedSubtotal = 0;
    const computedItems: any[] = [];

    for (const item of items) {
      const prodRes = await db
        .select()
        .from(products)
        .where(eq(products.id, Number(item.productId)))
        .limit(1);

      if (prodRes.length === 0) {
        return res.status(400).json({ error: `Product ID ${item.productId} not found` });
      }

      const prod = prodRes[0];
      const qty = Math.max(1, Number(item.quantity) || 1);

      let unitPrice = Number(prod.refillPrice);
      if (item.orderMode === 'exchange') {
        unitPrice = Number(prod.exchangePrice);
      } else if (item.orderMode === 'new_cylinder') {
        unitPrice = Number(prod.newCylinderPrice);
      }

      const itemSubtotal = unitPrice * qty;
      computedSubtotal += itemSubtotal;

      computedItems.push({
        productId: prod.id,
        productName: `${prod.name} (${prod.cylinderSize})`,
        cylinderSize: prod.cylinderSize,
        orderMode: item.orderMode || 'refill',
        quantity: qty,
        unitPrice: unitPrice.toFixed(2),
        subtotal: itemSubtotal.toFixed(2),
      });

      // Stock reduction check
      if (prod.stockQuantity >= qty) {
        await db
          .update(products)
          .set({ stockQuantity: prod.stockQuantity - qty })
          .where(eq(products.id, prod.id));
      }
    }

    const deliveryFee = deliveryMethod === 'pickup' ? 0 : 150;
    const totalAmount = computedSubtotal + deliveryFee;
    const orderNumber = `GP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const [newOrder] = await db
      .insert(orders)
      .values({
        orderNumber,
        userId: userId ? Number(userId) : null,
        stationId: Number(stationId),
        orderType: items[0]?.orderMode || 'refill',
        deliveryMethod: deliveryMethod || 'delivery',
        deliveryAddress: deliveryAddress || 'Store Pickup',
        customerPhone,
        customerName,
        subtotal: computedSubtotal.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        orderStatus: 'pending',
        paymentStatus: 'pending',
        notes: notes || '',
        estimatedDeliveryMinutes: 35,
      })
      .returning();

    // Insert items
    for (const ci of computedItems) {
      await db.insert(orderItems).values({
        orderId: newOrder.id,
        productId: ci.productId,
        productName: ci.productName,
        cylinderSize: ci.cylinderSize,
        orderMode: ci.orderMode,
        quantity: ci.quantity,
        unitPrice: ci.unitPrice,
        subtotal: ci.subtotal,
      });
    }

    // Get station info for notifications
    const station = await db
      .select()
      .from(gasStations)
      .where(eq(gasStations.id, Number(stationId)))
      .limit(1);

    const stationName = station[0]?.businessName || 'GasPoint Station';

    // Send confirmation email
    if (customerEmail) {
      await sendEmailLog(
        customerEmail,
        customerName,
        `Order Received #${orderNumber} - ${stationName}`,
        'order_placed',
        `Hello ${customerName}, your gas order #${orderNumber} has been received by ${stationName}. Total: Ksh ${totalAmount.toLocaleString()} (${deliveryMethod === 'delivery' ? `Delivery to: ${deliveryAddress}` : 'Self Pickup'}). Complete payment via M-Pesa to dispatch your delivery.`
      );
    }

    return res.status(201).json({
      ...newOrder,
      items: computedItems,
    });
  } catch (err: any) {
    console.error('Order creation error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Update Order Status & Assign Delivery Staff
apiRouter.patch('/orders/:id/status', async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const {
      orderStatus,
      paymentStatus,
      deliveryPersonName,
      deliveryPersonPhone,
      estimatedDeliveryMinutes,
    } = req.body;

    const currentOrderRes = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (currentOrderRes.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const currentOrder = currentOrderRes[0];
    const updates: any = {};

    if (orderStatus) updates.orderStatus = orderStatus;
    if (paymentStatus) updates.paymentStatus = paymentStatus;
    if (deliveryPersonName) updates.deliveryPersonName = deliveryPersonName;
    if (deliveryPersonPhone) updates.deliveryPersonPhone = deliveryPersonPhone;
    if (estimatedDeliveryMinutes) updates.estimatedDeliveryMinutes = Number(estimatedDeliveryMinutes);

    if (orderStatus === 'delivered') {
      updates.deliveredAt = new Date();
    }

    const [updated] = await db
      .update(orders)
      .set(updates)
      .where(eq(orders.id, orderId))
      .returning();

    // Trigger automated email when status changes
    if (orderStatus === 'out_for_delivery') {
      await sendEmailLog(
        'customer@gaspoint.co.ke',
        currentOrder.customerName,
        `Your GasPoint Order #${currentOrder.orderNumber} is Out for Delivery! 🚚`,
        'order_dispatched',
        `Great news! Your gas cylinder order #${currentOrder.orderNumber} is on the truck. Assigned Driver: ${deliveryPersonName || 'Jackson Mutiso'} (${deliveryPersonPhone || '+254714556677'}). Estimated arrival: ~${estimatedDeliveryMinutes || 25} minutes. Please have your empty cylinder ready if exchanging/refilling.`
      );
    } else if (orderStatus === 'delivered') {
      await sendEmailLog(
        'customer@gaspoint.co.ke',
        currentOrder.customerName,
        `Your GasPoint Order #${currentOrder.orderNumber} has been Delivered! ✅`,
        'order_delivered',
        `Thank you for choosing GasPoint! Your order #${currentOrder.orderNumber} has been successfully delivered and installed. Remember to inspect regulator clamps and keep cylinders upright.`
      );
    }

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// PAYMENTS & M-PESA INTEGRATION
// ----------------------------------------------------

// Initiate Safaricom M-Pesa STK Push
apiRouter.post('/payments/mpesa-stk-push', async (req: Request, res: Response) => {
  try {
    const { orderId, phoneNumber, amount } = req.body;

    if (!orderId || !phoneNumber || !amount) {
      return res.status(400).json({ error: 'Order ID, phone number and amount are required' });
    }

    // Format phone number to 254XXXXXXXXX
    let formattedPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith('+254')) {
      formattedPhone = formattedPhone.slice(1);
    } else if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }

    const checkoutRequestId = `ws_CO_${Date.now()}_${Math.floor(10000 + Math.random() * 90000)}`;
    const merchantRequestId = `MR-${orderId}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Create pending payment record
    const [paymentRecord] = await db
      .insert(payments)
      .values({
        orderId: Number(orderId),
        amount: String(amount),
        method: 'mpesa',
        phoneNumber: formattedPhone,
        status: 'pending',
        checkoutRequestId,
        merchantRequestId,
      })
      .returning();

    return res.json({
      success: true,
      checkoutRequestId,
      merchantRequestId,
      phoneNumber: formattedPhone,
      amount,
      message: 'STK push prompt sent to customer phone. Please enter M-Pesa PIN.',
      paymentId: paymentRecord.id,
    });
  } catch (err: any) {
    console.error('M-Pesa STK error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Confirm / Callback M-Pesa Payment
apiRouter.post('/payments/mpesa-callback', async (req: Request, res: Response) => {
  try {
    const { checkoutRequestId, orderId, resultCode, mpesaReceiptNumber } = req.body;

    const receipt = mpesaReceiptNumber || `Q${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(10000000 + Math.random() * 90000000)}K`;

    // Update payment
    const paymentList = await db
      .select()
      .from(payments)
      .where(eq(payments.checkoutRequestId, checkoutRequestId))
      .limit(1);

    if (paymentList.length > 0) {
      await db
        .update(payments)
        .set({
          status: 'successful',
          mpesaReceiptNumber: receipt,
        })
        .where(eq(payments.id, paymentList[0].id));
    }

    // Update order status to confirmed and paymentStatus to completed
    const [updatedOrder] = await db
      .update(orders)
      .set({
        paymentStatus: 'completed',
        orderStatus: 'confirmed',
      })
      .where(eq(orders.id, Number(orderId)))
      .returning();

    // Log confirmation email
    await sendEmailLog(
      'customer@gaspoint.co.ke',
      updatedOrder.customerName,
      `M-Pesa Payment Received - Order #${updatedOrder.orderNumber} (Ref: ${receipt})`,
      'payment_receipt',
      `Payment of Ksh ${Number(updatedOrder.totalAmount).toLocaleString()} for order #${updatedOrder.orderNumber} has been verified via Safaricom M-Pesa. Receipt: ${receipt}. The gas station is now preparing your cylinder for dispatch.`
    );

    return res.json({
      success: true,
      mpesaReceiptNumber: receipt,
      order: updatedOrder,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// PLATFORM ANALYTICS (SUPER ADMIN)
// ----------------------------------------------------

apiRouter.get('/analytics/platform', async (_req: Request, res: Response) => {
  try {
    const allStations = await db.select().from(gasStations);
    const allOrders = await db.select().from(orders);

    const approvedStations = allStations.filter((s) => s.status === 'approved');
    const pendingStations = allStations.filter((s) => s.status === 'pending_approval');
    const rejectedStations = allStations.filter((s) => s.status === 'rejected');

    const completedOrders = allOrders.filter(
      (o) => o.paymentStatus === 'completed' || o.orderStatus === 'delivered'
    );

    const totalPlatformRevenue = completedOrders.reduce(
      (sum, o) => sum + Number(o.totalAmount || 0),
      0
    );

    // Daily sales trends for the last 7 days
    const dailySalesMap: { [dateStr: string]: { date: string; revenue: number; orders: number } } = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      dailySalesMap[dateKey] = { date: displayDate, revenue: 0, orders: 0 };
    }

    allOrders.forEach((o) => {
      if (o.paymentStatus === 'completed' || o.orderStatus === 'delivered') {
        const orderDate = new Date(o.createdAt || Date.now()).toISOString().split('T')[0];
        if (dailySalesMap[orderDate]) {
          dailySalesMap[orderDate].revenue += Number(o.totalAmount || 0);
          dailySalesMap[orderDate].orders += 1;
        }
      }
    });

    return res.json({
      totalPlatformRevenue,
      totalOrdersCount: allOrders.length,
      completedOrdersCount: completedOrders.length,
      totalStationsCount: allStations.length,
      approvedStationsCount: approvedStations.length,
      pendingStationsCount: pendingStations.length,
      rejectedStationsCount: rejectedStations.length,
      dailySalesTrends: Object.values(dailySalesMap),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// EMAIL NOTIFICATIONS LOG & SERVICE
// ----------------------------------------------------

apiRouter.get('/emails', async (req: Request, res: Response) => {
  try {
    const { email } = req.query;
    let query = db.select().from(emailNotifications).orderBy(desc(emailNotifications.sentAt));

    const emailList = await query;
    if (email) {
      const filtered = emailList.filter(
        (e) => e.recipientEmail.toLowerCase() === String(email).toLowerCase()
      );
      return res.json(filtered);
    }
    return res.json(emailList);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/emails/send-test', async (req: Request, res: Response) => {
  try {
    const { recipientEmail, recipientName, subject, content } = req.body;
    const [sent] = await db
      .insert(emailNotifications)
      .values({
        recipientEmail: recipientEmail || 'wesongagodfrey60@gmail.com',
        recipientName: recipientName || 'Super Admin',
        subject: subject || 'Test Notification from GasPoint System',
        templateType: 'custom_alert',
        content: content || 'Automated email system is working properly.',
        status: 'sent',
      })
      .returning();

    return res.json(sent);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
