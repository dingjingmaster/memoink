/**
 *
 * @authors yutent (yutent@doui.cc)
 * @date    2018-08-06 03:10:07
 */

'use strict'

export const preventLinkClick = function(win) {
  //拦劫新窗口,改用系统浏览器打开链接
  win.on('new-win-policy', newWindow)
  win.on('navigation', newWindow)

  function newWindow(frame, url, policy) {
    url = url.replace(/^chrome\-extension:\/\/memo\.ink\//, 'http://')
    if (/^file:\/\//.test(url)) {
      policy.forceDownload(url)
    } else {
      policy.ignore()
      nw.Shell.openExternal(url)
    }
  }
}

export const load = function(path) {
  let mod = require(path)
  return Anot.deepCopy(mod)
}
