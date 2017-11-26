// https://dzone.com/articles/building-your-own-web-scraper-in-nodejs

var casper = require('casper').create({
  waitTimeout: 10000,
  stepTimeout: 10000,
  verbose: true,
  pageSettings: {
    webSecurityEnabled: false
  },
  onWaitTimeout: function() {
    this.echo('** Wait-TimeOut **')
  },
  onStepTimeout: function() {
    this.echo('** Step-TimeOut **')
  }
})

casper.start()

casper.open('http://127.0.0.1:8765')

casper.then(function() {
  this.waitForSelector('#usernameEntry',
    function pass () {
      casper.sendKeys('#usernameEntry', 'user')
    },
    function fail () {
      this.die('Something went wrong')
    }
  )
})

casper.then(function() {
  this.waitForSelector('#passwordEntry',
    function pass () {
      casper.sendKeys('#passwordEntry', 'letmein')
    },
    function fail () {
      this.die('Something went wrong')
    }
  )
})

casper.then(function() {
  this.capture('/home/pi/screener.png')
})

casper.run()