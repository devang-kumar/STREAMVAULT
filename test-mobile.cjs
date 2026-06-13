const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
  
  // Click the mobile menu button
  await page.click('button[aria-label="Open menu"]');
  await page.waitForTimeout(500);
  
  // Check the computed styles of the Sign In button in the aside
  const signInStyles = await page.evaluate(() => {
    const links = document.querySelectorAll('aside a');
    const signIn = Array.from(links).find(l => l.textContent.trim() === 'Sign In');
    if (!signIn) return 'not found';
    const styles = window.getComputedStyle(signIn);
    return {
      display: styles.display,
      visibility: styles.visibility,
      opacity: styles.opacity,
      position: styles.position,
      width: styles.width,
      height: styles.height,
      overflow: styles.overflow,
      transform: styles.transform,
      border: styles.border,
      color: styles.color,
      backgroundColor: styles.backgroundColor
    };
  });
  
  const getStartedStyles = await page.evaluate(() => {
    const links = document.querySelectorAll('aside a');
    const gs = Array.from(links).find(l => l.textContent.trim() === 'Get Started');
    if (!gs) return 'not found';
    const styles = window.getComputedStyle(gs);
    return {
      display: styles.display,
      visibility: styles.visibility,
      opacity: styles.opacity,
      position: styles.position,
      width: styles.width,
      height: styles.height,
      overflow: styles.overflow,
      transform: styles.transform,
      border: styles.border,
      color: styles.color,
      backgroundColor: styles.backgroundColor
    };
  });
  
  console.log('Sign In styles:', JSON.stringify(signInStyles, null, 2));
  console.log('Get Started styles:', JSON.stringify(getStartedStyles, null, 2));
  
  // Check if the aside has overflow hidden
  const asideStyle = await page.evaluate(() => {
    const aside = document.querySelector('aside');
    const styles = window.getComputedStyle(aside);
    return {
      overflow: styles.overflow,
      overflowY: styles.overflowY,
      height: styles.height,
      maxHeight: styles.maxHeight,
      transform: styles.transform
    };
  });
  
  console.log('Aside styles:', JSON.stringify(asideStyle, null, 2));
  
  await browser.close();
})();
