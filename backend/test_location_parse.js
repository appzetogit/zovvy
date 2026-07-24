import assert from 'assert';
import { parseGeocodeResult } from './routes/locationRoutes.js';

// Normal result: locality wins as the city.
const full = parseGeocodeResult({
  formatted_address: '12 MG Road, Pune, Maharashtra 411001, India',
  address_components: [
    { long_name: 'Pune', types: ['locality', 'political'] },
    { long_name: 'Pune Division', types: ['administrative_area_level_2'] },
    { long_name: 'Maharashtra', types: ['administrative_area_level_1'] },
    { long_name: '411001', types: ['postal_code'] },
    { long_name: 'India', types: ['country'] }
  ]
});
assert.deepStrictEqual(full, {
  address: '12 MG Road, Pune, Maharashtra 411001, India',
  city: 'Pune',
  state: 'Maharashtra',
  pincode: '411001',
  country: 'India'
});

// No locality: fall back to the district.
assert.strictEqual(
  parseGeocodeResult({
    address_components: [{ long_name: 'Pune Division', types: ['administrative_area_level_2'] }]
  }).city,
  'Pune Division'
);

// Missing pieces come back as empty strings, never undefined.
assert.deepStrictEqual(parseGeocodeResult({}), {
  address: '', city: '', state: '', pincode: '', country: ''
});

console.log('location parse tests passed');
