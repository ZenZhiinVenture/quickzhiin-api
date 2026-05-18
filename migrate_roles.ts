import { prisma } from './src/services/prisma/prismaClient';
import { ContactType } from '@prisma/client';

async function migrate() {
  try {
    console.log('Starting migration...');
    const contacts = await prisma.contact.findMany();
    console.log(`Found ${contacts.length} contacts.`);

    for (const contact of contacts) {
      const isCustomer = contact.contactType === ContactType.CUSTOMER;
      const isSupplier = contact.contactType === ContactType.SUPPLIER;
      
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
    process.exit(0);
  }
}

migrate();
 stone
