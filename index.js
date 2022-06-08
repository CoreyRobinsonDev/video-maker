const puppeteer = require("puppeteer");
const fs = require("fs-extra");
const path = require("path");

const stories = require("./stories.json");
const getStories = require("./story-gen");

const subreddit = "nosleep";

// grabs stories from reddit
getStories(subreddit);

const folder = path.relative(__filename, "C:/Users/kingc/Downloads");
let audioNum = 0;
let count = 0;
let storyNum = 0;

fs.watch(folder, (eventType = "rename", filename) => {
  const fileData = path.parse(filename);
  const audioName = `clip-${audioNum}.mp3`;
  
  if (fileData.ext === ".mp3") {
    if (count === 4) {
      fs.move(`${folder}/${filename}`, `./audio/story-${storyNum}/${audioName}`, err => {
        if (err) return console.error(err)
      })
      count = 0;
      audioNum++;
    } else {
      count++;
    }
  }
})  


// converts text to tts

const main = async () => {
  for (let i = -1; i < stories[0].content.length; i++) {
    if (i === -1) {
      const browser = await puppeteer.launch({headless: false});
      const page = await browser.newPage();
      
      await page.goto("https://tts.5e7en.me/");

      await page.click("textarea");
      await page.keyboard.type(stories[0].title);
      await page.click("button[type='submit']");
      await page.click("audio");
      await page.waitForTimeout(1000);
      
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
    
      await page.keyboard.press("Enter");
      await page.keyboard.press("ArrowUp");
      await page.keyboard.press("Enter");
      await page.waitForTimeout(1000);
      
      await browser.close();
    } else {

      const browser = await puppeteer.launch({headless: false});
      const page = await browser.newPage();
      
      await page.goto("https://tts.5e7en.me/");
      
      await page.click("textarea");
      await page.keyboard.type(stories[0].content[i]);
      await page.click("button[type='submit']");
      await page.click("audio");
      await page.waitForTimeout(1000);
      
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      
      await page.keyboard.press("Enter");
      await page.keyboard.press("ArrowUp");
      await page.waitForTimeout(300);
      await page.keyboard.press("Enter");
      await page.waitForTimeout(1000);
      
      await browser.close();
    }
  }
  process.exit(0);
}

main();
