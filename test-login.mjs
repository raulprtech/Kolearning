import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('response', response => {
    if ([301, 302, 303, 307, 308].includes(response.status())) {
      console.log(`Redirect [${response.status()}] from ${response.url()} to ${response.headers()['location']}`);
    }
  });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  try {
    console.log('Navigating to http://localhost:3000/login');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
    console.log('Current URL:', page.url());
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
