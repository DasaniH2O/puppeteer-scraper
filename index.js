import express from 'express';
import dotenv from 'dotenv';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
app.use(express.json());

// Add stealth plugin
puppeteer.use(StealthPlugin());

app.post('/scrape', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        `--proxy-server=http://${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`,
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    const page = await browser.newPage();
    await page.authenticate({
      username: process.env.PROXY_USERNAME,
      password: process.env.PROXY_PASSWORD
    });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    const html = await page.content();
    await browser.close();

    res.status(200).json({ html });
  } catch (err) {
    if (browser) await browser.close();
    res.status(500).json({ error: 'Scrape failed', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Scraper running on port ${PORT}`);
});
