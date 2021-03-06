/**
 *
 * Selenium testing using Saucelabs
 * https://www.saucelabs.com
 *
 * Basic automated tests to ensure functionality across all platforms
 * (Create gameplay tests for all browsers and platforms)
 *
 * Selenium tests currently setup for quick testing of major browsers and Desktop OS's
 *
 */
var comprehensiveTest = false;

var assert = require('assert');
var SauceLabs = require("saucelabs");
var username = "sumnerfit";
var accessKey = "e8a11001-6685-43c4-901b-042e862a93f4";
var saucelabs = new SauceLabs({
  username: username,
  password: accessKey
});

var test = require('ava');
var webdriver = require('selenium-webdriver');
var drivers = [];

webdriver.promise.USE_PROMISE_MANAGER = false;
/**
 * Create browser / platforms to test against here
 * function formated driver_browser_os
 *    i.e. driver_fx_xp = Firefox on Windows XP
 * Note: version number coresponds to browser version number
 *
 * TODO: break down functions below to one function with an input array of platform/browers/version
 *
 * https://saucelabs.com/platforms
 *
 */

//Super quick tests for setting up tests and not over loading saucelabs
var superQuickTests = {
  'Windows 10': {
    'firefox': {
      startVersion: 55,
      endVersion: 55
    },
    'MicrosoftEdge': { //testing two versions here
      startVersion: 14,
      endVersion: 14
    }
  }
}

// Quick tests hold multiple of 4 tests at any time for testing in parallel - currently 8 combos
var quickTests = {
  'Windows 10': {
    'firefox': {
      startVersion: 55,
      endVersion: 55
    },
    'chrome': {
      startVersion: 60,
      endVersion: 60
    },
    'internet explorer': {
      startVersion: 11,
      endVersion: 11
    },
    'MicrosoftEdge': { //testing two versions here
      startVersion: 14,
      endVersion: 15
    },
  },
  'Windows 8.1': {
    'firefox': {
      startVersion: 55,
      endVersion: 55
    },
    'internet explorer': {
      startVersion: 11,
      endVersion: 11
    }
  },
  'Linux': {
    'firefox': {
      startVersion: 45,
      endVersion: 45
    },
    'chrome': {
      startVersion: 48,
      endVersion: 48
    }
  },
  'Mac 10.12': {
    'firefox': {
      startVersion: 45,
      endVersion: 45
    },
    'chrome': {
      startVersion: 60,
      endVersion: 60
    },
    'safari': {
      startVersion: 10,
      endVersion: 10
    }
  }
}

var comprehensiveTests = {
  'Windows 10': {
    'firefox': {
      startVersion: 4,
      endVersion: 55
    },
    'chrome': {
      startVersion: 26,
      endVersion: 60
    },
    'ie': {
      startVersion: 11,
      endVersion: 11
    },
    'edge': {
      startVersion: 13,
      endVersion: 15
    }
  },
  'Windows 8.1': {
    firefox: {
      startVersion: 4,
      endVersion: 55
    },
    chrome: {
      startVersion: 26,
      endVersion: 60
    },
    ie: {
      startVersion: 11,
      endVersion: 11
    }
  },
  'Windows 8': {
    firefox: {
      startVersion: 4,
      endVersion: 55
    },
    chrome: {
      startVersion: 26,
      endVersion: 60
    },
    ie: {
      startVersion: 10,
      endVersion: 10
    }
  },
  'Windows 7': {
    firefox: {
      startVersion: 4,
      endVersion: 55
    },
    chrome: {
      startVersion: 26,
      endVersion: 60
    },
    ie: {
      startVersion: 8,
      endVersion: 11
    },
    opera: {
      startVersion: 11,
      endVersion: 12
    },
    safari: {
      startVersion: 5,
      endVersion: 5
    }
  },
  'Windows XP': {
    firefox: {
      startVersion: 4,
      endVersion: 45
    },
    chrome: {
      startVersion: 26,
      endVersion: 49
    },
    ie: {
      startVersion: 6,
      endVersion: 8
    },
    opera: {
      startVersion: 11,
      endVersion: 12
    }
  },
  'Mac 10.12': {
    firefox: {
      startVersion: 4,
      endVersion: 45
    },
    chrome: {
      startVersion: 27,
      endVersion: 60
    },
    safari: {
      startVersion: 10,
      endVersion: 10
    }
  },
  'Mac 10.11': {
    firefox: {
      startVersion: 4,
      endVersion: 45
    },
    chrome: {
      startVersion: 27,
      endVersion: 60
    },
    safari: {
      startVersion: 9,
      endVersion: 10
    }
  },
  'Mac 10.10': {
    chrome: {
      startVersion: 37,
      endVersion: 60
    },
    safari: {
      startVersion: 8,
      endVersion: 8
    }
  },
  'Mac 10.9': {
    firefox: {
      startVersion: 4,
      endVersion: 55
    },
    chrome: {
      startVersion: 31,
      endVersion: 60
    },
    safari: {
      startVersion: 7,
      endVersion: 7
    }
  },
  'Mac 10.8': {
    firefox: {
      startVersion: 4,
      endVersion: 48
    },
    chrome: {
      startVersion: 27,
      endVersion: 49
    },
    safari: {
      startVersion: 6,
      endVersion: 6
    }
  },
  'Linux': {
    firefox: {
      startVersion: 4,
      endVersion: 45
    },
    chrome: {
      startVersion: 26,
      endVersion: 48
    },
    opera: {
      startVersion: 12,
      endVersion: 12
    }
  }
}

/**
 * each driver built here
 * @param {Sting} os : 'Windows 10', 'Windows 8.1', 'Linux', 'Mac 10.12'
 * @param {Sring} browser : 'firefox', 'chrome'...
 * @param {int} version : browser version number
 *
 * @return {Object} : driver object
 */
function buildDriver(os, browser, version, test_info) {
  var driver = new webdriver.Builder()
    .withCapabilities({
      'browserName': browser,
      'name': test_info + os + " | " + browser + " | " + version,
      'platform': os,
      'version': version,
    })
    .usingServer('http://' + username + ':' + accessKey + '@ondemand.saucelabs.com:80/wd/hub')
    .build();
  driver.getSession()
    .then(function (sessionid) {
      driver.sessionID = sessionid.id_;
    });
  return driver;
}

/**
 * Execute tests here
 * Write functions for each test here and call them in the section at the bottom of the page
 */

async function popups_display_and_close(title, driver, os, browser, version) {
  test(title + ' - ' + os + ' | ' + browser + ' | ' + version + ')', async t => {
    var passedBool = true;
    try {
      driver.manage()
        .window()
        .setSize(1024, 768);

      // road building set here to stop victory point cards interfering with the test.
      await driver.get(
        'http://capstone-settlers.herokuapp.com/?startWithCards=5&setup=skip&fixedDice=true&dev_card=road_building'
      );
      await driver.findElement(webdriver.By.id('play'))
        .click();
      await driver.findElement(webdriver.By.id('txt_player1'))
        .sendKeys(os + "|" + browser + "|" + version);
      await driver.findElement(webdriver.By.className('player_button'))
        .click();
      //below code twice to pass through two modals

      await driver.findElement(webdriver.By.className('btn-info'))
        .click();
      await driver.findElement(webdriver.By.className('btn-info'))
        .click();

      //get initial values to test against (they will be different based on resources distributed)
      var startOre = await driver.findElement(webdriver.By.className('orecount'))
        .getText();
      var startSheep = await driver.findElement(webdriver.By.className('sheepcount'))
        .getText();
      var startGrain = await driver.findElement(webdriver.By.className('graincount'))
        .getText();

      // click "Buy Development Card" button
      await driver.findElement(webdriver.By.className('buybutton'))
        .click();

      // get returned values
      var finishOre = await driver.findElement(webdriver.By.className('orecount'))
        .getText();
      var finishSheep = await driver.findElement(webdriver.By.className('sheepcount'))
        .getText();
      var finishGrain = await driver.findElement(webdriver.By.className('graincount'))
        .getText();

      // test cards removed when Buy Dev Card clicked
      // t.is(parseInt(finishSheep), parseInt(startSheep)-1);
      // t.is(parseInt(finishGrain), parseInt(startGrain)-1);
      // t.is(parseInt(finishOre), parseInt(startOre)-1);

      // check card returned
      t.is(await driver.findElement(webdriver.By.className('cardlist'))
        .findElements(webdriver.By.className('card'))
        .then(function (elements) {
          return elements.length;
        }), 1);

      // check in game popup works
      await driver.findElement(webdriver.By.className('road_building'))
        .click();
      t.is(await driver.findElement(webdriver.By.className('popup_title'))
        .getText(), "Road Building");

      // check can we close the popup window
      await driver.findElement(webdriver.By.className('road_building_button'))
        .click();
      //t.is(await driver.findElement(webdriver.By.className('popup')).getCSSvalue('display'), 'none');

      saucelabs.updateJob(driver.sessionID, {
        name: title + " | " + os + " | " + browser + " | " + version,
        passed: passedBool,
      });

      driver.quit();
    } catch (err) {
      console.log("FAILED " + title + " - " + os + " | " + browser + " | " + version);
      passedBool = false;
      saucelabs.updateJob(driver.sessionID, {
        name: title + " | " + os + " | " + browser + " | " + version,
        passed: passedBool,
      });

      driver.quit();
    }
  });
}

/**
 * Call tests here
 */

var testCapabilities = superQuickTests;

// add descriptive string here and the test to the if-else statements below
var testTitles = ['Popups display and close'];

// Loop through test names
for (var j = 0; j < testTitles.length; j++) {

  // Loop each Operating System
  for (var os in testCapabilities) {

    //Loop through each Browser on that Operating System
    for (var browser in testCapabilities[os]) {

      // Loop through each version specified for that Browser
      for (var version = parseInt(testCapabilities[os][browser].startVersion); version <= parseInt(
          testCapabilities[os][browser].endVersion); version++) {

        //Find the correct test
        if (testTitles[j] === 'Popups display and close') {

          // initialise driver inside for loop otherwise can be created too early and time out
          var driver = buildDriver(os + "", browser + "", version + "", testTitles[j] + " - ");
          popups_display_and_close(testTitles[j], driver, os, browser, version);

        }
      }
    }
  }
}
