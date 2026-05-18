import invoiceType from 'src/types/invoice';
import lhdnInvoiceType from 'src/types/lhdn/invoice';

export default function mapToLhdnInvoiceJson(invoice: invoiceType): lhdnInvoiceType {
    return {
      InvoiceTypeCode: { _: "01" }, // 01 = Invoice
      DocumentCurrencyCode: { _: invoice.currency },
      ID: { _: invoice.number },
      IssueDate: { _: invoice.date.toISOString() },
      SupplierParty: {
        Party: {
          PartyIdentification: { ID: { _: invoice.supplier.tin } },
          PartyName: { Name: { _: invoice.supplier.name } },
          PostalAddress: {
            StreetName: { _: invoice.supplier.address },
            CityName: { _: invoice.supplier.city },
            PostalZone: { _: invoice.supplier.postalCode },
            Country: { IdentificationCode: { _: invoice.supplier.countryCode } }
          }
        }
      },
      CustomerParty: {
        Party: {
          PartyIdentification: { ID: { _: invoice.customer.tin } },
          PartyName: { Name: { _: invoice.customer.name } },
          PostalAddress: {
            StreetName: { _: invoice.customer.address },
            CityName: { _: invoice.customer.city },
            PostalZone: { _: invoice.customer.postalCode },
            Country: { IdentificationCode: { _: invoice.customer.countryCode } }
          }
        }
      },
      LegalMonetaryTotal: {
        LineExtensionAmount: { _: invoice.subtotal.toFixed(2) },
        TaxExclusiveAmount: { _: invoice.subtotal.toFixed(2) },
        TaxInclusiveAmount: { _: invoice.total.toFixed(2) },
        PayableAmount: { _: invoice.total.toFixed(2) }
      },
      InvoiceLine: invoice.lines.map((line, idx) => ({
        ID: { _: (idx + 1).toString() },
        InvoicedQuantity: { _: line.quantity.toString() },
        LineExtensionAmount: { _: line.total.toFixed(2) },
        Item: { Name: { _: line.productName } },
        Price: { PriceAmount: { _: line.unitPrice.toFixed(2) } }
      }))
    };
  }