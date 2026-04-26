const puppeteer = require('puppeteer');
(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('console', msg => console.log('LOG:', msg.text()));
    page.on('pageerror', err => console.log('ERR:', err.toString()));
    await page.goto('file:///Users/jojeonghye/.gemini/antigravity/scratch/appointment-scheduler/index.html', {waitUntil: 'networkidle0'});
    console.log('DONE');
    await browser.close();
  } catch (e) {
    console.log("PUPPETEER EXCEPTION", e);
  }
})();
