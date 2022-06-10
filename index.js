const puppeteer = require("puppeteer");
const fs = require("fs-extra");
const path = require("path");
const ora = require("ora");
require("dotenv").config();

const stories = require("./stories.json");
const getStories = require("./story-gen");


const main = async () => {
  const subreddit = "nosleep";
  spinner.start();
  spinner.text = `Fetching stories from: Reddit.com/r/${subreddit}\n=================================================\n`;
  spinner.color = "orange";

  // grabs stories from reddit and saves them in the stories.json file
  // getStories(subreddit);
  
  // await getTTS();

  // elements truly randomly exists or not
  // if this function crashes, retry 
  try {
    await makeVideo();  
  } catch (error) {
    await makeVideo();  
  }
  
  spinner.succeed("Done!");
  process.exit(0);
}

// creates terminal spinner
const spinner = ora({spinner: {
    "interval": 80,
    "frames": [
      "[    ]",
      "[=   ]",
      "[==  ]",
      "[=== ]",
      "[ ===]",
      "[  ==]",
      "[   =]",
      "[    ]",
      "[    ]",
      "[   =]",
      "[  ==]",
      "[ ===]",
      "[====]",
      "[=== ]",
      "[==  ]",
      "[=   ]",
      "[    ]"
    ]
  }});

// watches for changes in the downloads folder
// moves clips to their own story folder
const folder = path.relative(__filename, "C:/Users/kingc/Downloads");
let audioNum = 0;
let count = 0;
let storyNum = 0;
let clipsArr = [];

fs.watch(folder, (eventType = "rename", filename) => {
  const fileData = path.parse(filename);
  const audioName = `clip-${audioNum}.mp3`;
  
  if (fileData.ext === ".mp3") {
    // 5 mp3s are watched per download
    // only saves the last 1
    if (count === 4) {
      const newDir = `${folder}\\story-${storyNum}\\${audioName}`;

      fs.move(`${folder}/${filename}`, newDir, err => {
        if (err) return console.error(err)
      })

      count = 0;
      audioNum++;

      // stores file location 
      clipsArr.push(newDir);
      fs.writeFile("stories.json", JSON.stringify({[`story-${storyNum}`]: clipsArr, stories}), (err) => {if (err) throw err} )
    } else {
      count++;
    }
  }
})  


// add audio clips to video
const makeVideo = async () => {
  spinner.text = `Making video\n===================\n`; 
  spinner.color = "blue";

  const browser = await puppeteer.launch({headless: false, slowMo: 100, defaultViewport: {width: 1600, height: 900}});
  const page = await browser.newPage();

  await page.goto("https://veed.io/new");

  spinner.text += "Loading editor...\n";

  for (let i = 0; i < stories[`story-${storyNum}`].length-37; i++) {
    // catches an edge case where the robo misses the "+" button
    try {
      await page.waitForSelector("span.browse-link");
    } catch (err) {
      await page.click("#dropWrapper-timeline > div > button"); 
    }
    
    const [fileChooser] = await Promise.all([
      page.waitForFileChooser(),
      page.click("span.browse-link")
    ]);
    await fileChooser.accept([stories[`story-${storyNum}`][i]]);
    
    if (i === 0) {
      spinner.text += "Adding clips to timeline...\n";
      await page.click("#root > div > div > div > div > div > div > div:nth-child(2) > img");
      await page.click("#dropWrapper-upload > div > div > div > div > div > div > div > div > div:nth-child(5) > div > div:nth-child(1) > div > div > input", {clickCount: 3});
      await page.keyboard.type("#000000");
      await page.click("#videoBox > div > div > div > div > div.move");
      await page.click("button[aria-label='Delete']");
      await page.click("button[data-testid='@edit-image/delete-button-confirm']");
    }
    
    await page.waitForSelector("#dropWrapper-timeline > div > button");
    await page.click("#dropWrapper-timeline > div > button");
  }

  spinner.text += "Publishing video...\n";

  await page.click("body > div > div > div > div > div > button");
  await page.click("input[data-testid='@inline-edit/input']", {clickCount: 3});
  await page.keyboard.type(`video-${storyNum}`);
  await page.click("button[data-testid='@header-controls/publish-button']");
  await page.click("div[data-testid='@component/dropdown/item']");
  await page.click("#root > div > div > div > div:nth-child(3)");
  await page.click("button[data-testid='@export/export-button']");

  spinner.text += "Downloading video...";

  await page.waitForSelector("#__next > div > div > div > div > div > div > span");
  let downloadPercentage = await page.$eval("#__next > div > div > div > div > div > div > span", (el) => el.innerText);
  spinner.text += downloadPercentage;

  while (downloadPercentage !== "100%") { 
    downloadPercentage = await page.$eval("#__next > div > div > div > div > div > div > span", (el) => el.innerText);
    
    spinner.text = spinner.text.slice(0, -4) + "." + downloadPercentage + "\n";
  }
  await page.waitForSelector("#__next > div > div > div > div > button > svg");
  await page.click("#__next > div > div > div > div > button > svg");
  await page.waitForSelector("#__next > div > div > div > div > div > div:nth-child(1) > span");
  await page.click("#__next > div > div > div > div > div > div:nth-child(1) > span");

  await page.waitForTimeout(2000);

  await browser.close();
}


// converts text to tts
const getTTS = async () => {
  spinner.color = "gray"; 

  for (let i = -1; i < stories[storyNum].content.length; i++) {
    if (i === -1) {
      const browser = await puppeteer.launch({headless: false, args: ["--mute-audio"]});
      const page = await browser.newPage();
      
      await page.goto("https://tts.5e7en.me/");

      await page.click("textarea");
      await page.keyboard.type(stories[storyNum].title);
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
      spinner.text = `Creating ${clipsArr.length}/${stories[storyNum].content.length} audio clips\n=================================\n${clipsArr.join("\n")}`;

      const browser = await puppeteer.launch({headless: false, args: ["--mute-audio"]});
      const page = await browser.newPage();
      
      await page.goto("https://tts.5e7en.me/");
      
      await page.click("textarea");
      await page.keyboard.type(stories[storyNum].content[i]);
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
    }
  }
}


main();
