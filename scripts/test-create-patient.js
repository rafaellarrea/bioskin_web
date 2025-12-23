import dotenv from 'dotenv';
dotenv.config();

import handler from '../api/records.js';

// Mock Request/Response
const req = {
  method: 'POST',
  query: { action: 'createPatient' },
  body: {
    first_name: 'Test',
    last_name: 'Patient',
    rut: '12345678-9',
    email: 'test@patient.com',
    phone: '123456789',
    birth_date: '',
    gender: 'female',
    address: 'Test Address',
    occupation: 'Tester'
  }
};

const res = {
  setHeader: () => {},
  status: (code) => {
    console.log(`Status: ${code}`);
    return res;
  },
  json: (data) => {
    console.log('Response:', JSON.stringify(data, null, 2));
    return res;
  },
  end: () => {}
};

console.log('Testing createPatient...');
handler(req, res).then(() => {
  console.log('Test finished');
}).catch(err => {
  console.error('Test crashed:', err);
});
