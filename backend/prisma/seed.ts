import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.rating.deleteMany();
  await prisma.product.deleteMany();

  // Product 1: Product with multiple ratings (average ~4.3)
  const product1 = await prisma.product.create({
    data: {
      title: 'Premium Wireless Headphones',
      ratings: {
        create: [
          { score: 5.0 },
          { score: 4.5 },
          { score: 4.0 },
          { score: 4.5 },
          { score: 5.0 },
          { score: 3.5 },
          { score: 4.0 },
          { score: 5.0 },
          { score: 4.5 },
          { score: 4.0 },
        ],
      },
    },
  });

  // Product 2: Product with zero ratings
  const product2 = await prisma.product.create({
    data: {
      title: 'New Smart Watch',
    },
  });

  // Product 3: Product with single rating
  const product3 = await prisma.product.create({
    data: {
      title: 'USB-C Cable',
      ratings: {
        create: [{ score: 5.0 }],
      },
    },
  });

  // Product 4: Product with many ratings (100+) - simulating high volume
  const manyRatings = Array.from({ length: 127 }, (_, i) => ({
    score: 3.5 + Math.random() * 1.5, // Random scores between 3.5 and 5.0
  }));

  const product4 = await prisma.product.create({
    data: {
      title: 'Bestselling Laptop',
      ratings: {
        create: manyRatings,
      },
    },
  });

  // Product 5: Product with low average rating
  const product5 = await prisma.product.create({
    data: {
      title: 'Budget Earbuds',
      ratings: {
        create: [
          { score: 2.0 },
          { score: 2.5 },
          { score: 3.0 },
          { score: 2.0 },
          { score: 1.5 },
        ],
      },
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log(`
📦 Products created:
  1. ${product1.title} (${product1.id}) - 10 ratings
  2. ${product2.title} (${product2.id}) - 0 ratings
  3. ${product3.title} (${product3.id}) - 1 rating
  4. ${product4.title} (${product4.id}) - 127 ratings
  5. ${product5.title} (${product5.id}) - 5 ratings
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
