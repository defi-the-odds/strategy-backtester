// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = 3001;
const API_KEY = process.env.API_KEY;

// Base URL for the external API service
const EXTERNAL_API_BASE_URL = "https://api.defitheodds.xyz/v1"; 

// Ensure API key is set
if (!API_KEY || API_KEY === 'dfo_YOUR_API_KEY_HERE') {
    console.error("FATAL ERROR: Please set the API_KEY in your .env file before running.");
    process.exit(1);
}

// Serve static files (index.html, CSS, etc.) from the public directory
app.use(express.static(path.join(__dirname, 'public')));


// API Endpoint to fetch data from the external service
// Now handles dynamic ticker, timeframe, and candle count via query parameters
app.get('/api/data', async (req, res) => {
    // Extract parameters from the request query string
    const { ticker, timeframe, candles } = req.query;

    // Basic parameter validation
    if (!ticker || !timeframe || !candles) {
        return res.status(400).json({ 
            error: 'INVALID_PARAMS', 
            message: 'Missing required parameters: ticker, timeframe, or candles.' 
        });
    }

    // Construct the final external API URL
    const finalUrl = `${EXTERNAL_API_BASE_URL}/${timeframe}/${ticker}/${candles}`;
    
    try {
        console.log(`Fetching data from external API: ${finalUrl}`);
        
        // Make the request to the external API service
        const response = await fetch(finalUrl, {
            method: 'GET',
            headers: {
                'X-API-KEY': API_KEY,
                'Content-Type': 'application/json'
            }
        });

        // Check for non-200 status codes (rate limits, auth errors, etc.)
        if (!response.ok) {
            const errorBody = await response.json();
            console.error(`External API Error ${response.status} on ${finalUrl}:`, errorBody);
            return res.status(response.status).json({ 
                error: errorBody.error || 'API_ERROR',
                message: errorBody.message || `External API failed with status ${response.status}`,
            });
        }

        const data = await response.json();
        res.json(data.data); // Return only the data array to the frontend

    } catch (error) {
        console.error('Server side error during fetch:', error.message);
        res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch data from external API.' });
    }
});


app.listen(PORT, () => {
    console.log(`Showcase App running at http://localhost:${PORT}`);
    console.log('--- Press Ctrl+C to stop ---');
});