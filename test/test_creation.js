const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCreate() {
  try {
    const contact = await prisma.contact.create({
      data: {
        legalname: 'Test Project Creation',
        contactType: 'CUSTOMER',
        regNo: '123456',
        regNoType: 'BRN',
        taxNo: 'TIN-123456',
        isCustomer: true,
        isSupplier: true,
        defaultCountryId: 1,
        isActive: true,
        createdBy: 1,
        updatedBy: 1
      }
    });
    console.log('Success:', contact);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCreate();
