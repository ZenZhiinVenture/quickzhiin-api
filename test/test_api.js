const axios = require('axios');

async function testApi() {
  try {
    const response = await axios.post('http://localhost:4000/api/contact', {
      contact: {
        legalname: 'API Role Test 3',
        contactType: 'CUSTOMER',
        regNo: 'BRN-API-3',
        regNoType: 'BRN',
        taxNo: 'TIN-API-3',
        isCustomer: true,
        isSupplier: true,
        isActive: true
      },
      contactAddress: [],
      contactPerson: []
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('Success:', response.data);
  } catch (error) {
    if (error.response) {
      console.error('Error Status:', error.response.status);
      console.error('Error Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error Message:', error.message);
    }
  }
}

testApi();
