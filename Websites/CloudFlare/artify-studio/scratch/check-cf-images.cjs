const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://www.creativefabrica.com/product/japanese-huge-collection-plus-bonuses/');
  
  const imgs = await page.$$eval('img', imgs => imgs.map(i => ({ src: i.src, srcset: i.srcset })));
  console.log(imgs.filter(i => i.src.includes('cdn.creativefabrica.com')));
  
  await browser.close();
})();
