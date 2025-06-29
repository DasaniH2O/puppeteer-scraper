require('dotenv').config();
const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/scrape', async (req, res) => {
  const { url } = req.body;

  // Default to BrightData geo test if no URL is passed
  const targetUrl =
    url?.trim() || 'https://geo.brdtest.com/welcome.txt?product=dc&method=native';

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        `--proxy-server=http://${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });

    const page = await browser.newPage();

    await page.authenticate({
      username: process.env.PROXY_USERNAME,
      password: process.env.PROXY_PASSWORD,
    });

    await page.goto(targetUrl, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    const html = await page.content();

    res.status(200).json({
      status: 'success',
      proxyConfirmed: html.includes('BRD') || html.includes('Bright Data'),
      html,
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
