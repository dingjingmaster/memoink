/**
 *
 * @authors yutent (yutent@doui.cc)
 * @date    2018-08-03 17:54:36
 */

'use strict'

require('es.shim')
require('./tray')

const fs = require('iofs')
const path = require('path')

const HOME = path.resolve(process.env.HOME, '.memoink')
const PLUGIN_DIR = path.resolve(HOME, 'plugins')
const ATTACH_DIR = path.resolve(HOME, 'attaches')
const BACKUP_DIR = path.resolve(HOME, 'backup')
global.memoink = { path: { HOME, PLUGIN_DIR, ATTACH_DIR, BACKUP_DIR } }

if (!fs.isdir(HOME)) {
  fs.mkdir(HOME)
  fs.mkdir(PLUGIN_DIR)
  fs.mkdir(ATTACH_DIR)
  fs.mkdir(BACKUP_DIR)
  fs.cp('./memo.ink', path.join(HOME, 'memo.ink'))
}

// 平台版本
let platform = process.platform.toLowerCase()
switch (platform) {
  case 'linux':
    platform = 'Linux'
    break
  case 'win32':
    platform = 'Windows'
    break
  case 'darwin':
    platform = 'MacOS'
    break
  default:
    platform = 'Others'
}

nw.Window.open(
  './index-theme-macos.html',
  {
    width: 1200,
    height: 700,
    min_width: 1024,
    min_height: 600,
    frame: false,
    transparent: platform === 'MacOS',
    show_in_taskbar: false
  },
  win => {
    // require('./core/main.js')
    try {
      win.evalNWBin(null, './core/libcore.so')
    } catch (err) {
      alert(err)
    }

    global.App.platform = platform

    let Qiniu = require('./plugins/qiniu')
    let Transfer = require('./plugins/transfer')

    let setting = global.App.loadInit()

    // 加载七牛插件配置
    if (!setting.PLUGINS[Qiniu.uuid]) {
      setting.PLUGINS[Qiniu.uuid] = {}
    }
    for (let it of Qiniu.fields) {
      if (it.type === 'button') {
        if (Qiniu[it.action]) {
          global.App.EVENTS[Qiniu.uuid + '_' + it.action] = Qiniu[it.action]
        }
      } else {
        if (!setting.PLUGINS[Qiniu.uuid].hasOwnProperty(it.key)) {
          setting.PLUGINS[Qiniu.uuid][it.key] = it.value
        }
      }
    }

    if (Qiniu.onAttachAdd) {
      global.App.EVENTS.onAttachAdd.push(Qiniu.onAttachAdd)
    }
    if (Qiniu.onBackup) {
      global.App.EVENTS.onBackup.push(Qiniu.onBackup)
    }

    // 加载旧数据迁移配置
    if (!setting.PLUGINS[Transfer.uuid]) {
      setting.PLUGINS[Transfer.uuid] = {}
    }

    for (let it of Transfer.fields) {
      if (it.type === 'button') {
        if (Transfer[it.action]) {
          global.App.EVENTS[Transfer.uuid + '_' + it.action] =
            Transfer[it.action]
        }
      } else {
        if (!setting.PLUGINS[Transfer.uuid].hasOwnProperty(it.key)) {
          setting.PLUGINS[Transfer.uuid][it.key] = it.value
        }
      }
    }

    global.App.loadInit(setting)
    win.window.__ENV_LANG__ = setting.LANG
  }
)
