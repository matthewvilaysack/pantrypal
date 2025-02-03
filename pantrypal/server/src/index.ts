import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;

// Mock food bank data generator
function generateFoodBanks(lat: number, lng: number) {
  const foodBankNames = [
    "Second Harvest Food Bank",
    "Community Food Share",
    "Local Food Assistance Center",
    "Hope Food Pantry",
    "Neighborhood Food Bank"
  ];

  // Generate 5 food banks within a 5-mile radius
  const foodBanks = [];
  const radiusInDegrees = 5 / 69; // Approximate conversion of 5 miles to degrees

  for (let i = 0; i < 5; i++) {
    // Generate random offsets within the radius
    const latOffset = (Math.random() - 0.5) * radiusInDegrees * 2;
    const lngOffset = (Math.random() - 0.5) * radiusInDegrees * 2;

    // Calculate distance in miles
    const distance = Math.sqrt(Math.pow(latOffset * 69, 2) + Math.pow(lngOffset * 69 * Math.cos(lat * Math.PI / 180), 2));

    foodBanks.push({
      place_id: `fb_${i + 1}`,
      name: foodBankNames[i],
      vicinity: `${Math.round(distance * 10) / 10} miles from location`,
      geometry: {
        location: {
          lat: lat + latOffset,
          lng: lng + lngOffset
        }
      },
      available_times: [
        "7:30pm",
        "7:45pm",
        "8:00pm",
        "8:15pm"
      ]
    });
  }

  // Sort by distance
  foodBanks.sort((a, b) => {
    const distA = Math.sqrt(
      Math.pow((a.geometry.location.lat - lat) * 69, 2) +
      Math.pow((a.geometry.location.lng - lng) * 69 * Math.cos(lat * Math.PI / 180), 2)
    );
    const distB = Math.sqrt(
      Math.pow((b.geometry.location.lat - lat) * 69, 2) +
      Math.pow((b.geometry.location.lng - lng) * 69 * Math.cos(lat * Math.PI / 180), 2)
    );
    return distA - distB;
  });

  return foodBanks;
}

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Geocoding endpoint
app.get('/api/geocode', async (req: Request, res: Response) => {
  const { address } = req.query;
  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Address is required' });
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_PLACES_API_KEY}`
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ error: 'Failed to geocode address' });
  }
});

// Food banks search endpoint
app.get('/api/foodbanks', async (req: Request, res: Response) => {
  const { lat, lng } = req.query;
  
  console.log('Received request for food banks at:', { lat, lng });
  
  if (!lat || !lng || typeof lat !== 'string' || typeof lng !== 'string') {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }

  try {
    // Generate mock food banks instead of calling Google Places API
    const foodBanks = generateFoodBanks(latitude, longitude);
    console.log('Generated food banks:', foodBanks);
    
    res.json({
      status: 'OK',
      results: foodBanks
    });
  } catch (error) {
    console.error('Food banks search error:', error);
    res.status(500).json({ error: 'Failed to search food banks' });
  }
});

// Static map endpoint
app.get('/api/staticmap', async (req: Request, res: Response) => {
  const { lat, lng } = req.query;
  
  if (!lat || !lng || typeof lat !== 'string' || typeof lng !== 'string') {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+ff0000(${lng},${lat})/${lng},${lat},13/500x300?access_token=${MAPBOX_TOKEN}`
    );
    
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status}`);
    }
    
    const buffer = await response.arrayBuffer();
    res.set('Content-Type', 'image/png');
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Static map error:', error);
    res.status(500).json({ error: 'Failed to generate map' });
  }
});

// Directions endpoint
app.get('/api/directions', async (req: Request, res: Response) => {
  const { startLat, startLng, endLat, endLng } = req.query;
  
  if (!startLat || !startLng || !endLat || !endLng) {
    return res.status(400).json({ error: 'Start and end coordinates are required' });
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${startLat},${startLng}&destination=${endLat},${endLng}&key=${GOOGLE_PLACES_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 'OK' || !data.routes[0]) {
      return res.status(400).json({ error: 'No route found' });
    }

    const route = data.routes[0].legs[0];
    const now = new Date();
    const arrival = new Date(now.getTime() + route.duration.value * 1000);

    // Format the response
    const directions = {
      route: {
        distance: route.distance.value,
        duration: route.duration.value,
        eta: arrival.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }),
        steps: route.steps.map((step: any) => ({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
          distance: step.distance.value,
          duration: step.duration.value
        }))
      }
    };

    res.json(directions);
  } catch (error) {
    console.error('Directions error:', error);
    res.status(500).json({ error: 'Failed to fetch directions' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 