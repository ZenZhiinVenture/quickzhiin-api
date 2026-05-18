import invoiceLineType from "./invoiceLineType";
import supplierType from "./supplier";
import customerType from "./customer";

export default interface invoiceType {
    id: number;
    number: string;
    date: Date;
    dueDate?: Date;
    notes?: string;
    paymentTerms?: string;
    billingAddress?: string;
    shippingAddress?: string;
    lines: invoiceLineType[];
    supplier: supplierType;
    customer: customerType;
    currency: string;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    status: string;
}