require('dotenv').config();
const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/scrape', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required in JSON body' });

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new', // modern headless mode
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
        process.env.BRIGHTDATA_PROXY_HOST ? `--proxy-server=http://${process.env.BRIGHTDATA_PROXY_HOST}:${process.env.BRIGHTDATA_PROXY_PORT}` : ''
      ].filter(Boolean)
    });

    const page = await browser.newPage();

    if (process.env.BRIGHTDATA_PROXY_USER && process.env.BRIGHTDATA_PROXY_PASS) {
      await page.authenticate({
        username: process.env.BRIGHTDATA_PROXY_USER,
        password: process.env.BRIGHTDATA_PROXY_PASS
      });
    }

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });
    const html = await page.content();
    await browser.close();

    return res.status(200).json({ html });
  } catch (err) {
    if (browser) await browser.close();
    console.error('Scraping failed:', err.message);
    return res.status(500).json({ error: 'Failed to scrape page', details: err.message });
  }
});

app.get('/', (req, res) => {
  res.send("✅ Puppeteer scraper is live. Use POST /scrape with { url: 'https://example.com' }");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
