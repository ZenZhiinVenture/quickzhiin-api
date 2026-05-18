import { ContactType } from '@prisma/client';

export function getContactType(type: string): ContactType | undefined {
  let contactType: ContactType = ContactType.CUSTOMER;
  if (type) {
    if (type === 'supplier') {
      contactType = ContactType.SUPPLIER;
    }
    if (type === 'employee') {
      contactType = ContactType.EMPLOYEE;
    }
  }
  return contactType;
}
