/**
 * Phantomjs/Casperjs script to scrape the snapshot URL for a camera from the motionEye web front-end.
 */

var casper = require("casper").create({
  waitTimeout: 20000,
  stepTimeout: 20000,
  verbose: true,
  logLevel: "error",
  pageSettings: {
    webSecurityEnabled: false
  },
  onWaitTimeout: function() {
    this.echo("timeout")
  },
  onStepTimeout: function() {
    this.echo("timeout")
  }
})

  /**
   * Open the motionEye front-end.
   */
  casper.start("http://127.0.0.1:8765", function() {
    this.waitForSelector("body > div.modal-container > div > div:nth-child(2) > form")
  })

  /**
   * Login to motionEye.
   */
  casper.then(function() {
    var username = casper.cli.get("username")
    var password = casper.cli.get("password")
    this.fillSelectors("body > div.modal-container > div > div:nth-child(2) > form", {
      "#usernameEntry": username,
      "#passwordEntry": password
    }, false)
    this.click("body > div.modal-container > div > table > tbody > tr > td:nth-child(2) > div")
    this.waitForSelector("body > div.header > div > div.settings-top-bar.closed > div.button.icon.settings-button.mouse-effect")
  })

  /**
   * Open the settings menu.
   */
  casper.then(function() {
    this.click("body > div.header > div > div.settings-top-bar.closed > div.button.icon.settings-button.mouse-effect")
    this.waitForSelector("#cameraSelect")
  })

  /**
   * Get the snapshot URLs for each camera.
   */
  casper.then(function() {
    var ids = casper.cli.get("camera_ids").split(",")
    for (var i = 0, len = ids.length; i < len; i++) {
      
      /*
      this.evaluate(function(id) {
        document.querySelector("#cameraSelect").value = id
      }, ids[i])
      this.capture("/home/pi/casper/screenshot_" + ids[i] + ".png")
      */

      casper.selectOptionByValue("#cameraSelect", ids[i])
      this.then(function() {
        casper.wait(5000)
      })
      casper.capture("/home/pi/casper/screenshot_" + ids[i] + ".png")
    }
  })

/**
 * Run this casper script.
 */
casper.run()

/**
 * Casperjs member kensoh implementation to select an option by value.
 * @see {@link https://github.com/kensoh kensoh}
 * Casperjs doesn't support selecting options from drop-down menus without a bunch of code.
 * @see {@link https://github.com/casperjs/casperjs/issues/1390#issuecomment-312243488 Casperjs issue #1390}
 */
casper.selectOptionByValue = function(selector, valueToMatch) { // solution posted in casperjs issue #1390
  this.evaluate(function(selector, valueToMatch) {
    var found = false // modified to allow xpath / css locators
    if ((selector.indexOf('/') == 0) || (selector.indexOf('(') == 0)) var select = __utils__.getElementByXPath(selector)
    else var select = document.querySelector(selector) // auto-select xpath or query css method to get element
    Array.prototype.forEach.call(select.children, function(opt, i) { // loop through list to select option
      if (!found && opt.value.indexOf(valueToMatch) !== -1) {
        select.selectedIndex = i
        found = true
      }
    })
    var evt = document.createEvent("UIEvents") // dispatch change event in case there is validation
    evt.initUIEvent("change", true, true)
    select.dispatchEvent(evt)
  }, selector, valueToMatch)
}

