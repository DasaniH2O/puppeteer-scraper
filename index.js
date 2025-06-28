// index.js — Firecrawl-style Puppeteer Scraper with Bright Data support
require('dotenv').config();
const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/scrape', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        `--proxy-server=http://${process.env.BRIGHTDATA_PROXY_HOST}:${process.env.BRIGHTDATA_PROXY_PORT}`,
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    const page = await browser.newPage();
    await page.authenticate({
      username: process.env.BRIGHTDATA_PROXY_USER,
      password: process.env.BRIGHTDATA_PROXY_PASS
    });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    const html = await page.content();
    await browser.close();

    res.status(200).json({ html });
  } catch (err) {
    if (browser) await browser.close();
    res.status(500).json({ error: 'Failed to scrape', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Scraper running on http://localhost:${PORT}`);
});
