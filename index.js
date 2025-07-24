const express = require('express');
const puppeteer = require('puppeteer');
const { saveVideo, getVideoByTmdbId } = require('./db');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const BASE_URL = process.env.HLS_BASE_URL;

app.use(express.json());

async function getMovieData(tmdbId) {
  // First check if we already have this video in our database
  try {
    const existingVideo = await getVideoByTmdbId(tmdbId);
    if (existingVideo) {
      console.log(`Found existing video for TMDB ID: ${tmdbId}`);
      return existingVideo;
    }
  } catch (error) {
    console.error('Error checking database:', error);
  }

  let browser;
  let scrapeSuccess = false;
  let importantResponse = null;

  try {
    // Configure Puppeteer for Render
    const options = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--single-process',
        '--disable-extensions'
      ]
    };

    // Add chromium executable path for Render
    if (process.env.RENDER) {
      options.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable';
    }

    browser = await puppeteer.launch(options);
    const page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1280, height: 720 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Listen for XHR/fetch responses
    page.on('response', async (response) => {
      if (importantResponse) return; // Only capture first matching response
      const req = response.request();
      const type = req.resourceType();
      
      if (type === 'xhr' || type === 'fetch') {
        try {
          const text = await response.text();
          let json = null;
          try {
            json = JSON.parse(text);
          } catch (e) {
            return;
          }
          
          // Check for all required keys in response
          if (
            json &&
            typeof json === 'object' &&
            json.hasOwnProperty('noReferrer') &&
            json.hasOwnProperty('url') &&
            json.hasOwnProperty('tmdbId') &&
            json.hasOwnProperty('title') &&
            json.hasOwnProperty('poster') &&
            json.hasOwnProperty('backdrop') &&
            json.hasOwnProperty('tracks') &&
            json.hasOwnProperty('englishTrackIndex') &&
            json.hasOwnProperty('4kAvailable')
          ) {
            importantResponse = json;
            scrapeSuccess = true;
          }
        } catch (e) {
          console.error('Error processing response:', e);
        }
      }
    });

    // Navigate to the movie page and wait for network to be idle
    await page.goto(`${BASE_URL}/movie/${tmdbId}`, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Additional wait to ensure dynamic content loads
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    await browser.close();

    if (!scrapeSuccess || !importantResponse) {
      throw new Error('Failed to scrape movie data');
    }

    // Save the scraped data to database
    try {
      await saveVideo(importantResponse);
      console.log(`Saved video data for TMDB ID: ${tmdbId}`);
    } catch (error) {
      console.error('Error saving to database:', error);
      // Even if save fails, return the scraped data
    }

    return importantResponse;

  } catch (error) {
    if (browser) await browser.close();
    throw error;
  }
}

// Add health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/movie/:tmdbId', async (req, res) => {
  try {
    const { tmdbId } = req.params;
    const movieData = await getMovieData(tmdbId);
    res.json(movieData);
  } catch (error) {
    console.error('Error fetching movie data:', error);
    res.status(500).json({ 
      error: 'Error fetching movie data', 
      details: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 