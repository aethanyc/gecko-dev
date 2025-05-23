/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This is a JavaScript module to be imported via
   ChromeUtils.importESModule() and acts as a singleton.
   Only the following listed symbols will exposed on import, and only when
   and where imported. */

export var BrowserWindows = {
  /**
   * Add
   *
   * Opens a new window. Throws on error.
   *
   * @param aPrivate The private option.
   * @return nothing
   */
  Add(aPrivate) {
    return new Promise(resolve => {
      let mainWindow = Services.wm.getMostRecentWindow("navigator:browser");
      let win = mainWindow.OpenBrowserWindow({ private: aPrivate });
      win.addEventListener(
        "load",
        function () {
          resolve(win);
        },
        { once: true }
      );
    });
  },
};
