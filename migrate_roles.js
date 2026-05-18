const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  try {
    console.log('Starting migration...');
    const contacts = await prisma.contact.findMany();
    console.log(`Found ${contacts.length} contacts.`);

    for (const contact of contacts) {
      const isCustomer = contact.contactType === 'CUSTOMER';
      const isSupplier = contact.contactType === 'SUPPLIER';
      
      await prisma.contact.update({
        where: { id: contact.id },
        data: {
          isCustomer,
          isSupplier
        }
      });
      console.log(`Updated contact ${contact.id}: isCustomer=${isCustomer}, isSupplier=${isSupplier}`);
    }
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
 stone
