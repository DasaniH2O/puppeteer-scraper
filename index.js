const express = require('express');
const puppeteer = require('puppeteer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/scrape', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: 'URL is required as a query parameter: ?url=' });
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        `--proxy-server=http=${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`
      ]
    });

    const page = await browser.newPage();

    await page.authenticate({
      username: process.env.PROXY_USERNAME,
      password: process.env.PROXY_PASSWORD,
    });

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const html = await page.content();
    await browser.close();

    res.status(200).send(html);
  } catch (error) {
    console.error('Scraping failed:', error.message);
    res.status(500).json({ error: 'Scraping failed', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
