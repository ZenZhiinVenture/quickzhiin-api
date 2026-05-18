export default interface lhdnInvoiceType {
    InvoiceTypeCode: { _: string };
    DocumentCurrencyCode: { _: string };
    ID: { _: string };
    IssueDate: { _: string };
    SupplierParty: {
        Party: {
            PartyIdentification: { ID: { _: string } };
            PartyName: { Name: { _: string } };
            PostalAddress: {
                StreetName: { _: string };
                CityName: { _: string };
                PostalZone: { _: string };
                Country: { IdentificationCode: { _: string } };
            }
        }
    };
    CustomerParty: {
        Party: {
            PartyIdentification: { ID: { _: string } };
            PartyName: { Name: { _: string } };
            PostalAddress: {
                StreetName: { _: string };
                CityName: { _: string };
                PostalZone: { _: string };
                Country: { IdentificationCode: { _: string } };
            }
        }
    };
    LegalMonetaryTotal: {
        LineExtensionAmount: { _: string };
        TaxExclusiveAmount: { _: string };
        TaxInclusiveAmount: { _: string };
        PayableAmount: { _: string };
    };
    InvoiceLine: {
        ID: { _: string };
        InvoicedQuantity: { _: string };
        LineExtensionAmount: { _: string };
        Item: { Name: { _: string } };
        Price: { PriceAmount: { _: string } };
    }[];
}