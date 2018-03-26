// We don't need puppeteer anymore since our helps Page wraps is
// const puppeteer = require('puppeteer');
const Page = require('./helpers/page');

let page;

// Setup for each test
beforeEach( async () => {
  page = await Page.build();
  await page.goto('http://localhost:3000');
})

// After each test
afterEach( async () => {
  // Now we can do page.close instead of browser.close
  await page.close();
})

test('the header has the correct text', async () => {
  const text = await page.getContentsOf('a.brand-logo');
  expect(text).toEqual('Blogster');
})

test('Clicking login starts oauth flow', async () => {
  await page.click('[href="/auth/google"]');

  const url = await page.url();
  expect(url).toMatch(/accounts\.google\.com/)
})

test('When signed in, shows logout button', async () => {
  await page.login();

  const text = await page.getContentsOf('[href="/auth/logout"]');
  expect(text).toEqual('Logout');
});