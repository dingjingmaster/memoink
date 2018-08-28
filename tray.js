/**
 *
 * @authors yutent (yutent@doui.cc)
 * @date    2018-03-26 11:25:15
 * @version $Id$
 */

let icon = 'images/tray_16x16.png'
if (window.devicePixelRatio > 1) {
  icon = 'images/tray_16x16@2x.png'
}

if (process.platform.toLowerCase() !== 'darwin') {
  icon = 'images/tray_auto.png'
}

global.tray = new nw.Tray({
  tooltip: '忆墨笔记',
  icon: icon
})
