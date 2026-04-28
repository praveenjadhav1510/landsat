import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// Read words from command-line arguments
const words = process.argv.slice(2).filter(w => w.trim().length > 0);

if (words.length === 0) {
  console.log('Please provide a list of words to generate.');
  console.log('Usage: node generate-landsat.mjs WORD1 WORD2 "HELLO WORLD"');
  process.exit(1);
}

// Create output directory if it doesn't exist
const outputDir = path.join(process.cwd(), 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

(async () => {
  console.log(`Starting generation for ${words.length} word(s)...`);
  
  // Launch browser
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  // Navigate to NASA Landsat name generator
  console.log('Navigating to NASA Landsat site...');
  await page.goto('https://science.nasa.gov/specials/your-name-in-landsat/', { waitUntil: 'networkidle' });
  
  for (const word of words) {
    // NASA site only allows A-Z letters and spaces (though spaces might just be ignored or handled)
    const sanitizedWord = word.replace(/[^A-Za-z\s]/g, '').trim().toUpperCase();
    
    if (sanitizedWord.length === 0) {
      console.log(`Skipping invalid word: "${word}"`);
      continue;
    }

    console.log(`Generating image for: "${sanitizedWord}"...`);
    
    try {
      // Clear the input field
      await page.fill('#nameInput', '');
      
      // Type the word
      await page.fill('#nameInput', sanitizedWord);
      
      // Click the Enter button
      await page.click('#enterButton');
      
      // Wait for generation and animations to complete.
      // NASA's site animates each letter sequentially (~0.5s per letter).
      const animationWaitTime = Math.max(3000, sanitizedWord.length * 600 + 1500);
      await page.waitForTimeout(animationWaitTime); 
      
      // Locate the element containing the generated images
      const nameBoxes = await page.locator('#nameBoxes');
      
      // Make sure the element is visible
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
      
      // Take a screenshot of the specific element
      const safeFilename = sanitizedWord.replace(/\s+/g, '_') + '.png';
      const outputPath = path.join(outputDir, safeFilename);
      
      await nameBoxes.screenshot({ path: outputPath, omitBackground: true });
      
      console.log(`✅ Saved ${outputPath}`);
    } catch (err) {
      console.error(`❌ Failed to generate image for "${sanitizedWord}":`, err.message);
    }
  }

  await browser.close();
  console.log('\nAll done! Images are saved in the "output" directory.');
})();
