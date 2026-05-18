export default interface invoiceLineType {
    id: number;
    invoiceId: number;
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    tax: number;
    total: number;
}