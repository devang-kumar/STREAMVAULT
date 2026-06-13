const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
  
  // Click the mobile menu button
  await page.click('button[aria-label="Open menu"]');
  await page.waitForTimeout(500);
  
  // Check if Sign In and Get Started buttons are visible
  const signInVisible = await page.isVisible('text=Sign In');
  const getStartedVisible = await page.isVisible('text=Get Started');
  
  console.log('Sign In visible:', signInVisible);
  console.log('Get Started visible:', getStartedVisible);
  
  // Take screenshot for verification
  await page.screenshot({ path: 'mobile-menu.png', fullPage: true });
  
  await browser.close();
  
  if (signInVisible && getStartedVisible) {
    console.log('SUCCESS: Both buttons are visible in mobile menu!');
    process.exit(0);
  } else {
    console.log('FAILURE: Buttons not visible');
    process.exit(1);
  }
})();
