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
  
  // spinner.color = "gray"; 
  // await getTTS();
  
  spinner.text = `Making video\n====================\n`; 
  spinner.color = "blue";
  await makeVideo();  
  
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

      clipsArr.push(newDir);
      count = 0;
      audioNum++;

      fs.writeFile("stories.json", JSON.stringify({[`story-${storyNum}`]: clipsArr, stories}), (err) => {if (err) throw err} )
    } else {
      count++;
    }
  }
})  


// add audio clips to video
const makeVideo = async () => {
  const email = process.env.EMAIL;
  const password = process.env.PASSWORD;
  const browser = await puppeteer.launch({headless: false, slowMo: 100});
  const page = await browser.newPage();

  await page.goto("https://app.clipchamp.com/");

  spinner.text += "Logging in...\n";

  await page.waitForSelector("a[href='/login']");
  await page.click("a[href='/login']");
  await page.click("button[data-testid='toggle-password']");
  await page.click("input[type='email']");
  await page.keyboard.type(email);
  await page.click("input[type='password']");
  await page.keyboard.type(password);
  await page.click("button[type='submit']");
  
  await page.waitForSelector("button[data-testid='create-button']");
  await page.click("button[data-testid='create-button']");

  // await page.click("a[data-step='next']");
  // await page.click("a[data-step='skip-and-end-flow']");
  await page.waitForSelector("button[data-testid='add-media']");
  await page.click("button[data-testid='add-media']");

  spinner.text += "Uploading audio clips...\n";

  const [fileChooser] = await Promise.all([
    page.waitForFileChooser(),
    page.click("body > div > nav > div > div > div > p > span > span")
  ])
  await fileChooser.accept(stories[`story-${storyNum}`]);
  await page.waitForTimeout(6000);

  spinner.text += "Adding clips to timeline...\n";

  for (let i = 0; i < clipsArr.length; i++) {
    await page.click("#panel-all > div > div");

    for (let j = 0; j < (i * 3) + 8; j++) {
      await page.keyboard.press("Tab");
    }
    await page.keyboard.press("Enter");
  }
  await page.waitForTimeout(6000);
  await browser.close();
}


// converts text to tts
const getTTS = async () => {
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
