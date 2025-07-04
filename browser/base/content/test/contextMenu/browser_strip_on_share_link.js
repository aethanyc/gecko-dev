/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

let listService;

let url =
  "https://example.com/browser/browser/base/content/test/general/dummy_page.html";

add_setup(async function () {
  await SpecialPowers.pushPrefEnv({
    set: [
      ["test.wait300msAfterTabSwitch", true],
      ["privacy.query_stripping.strip_list", "stripParam"],
      ["privacy.query_stripping.strip_on_share.canDisable", false],
    ],
  });

  // Get the list service so we can wait for it to be fully initialized before running tests.
  listService = Cc["@mozilla.org/query-stripping-list-service;1"].getService(
    Ci.nsIURLQueryStrippingListService
  );

  await listService.testWaitForInit();
});

/*
  Tests the strip-on-share feature for in-content links
*/

// Tests that the menu item does not show if the pref is disabled
add_task(async function testPrefDisabled() {
  let validUrl = "https://www.example.com/";
  let shortenedUrl = "https://www.example.com/";
  await testStripOnShare({
    originalURI: validUrl,
    strippedURI: shortenedUrl,
    prefEnabled: false,
    useTestList: false,
    canDisable: false,
    menuItemVisible: false,
  });
});

// Menu item should be visible, url should be stripped.
add_task(async function testQueryParamIsStrippedSelectURL() {
  let validUrl = "https://www.example.com/?stripParam=1234";
  let shortenedUrl = "https://www.example.com/";
  await testStripOnShare({
    originalURI: validUrl,
    strippedURI: shortenedUrl,
    prefEnabled: true,
    useTestList: false,
    canDisable: false,
    menuItemVisible: true,
  });
});

// Menu item should be visible, ensuring only parameters on the list are stripped
add_task(async function testQueryParamIsStripped() {
  let validUrl = "https://www.example.com/?stripParam=1234&otherParam=1234";
  let shortenedUrl = "https://www.example.com/?otherParam=1234";
  await testStripOnShare({
    originalURI: validUrl,
    strippedURI: shortenedUrl,
    prefEnabled: true,
    useTestList: false,
    canDisable: false,
    menuItemVisible: true,
  });
});

// Menu item should be visible, if there is nothing to strip, url should remain the same
add_task(async function testURLIsCopiedWithNoParams() {
  let validUrl = "https://www.example.com/";
  let shortenedUrl = "https://www.example.com/";
  await testStripOnShare({
    originalURI: validUrl,
    strippedURI: shortenedUrl,
    prefEnabled: true,
    useTestList: false,
    canDisable: false,
    menuItemVisible: true,
  });
});

// Testing site specific parameter stripping
add_task(async function testQueryParamIsStrippedForSiteSpecific() {
  let validUrl = "https://www.example.com/?test_2=1234";
  let shortenedUrl = "https://www.example.com/";
  await testStripOnShare({
    originalURI: validUrl,
    strippedURI: shortenedUrl,
    prefEnabled: true,
    useTestList: true,
    canDisable: false,
    menuItemVisible: true,
  });
});

// Ensuring site specific parameters are not stripped for other sites
add_task(async function testQueryParamIsNotStrippedForWrongSiteSpecific() {
  let validUrl = "https://www.example.com/?test_3=1234";
  let shortenedUrl = "https://www.example.com/?test_3=1234";
  await testStripOnShare({
    originalURI: validUrl,
    strippedURI: shortenedUrl,
    prefEnabled: true,
    useTestList: true,
    canDisable: false,
    menuItemVisible: true,
  });
});

// Ensuring clean copy works with magnet links. We don't strip anything but copying the original URI should still work.
add_task(async function testMagneticLinks() {
  let validUrl = "magnet:?xt=urn:btih:somesha1hash";
  let shortenedUrl = "magnet:?xt=urn:btih:somesha1hash";
  await testStripOnShare({
    originalURI: validUrl,
    strippedURI: shortenedUrl,
    prefEnabled: true,
    useTestList: true,
    canDisable: false,
    menuItemVisible: true,
  });
});

// Ensuring clean copy option is disabled on magnet links
add_task(async function testMagneticLinks() {
  let validUrl = "magnet:?xt=urn:btih:somesha1hash";
  let shortenedUrl = "magnet:?xt=urn:btih:somesha1hash";
  await testStripOnShare({
    originalURI: validUrl,
    strippedURI: shortenedUrl,
    prefEnabled: true,
    useTestList: true,
    canDisable: true,
    menuItemVisible: false,
  });
});

// Ensuring clean copy is disabled on about links
add_task(async function testMagneticLinks() {
  let validUrl = "about:blank";
  let shortenedUrl = "about:blank";
  await testStripOnShare({
    originalURI: validUrl,
    strippedURI: shortenedUrl,
    prefEnabled: true,
    useTestList: true,
    canDisable: true,
    menuItemVisible: false,
  });
});

// Ensure clean copy is diabled when nothing can be stripped
add_task(async function testStripNothingDisabled() {
  let validUrl = "https://example.com";
  let shortenedUrl = "https://example.com";
  await testStripOnShare({
    originalURI: validUrl,
    strippedURI: shortenedUrl,
    prefEnabled: true,
    useTestList: true,
    canDisable: true,
    menuItemVisible: false,
  });
});

// Ensuring clean copy does works correctly when encountering a nested link that throws causes an error to
// occur. In this case, a nested magnetic link was used as it causes an error to be thrown.
add_task(async function testErrorHandlingForNestedLinks() {
  let validUrl =
    "https://www.example.com/?test_3=magnet%3A%3Fxt%3Durn%3Abtih%3Asomesha1hash&test_4=1234&test_2=4321";
  let shortenedUrl =
    "https://www.example.com/?test_3=magnet%3A%3Fxt%3Durn%3Abtih%3Asomesha1hash&test_4=1234";
  await testStripOnShare({
    originalURI: validUrl,
    strippedURI: shortenedUrl,
    prefEnabled: true,
    useTestList: true,
    canDisable: false,
    menuItemVisible: true,
  });
});

// Tests that the menu item does not show up if the strip on share and disable
// pref is enabled and there is nothing to strip
add_task(async function testNoParamToStripWithCanDisablePref() {
  let validUrl = "https://www.example.com/";
  let shortenedUrl = "https://www.example.com/";
  await testStripOnShare({
    originalURI: validUrl,
    strippedURI: shortenedUrl,
    prefEnabled: true,
    useTestList: false,
    canDisable: true,
    menuItemVisible: false,
  });
});

// Menu item should be visible, url should be stripped.
// Even with disable pref enabed
add_task(async function testQueryParamIsStrippedWithCanDisablePref() {
  let validUrl = "https://www.example.com/?stripParam=1234";
  let shortenedUrl = "https://www.example.com/";
  await testStripOnShare({
    originalURI: validUrl,
    strippedURI: shortenedUrl,
    prefEnabled: true,
    useTestList: false,
    canDisable: true,
    menuItemVisible: true,
  });
});

/**
 * Opens a new tab, opens the context menu and checks that the strip-on-share menu item is visible.
 * Checks that the stripped version of the url is copied to the clipboard.
 *
 * @param {string} originalURI - The orginal url before the stripping occurs
 * @param {string} strippedURI - The expected url after stripping occurs
 * @param {boolean} prefEnabled - Whether StripOnShare pref is enabled
 * @param {boolean} useTestList - Whether the StripOnShare or Test list should be used
 * @param {boolean} canDisable - Whether the StripOnShare context menu item is disabled if there is nothing to be stripped
 * @param {boolean} menuItemVisible - Whether the StripOnShare context menu item should be visible
 */
async function testStripOnShare({
  originalURI,
  strippedURI,
  prefEnabled,
  useTestList,
  canDisable,
  menuItemVisible,
}) {
  await SpecialPowers.pushPrefEnv({
    set: [
      ["privacy.query_stripping.strip_on_share.enabled", prefEnabled],
      ["privacy.query_stripping.strip_on_share.enableTestMode", useTestList],
      ["privacy.query_stripping.strip_on_share.canDisable", canDisable],
    ],
  });

  if (useTestList) {
    let testJson = {
      global: {
        queryParams: ["utm_ad"],
        topLevelSites: ["*"],
      },
      example: {
        queryParams: ["test_2", "test_1"],
        topLevelSites: ["www.example.com"],
      },
      exampleNet: {
        queryParams: ["test_3", "test_4"],
        topLevelSites: ["www.example.net"],
      },
    };

    await listService.testSetList(testJson);
  }

  await BrowserTestUtils.withNewTab(url, async function (browser) {
    // Prepare a link
    await SpecialPowers.spawn(
      browser,
      [originalURI],
      async function (startingURI) {
        let link = content.document.createElement("a");
        link.href = startingURI;
        link.textContent = "link with query param";
        link.id = "link";
        content.document.body.appendChild(link);
      }
    );
    let contextMenu = document.getElementById("contentAreaContextMenu");
    // Open the context menu
    let awaitPopupShown = BrowserTestUtils.waitForEvent(
      contextMenu,
      "popupshown"
    );
    await BrowserTestUtils.synthesizeMouseAtCenter(
      "#link",
      { type: "contextmenu", button: 2 },
      browser
    );
    await awaitPopupShown;
    let awaitPopupHidden = BrowserTestUtils.waitForEvent(
      contextMenu,
      "popuphidden"
    );
    let stripOnShare = contextMenu.querySelector("#context-stripOnShareLink");
    if (menuItemVisible) {
      Assert.ok(
        BrowserTestUtils.isVisible(stripOnShare),
        "Menu item is visible"
      );
      // Make sure the stripped link will be copied to the clipboard
      await SimpleTest.promiseClipboardChange(strippedURI, () => {
        contextMenu.activateItem(stripOnShare);
      });
    } else {
      if (canDisable) {
        Assert.ok(stripOnShare.disabled, "Menu item is disabled");
      } else {
        Assert.ok(
          !BrowserTestUtils.isVisible(stripOnShare),
          "Menu item is not visible"
        );
      }
      contextMenu.hidePopup();
    }
    await awaitPopupHidden;
  });
}
