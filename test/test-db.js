
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.salesQuote.count();
  console.log('Result: Total quotes = ' + count);
  const latest = await prisma.salesQuote.findFirst({
    orderBy: { id: 'desc' },
    select: { number: true, createdAt: true }
  });
  console.log('Result: Latest quote = ' + JSON.stringify(latest));
}

main().catch(console.error).finally(() => prisma.$disconnect());
