const express = require('express');
const path = require('path');
const https = require('https');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;
const CROP_API_URL = process.env.CROP_API_URL || 'http://localhost:5000';

// Gemini AI API key - store this in environment variables on Render
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const AGMARKNET_API_KEY = process.env.AGMARKNET_API_KEY || '';
const VISUAL_CROSSING_API_KEY = process.env.VITE_VISUAL_CROSSING_API_KEY || '';

// Enable CORS for all routes
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the React weather dashboard from the same host at /weather
app.use('/weather', express.static(path.join(__dirname, 'weather-dashboard', 'dist')));

// Serve locations.json data
app.get('/data/locations.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'data', 'locations.json'));
});

// Gemini AI chatbot endpoint
app.post('/api/gemini-chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Prepare the API request to Gemini
    const geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
    }
    
    const requestBody = {
      contents: [{
        parts: [{
          text: message
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024
      }
    };
    
    const response = await fetch(`${geminiApiUrl}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      return res.status(response.status).json({ error: 'Failed to get response from Gemini API' });
    }
    
    const data = await response.json();
    let botResponse = 'Sorry, I couldn\'t generate a response.';
    
    if (data.candidates && data.candidates.length > 0 && 
        data.candidates[0].content && 
        data.candidates[0].content.parts && 
        data.candidates[0].content.parts.length > 0) {
      botResponse = data.candidates[0].content.parts[0].text;
    }
    
    res.json({ response: botResponse });
  } catch (error) {
    console.error('Error in Gemini chat endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// AgMarknet API proxy endpoint
app.get('/api/agmarknet', (req, res) => {
  const { commodity, state, district, market, fromDate, toDate } = req.query;
  
  // Note: This is an example URL. You'll need to replace it with the actual API endpoint
  const baseUrl = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
  
  if (!AGMARKNET_API_KEY) {
    return res.status(500).json({ error: 'AGMARKNET_API_KEY is not configured.' });
  }
  const apiKey = AGMARKNET_API_KEY;
  
  // Build query parameters
  const params = new URLSearchParams({
    'api-key': apiKey,
    format: 'json',
    limit: '100'
  });
  
  // Add optional parameters if provided
  if (commodity) params.append('filters[commodity]', commodity);
  if (state) params.append('filters[state]', state);
  if (district) params.append('filters[district]', district);
  if (market) params.append('filters[market]', market);
  if (fromDate) params.append('filters[from_date]', fromDate);
  if (toDate) params.append('filters[to_date]', toDate);
  
  const apiUrl = `${baseUrl}?${params.toString()}`;
  
  // Make request to AgMarknet API
  https.get(apiUrl, (apiRes) => {
    let data = '';
    
    apiRes.on('data', (chunk) => {
      data += chunk;
    });
    
    apiRes.on('end', () => {
      try {
        const parsedData = JSON.parse(data);
        res.json(parsedData);
      } catch (e) {
        console.error('Error parsing API response:', e);
        res.status(500).json({ error: 'Failed to parse API response' });
      }
    });
  }).on('error', (err) => {
    console.error('Error fetching data from AgMarknet API:', err);
    res.status(500).json({ error: 'Failed to fetch data from AgMarknet API' });
  });
});

// API endpoint to get market trend analysis
app.get('/api/market-trends', (req, res) => {
  const { commodity, state, district, market, days } = req.query;
  
  // Calculate date range (default to last 30 days)
  const daysToLookBack = parseInt(days) || 30;
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - daysToLookBack);
  
  // Format dates as DD-MM-YYYY
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };
  
  const fromDate = formatDate(startDate);
  const toDate = formatDate(endDate);
  
  // Build API request query parameters
  const params = new URLSearchParams({
    commodity,
    state: state || '',
    district: district || '',
    market: market || '',
    fromDate,
    toDate
  });
  
  // Forward request to our AgMarknet proxy endpoint
  const apiUrl = `${req.protocol}://${req.get('host')}/api/agmarknet?${params.toString()}`;
  
  https.get(apiUrl, (apiRes) => {
    let data = '';
    
    apiRes.on('data', (chunk) => {
      data += chunk;
    });
    
    apiRes.on('end', () => {
      try {
        const parsedData = JSON.parse(data);
        
        // Process data for trend analysis
        const records = parsedData.records || [];
        
        // Group by date and calculate average prices
        const pricesByDate = {};
        
        records.forEach(record => {
          const date = record.arrival_date;
          if (!pricesByDate[date]) {
            pricesByDate[date] = {
              totalModalPrice: 0,
              totalMinPrice: 0,
              totalMaxPrice: 0,
              count: 0
            };
          }
          
          pricesByDate[date].totalModalPrice += parseFloat(record.modal_price) || 0;
          pricesByDate[date].totalMinPrice += parseFloat(record.min_price) || 0;
          pricesByDate[date].totalMaxPrice += parseFloat(record.max_price) || 0;
          pricesByDate[date].count += 1;
        });
        
        // Calculate averages and prepare the result
        const trendData = Object.keys(pricesByDate).map(date => {
          const data = pricesByDate[date];
          return {
            date,
            modalPrice: (data.totalModalPrice / data.count).toFixed(2),
            minPrice: (data.totalMinPrice / data.count).toFixed(2),
            maxPrice: (data.totalMaxPrice / data.count).toFixed(2),
            count: data.count
          };
        });
        
        // Sort by date
        trendData.sort((a, b) => {
          const dateA = new Date(a.date.split('-').reverse().join('-'));
          const dateB = new Date(b.date.split('-').reverse().join('-'));
          return dateA - dateB;
        });
        
        // Calculate price trends (percentage change)
        let priceChange = null;
        if (trendData.length > 1) {
          const oldestPrice = parseFloat(trendData[0].modalPrice);
          const newestPrice = parseFloat(trendData[trendData.length - 1].modalPrice);
          priceChange = oldestPrice > 0 ? ((newestPrice - oldestPrice) / oldestPrice * 100).toFixed(2) : null;
        }
        
        res.json({
          commodity,
          state,
          district,
          market,
          priceChange,
          trendData,
          rawData: records.slice(0, 10) // Include a sample of the raw data
        });
      } catch (e) {
        console.error('Error processing market trend data:', e);
        res.status(500).json({ error: 'Failed to process market trend data' });
      }
    });
  }).on('error', (err) => {
    console.error('Error fetching trend data:', err);
    res.status(500).json({ error: 'Failed to fetch trend data' });
  });
});

// Weather data endpoint for crop prediction (proxies Visual Crossing API)
app.get('/get-weather', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }
    
    const apiKey = VISUAL_CROSSING_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'VITE_VISUAL_CROSSING_API_KEY is not configured.' });
    }
    const weatherUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${lon}?key=${apiKey}&include=current,hours&elements=temperature,humidity&unitGroup=metric`;
    
    const response = await fetch(weatherUrl);
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch weather data' });
    }
    
    const data = await response.json();
    
    // Extract temperature and humidity from current conditions
    const currentConditions = data.currentConditions || {};
    const firstHourData = (data.days && data.days[0] && data.days[0].hours && data.days[0].hours[0]) || {};
    
    res.json({
      temperature: currentConditions.temp || firstHourData.temp || null,
      humidity: currentConditions.humidity || firstHourData.humidity || null,
      address: data.address,
      timezone: data.timezone,
      raw: data
    });
  } catch (error) {
    console.error('Weather fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// Crop recommendation API proxy for Render deployment
app.all('/crop-api/*', async (req, res) => {
  try {
    const proxyPath = req.path.replace(/^\/crop-api/, '') || '/';
    const queryString = new URLSearchParams(req.query).toString();
    const url = `${CROP_API_URL}${proxyPath}${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : JSON.stringify(req.body)
    });

    const contentType = response.headers.get('content-type') || 'application/json';
    res.status(response.status).set('content-type', contentType);

    if (contentType.includes('application/json')) {
      const payload = await response.json();
      return res.status(response.status).json(payload);
    }

    const text = await response.text();
    return res.status(response.status).send(text);
  } catch (error) {
    console.error('Crop API proxy error:', error);
    res.status(500).json({ error: 'Failed to proxy crop recommendation request' });
  }
});

// Weather dashboard SPA fallback route
app.get('/weather*', (req, res) => {
  res.sendFile(path.join(__dirname, 'weather-dashboard', 'dist', 'index.html'));
});

// All other routes serve index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
