import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10)
  const adminPassword = await bcrypt.hash('Code@2020', 10)

  // Create Super Admin codebridge2026@gmail.com
  const admin = await prisma.user.upsert({
    where: { email: 'codebridge2026@gmail.com' },
    update: {
      password: adminPassword,
      role: 'ADMIN',
    },
    create: {
      id: '6a27c836a4e531633dd2dfe3',
      email: 'codebridge2026@gmail.com',
      name: 'CodeBridge Admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  // Create Store Owner / Seller
  const owner = await prisma.user.upsert({
    where: { email: 'owner@store.com' },
    update: {
      role: 'SELLER',
    },
    create: {
      email: 'owner@store.com',
      name: 'Demo Owner',
      password: hashedPassword,
      role: 'SELLER',
    },
  })

  // Seed B2B Wholesale Price Tier
  const goldTier = await (prisma as any).priceTier.upsert({
    where: { id: '6a0000000000000000000001' },
    update: {},
    create: {
      id: '6a0000000000000000000001',
      name: 'Gold Wholesale Tier',
      discountPercentage: 20,
      minOrderAmount: 500,
    },
  })

  // Create B2B Buyer (USER)
  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@company.com' },
    update: {
      role: 'USER',
    },
    create: {
      email: 'buyer@company.com',
      name: 'B2B Demo Buyer',
      password: hashedPassword,
      role: 'USER',
    },
  })

  // Create B2B Profile for buyer
  await (prisma as any).b2BBuyerProfile.upsert({
    where: { userId: buyer.id },
    update: {},
    create: {
      userId: buyer.id,
      companyName: 'Global Wholesale Supplies Ltd.',
      taxId: 'US-TIN-88992211',
      status: 'APPROVED',
      creditLimit: 10000,
      currentBalance: 0,
      priceTierId: goldTier.id,
    },
  })

  // Create Store
  const store = await prisma.store.upsert({
    where: { slug: 'demo-store' },
    update: {},
    create: {
      name: 'Demo Store',
      slug: 'demo-store',
      currency: 'USD',
      language: 'en',
      ownerId: owner.id,
    },
  })

  // Create Category
  const category = await prisma.category.create({
    data: {
      name: 'Electronics',
      storeId: store.id,
    },
  })

  // Create Product
  const product = await prisma.product.create({
    data: {
      name: 'Wireless Earbuds',
      description: 'High quality wireless earbuds with noise cancellation.',
      sku: 'WE-001',
      costPrice: 20,
      sellPrice: 50,
      stockQty: 500,
      moq: 10,
      casePackQty: 24,
      storeId: store.id,
      categoryId: category.id,
    },
  })

  // Seed default subscription Plans
  const planData = [
    {
      name: 'Starter',
      description: 'Perfect for small shops just getting started.',
      priceMonthly: 9.99,
      priceYearly: 99.99,
      features: ['Up to 50 products', 'Up to 500 orders/mo', '3 staff accounts', 'Basic analytics', 'Email support'],
      maxProducts: 50,
      maxOrders: 500,
      maxStaff: 3,
      isActive: true,
      isPopular: false,
      sortOrder: 0,
    },
    {
      name: 'Pro',
      description: 'For growing businesses that need more power.',
      priceMonthly: 29.99,
      priceYearly: 299.99,
      features: ['Up to 500 products', 'Up to 5,000 orders/mo', '10 staff accounts', 'Advanced analytics', 'Priority support', 'Custom domain'],
      maxProducts: 500,
      maxOrders: 5000,
      maxStaff: 10,
      isActive: true,
      isPopular: true,
      sortOrder: 1,
    },
    {
      name: 'Enterprise',
      description: 'Unlimited power for large scale operations.',
      priceMonthly: 99.99,
      priceYearly: 999.99,
      features: ['Unlimited products', 'Unlimited orders', 'Unlimited staff', 'Custom integrations', 'Dedicated support', 'SLA guarantee'],
      maxProducts: -1,
      maxOrders: -1,
      maxStaff: -1,
      isActive: true,
      isPopular: false,
      sortOrder: 2,
    },
  ]

  const existingPlans = await (prisma as any).plan.findMany({ select: { name: true } })
  const existingNames = new Set(existingPlans.map((p: any) => p.name))
  const toCreate = planData.filter(p => !existingNames.has(p.name))
  if (toCreate.length > 0) {
    await (prisma as any).plan.createMany({ data: toCreate })
    console.log(`Seeded ${toCreate.length} new plans: ${toCreate.map(p => p.name).join(', ')}`)
  } else {
    console.log('Plans already seeded, skipping.')
  }

  console.log({ admin, owner, store, product })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
