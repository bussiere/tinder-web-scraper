const express = require('express');
const axios = require('axios')
const path = require('path');
const parser = require('body-parser');
const secret = require('./secret.json');
const promise = require('selenium-webdriver').promise;
const https = require('https');
const fs = require('fs');
const domainName = 'http://localhost:3000'
let urls = [];
let faceIds = [];
let webdriver = require('selenium-webdriver'),
By = webdriver.By,
until = webdriver.until;

let chromeCapabilities = webdriver.Capabilities.chrome();
//setting chrome options to start the browser with notifications disabled
let chromeOptions = {
    'args': ['--disable-notifications']
};
chromeCapabilities.set('chromeOptions', chromeOptions);
let driver = new webdriver.Builder().withCapabilities(chromeCapabilities).build();

//log in to facebook
driver.get('http://www.facebook.com/')
  .then(driver.findElement(By.name('email')).sendKeys(secret.email))
    .then(driver.findElement(By.name('pass')).sendKeys(secret.password))
      .then(driver.findElement(By.id('loginbutton')).click())
        //log in to Tinder
        .then(driver.get('http://www.tinder.com/'))
          //click login button
          .then(driver.wait(until.elementLocated(By.xpath('//*[@id="modal-manager"]/div/div/div[2]/div[1]/div/div[3]/button[1]')), 120000))
              .then(driver.findElement(By.xpath('//*[@id="modal-manager"]/div/div/div[2]/div[1]/div/div[3]/button[1]')).click())
                //start swiping
                .then(() => { 
                  /* swipe 45000 cards */
                  for (var i = 0; i < 45000; i++) {
                    //wait till first card is shown
                    driver.wait(until.elementLocated(By.xpath('//*[@id="content"]/div/span/div/div[1]/div/main/div/div/div/div[1]/div[1]/div/div[3]/div[5]')), 120000)
                    // .then(driver.findElement(By.xpath('//*[@id="content"]/div/span/div/div[1]/div/main/div/div/div/div[1]/div[2]/button[4]')).click())
                    /* line above this comment swipes right. line below swipes left. Comment/uncomment them per direction you'd like to swipe */
                    .then(() => {
                      let image = driver.findElement(By.xpath('//*[@id="content"]/div/span/div/div[1]/div/main/div/div/div/div[1]/div[1]/div/div[3]/div[1]'))
                      image.getCssValue('background-image')
                        .then(val => {
                          val = val.substring(5, val.length - 2)
                          console.log(val, 'val')
                          if (val.length > 5){
                            urls.push(val)
                          }
                        })
                      // for other's pic:
                      // driver.findElement(By.xpath('//*[@id="content"]/div/span/div/div[1]/div/main/div/div/div/div[1]/div[1]/div/div[3]/div[1]')).getCssValue("style")
                      // for your own pic:
                      //driver.findElement(By.xpath('//*[@id="content"]/div/span/div/div[1]/div/main/div/div/div/div[1]/div[1]/div/div[1]/img')).getAttribute("src")
                    })

                     //open profile
                      .then(driver.actions().sendKeys(webdriver.Key.ARROW_UP).perform())
                      //wait till profile card fully opens
                        .then(driver.wait(until.elementLocated(By.xpath('//*[@id="content"]/div/span/div/div[1]/div/main/div/div/div/div[1]/div[1]/div[1]/a/div/div[1]/div')), 120000))
                          .then(() => {
                              //locate photos (divs wrapping them)
                              driver.findElements(By.xpath('//*[@id="content"]/div/span/div/div[1]/div/main/div/div/div/div[1]/div[1]/div[1]/a/div/div[1]/div/div'))                    
                                .then((elements) => {
                                  //iterate through profile photos
                                  for (var i = 1; i < elements.length; i++) {
                                    //locate photo element
                                    driver.wait(until.elementLocated(By.xpath('//*[@id="content"]/div/span/div/div[1]/div/main/div/div/div/div[1]/div[1]/div[1]/a/div/div[1]/div' + '/div[' + i + ']/div/img')), 120000)
                                      .then((element) => {
                                        //get source, download file to 'images' directory
                                        element.getAttribute('src')
                                          .then((src) => {
                                            console.log('src is: ', src);
                                            let file = fs.createWriteStream(__dirname + '/images/' + src.split('').join('').slice(src.length-10, src.length));
                                            let request = https.get(src, function(response) {
                                              response.pipe(file);
                                            });
                                          })
                                            //move to next photo
                                            .then(driver.actions().sendKeys(webdriver.Key.SPACE).perform());
                                      });
                                  }
                                })
                            })
                              //close current profile
                              .then(driver.actions().sendKeys(webdriver.Key.ARROW_DOWN).perform())

                                  /* swipe left. comment out line below if swiping right */
                                .then(driver.findElement(By.xpath('//*[@id="content"]/div/span/div/div[1]/div/main/div/div/div/div[1]/div[2]/button[2]')).click())


                                  /*this makes sure we always exit cards, especially if swiping right
                                  and profile gets a match
                                  */
                                  .then(driver.actions().sendKeys(webdriver.Key.ESCAPE).perform());
                      }
                  }).then(()=>{
                  // console.log(urls,'urls')
                    for ( let j = 0; j < urls.length; j++){
                      axios.post(`${domainName}/api/postUrl`, {
                      url: urls[j]
                        })
                        .then(()=> {
                          console.log('post sent')
                        })
                        .catch((err)=> {
                          console.log(err, 'post failed')
                        })
                    }                 
                  })
driver.quit();