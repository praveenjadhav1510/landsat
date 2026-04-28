import { NextResponse } from 'next/server';
import chromium from '@sparticuz/chromium';

// Force dynamic execution for API route in Next.js App Router
export const dynamic = 'force-dynamic';
// Vercel serverless functions need more time for Playwright
export const maxDuration = 60; 

const isDev = process.env.NODE_ENV === 'development';

export async function POST(request: Request) {
  let browser;
  try {
    const { words } = await request.json();

    if (!Array.isArray(words) || words.length === 0) {
      return NextResponse.json({ error: 'Please provide an array of words.' }, { status: 400 });
    }

    const generatedUrls: { word: string, url: string, error?: string }[] = [];

    // Launch browser dynamically based on environment
    if (isDev) {
      const { chromium: localChromium } = await import('playwright');
      browser = await localChromium.launch({ headless: true });
    } else {
      const playwrightCore = await import('playwright-core');
      chromium.setGraphicsMode = false;
      browser = await playwrightCore.chromium.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: true, // Fix: Sparticuz runs headless on Vercel
      });
    }

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    console.log('Navigating to NASA Landsat site...');
    await page.goto('https://science.nasa.gov/specials/your-name-in-landsat/', { waitUntil: 'networkidle' });

    for (const word of words) {
      const sanitizedWord = word.replace(/[^A-Za-z\s]/g, '').trim().toUpperCase();
      
      if (sanitizedWord.length === 0) {
        generatedUrls.push({ word, url: '', error: 'Invalid word (only A-Z allowed)' });
        continue;
      }

      console.log(`Generating image for: "${sanitizedWord}"...`);
      
      try {
        await page.fill('#nameInput', '');
        await page.fill('#nameInput', sanitizedWord);
        await page.click('#enterButton');
        
        // Wait for generation and animations to complete.
        // NASA's site animates each letter sequentially (~0.5s per letter).
        const animationWaitTime = Math.max(3000, sanitizedWord.length * 600 + 1500);
        await page.waitForTimeout(animationWaitTime);
        
        const nameBoxes = await page.locator('#nameBoxes');
        await nameBoxes.waitFor({ state: 'visible', timeout: 5000 });
        
        // Force the container and body backgrounds to be transparent
        await page.evaluate(() => {
          document.body.style.background = 'transparent';
          const container = document.getElementById('nameBoxes');
          if (container) {
            container.style.background = 'transparent';
            container.style.backgroundColor = 'transparent';
          }
        });
        
        // Capture screenshot in memory
        const screenshotBuffer = await nameBoxes.screenshot({ omitBackground: true });
        
        // Convert Buffer to Base64 data URL
        const base64String = screenshotBuffer.toString('base64');
        const dataUrl = `data:image/png;base64,${base64String}`;
        
        generatedUrls.push({ 
          word: sanitizedWord, 
          url: dataUrl
        });
      } catch (err: any) {
        console.error(`Failed to generate image for "${sanitizedWord}":`, err.message);
        generatedUrls.push({ word: sanitizedWord, url: '', error: err.message });
      }
    }

    await browser.close();

    return NextResponse.json({ results: generatedUrls }, { status: 200 });

  } catch (error: any) {
    if (browser) await browser.close();
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
