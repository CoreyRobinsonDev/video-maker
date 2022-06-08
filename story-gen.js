const fs = require("fs");
const axios = require("axios");

module.exports = (subreddit) => {
  axios.get(`https://reddit.com/r/${subreddit}.json`).then((response) => {
    const data = response.data.data.children;
    const videos = [];

    for (let i = 0; i < data.length; i++) {
      const text = data[i].data.selftext;
      const content = [""];
      
      if (text !== "") {
        let count = 0;
        
        // splits text into an array of ~480 char strings
        for (let j = 0; j < text.length; j++) {
          if (count > 480) {
            if (text[j] === " ") {
              content.push(text[j]);
              count = 0;
            } else {
              content[content.length - 1] += text[j];
            }
          } else {
            content[content.length - 1] += text[j];
          }
          count++
        }

        videos.push({ content: content, title: data[i].data.title }); 
      }
    }
    fs.writeFile("stories.json", JSON.stringify(videos), (err) => {if (err) throw err} )
  })
}