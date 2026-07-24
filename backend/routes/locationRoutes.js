import express from 'express';
import axios from 'axios';
import asyncHandler from 'express-async-handler';

const router = express.Router();

const GOOGLE_GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

const pick = (components, type) =>
  components.find((c) => c.types.includes(type))?.long_name || '';

// Exported for tests: maps a Google Geocoding result to our shipping address shape.
export const parseGeocodeResult = (result = {}) => {
  const components = result.address_components || [];
  return {
    address: result.formatted_address || '',
    city: pick(components, 'locality') || pick(components, 'administrative_area_level_2'),
    state: pick(components, 'administrative_area_level_1'),
    pincode: pick(components, 'postal_code'),
    country: pick(components, 'country')
  };
};

// @desc    Reverse geocode coordinates into a shipping address (Google Geocoding API)
// @route   GET /api/location/reverse?lat=..&lng=..
// @access  Public
router.get('/reverse', asyncHandler(async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const key = process.env.GOOGLE_MAPS_API_KEY;

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return res.status(400).json({ message: 'Valid lat and lng are required' });
  }
  if (!key) {
    return res.status(503).json({ message: 'Location lookup is not configured' });
  }

  const { data } = await axios.get(GOOGLE_GEOCODE_URL, {
    params: { latlng: `${lat},${lng}`, key, region: 'in' }
  });

  if (data.status !== 'OK' || !data.results?.length) {
    return res.status(502).json({ message: `Could not resolve this location (${data.status})` });
  }

  res.json(parseGeocodeResult(data.results[0]));
}));

export default router;
