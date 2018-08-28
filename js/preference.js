/**
 *
 * @authors yutent (yutent@doui.cc)
 * @date    2018-08-06 00:58:04
 */

'use strict'
import '/lib/anot.next.js'
import '/lib/marked/index.js'
import '/lib/form/index.js'
import '/lib/request/index.js'
import '/lib/layer/index.js'
import Qiniu from '/lib/qiniu.js'

import { preventLinkClick, load } from './utils.js'

const fs = require('iofs')
const path = require('path')

const log = console.log
const win = nw.Window.get()

preventLinkClick(win)

global.console = console
const App = global.App
const { PLUGIN_DIR, BACKUP_DIR } = global.memoink.path

const files = fs.ls(PLUGIN_DIR)
let setting = Anot.deepCopy(App.init)
let plugins = []

const innerPlugins = fs.ls('./plugins')
const userPlugins = fs.ls(PLUGIN_DIR)

for (let it of innerPlugins) {
  let tmp = load(it)
  let { uuid, name, version, fields } = tmp
  plugins.push({ uuid, name, version, fields })
}

for (let it of userPlugins) {
  let tmp = load(it)
  let { uuid, name, version, fields } = tmp
  plugins.push({ uuid, name, version, fields })
}

const lang = load('./js/lang/' + setting.LANG)

// summary是用于全文搜索
const getSummary = txt => {
  return marked(txt)
    .replace(/\n+/g, '')
    .replace(/\s+/g, ' ')
    .replace(/<[\/]?([a-z0-9\-])*[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/<[\/]?([a-z0-9\-])*[^>]*>/g, '')
}

Anot({
  $id: 'preference',
  state: {
    winFocus: true,
    nav: 'general',
    docTitle: lang.PREFERENCE.TITLE,
    lang,
    setting,
    plugins,
    pluginID: '',
    version: 'v1.0.0'
  },
  skip: ['lang'],
  watch: {
    'setting.MARKDOWN_THEME': function(val) {
      opener.Anot.vmodels.app.MARKDOWN_THEME = val
    },
    'setting.INDENT': function(val) {
      opener.Anot.vmodels.app.INDENT = val
    },
    'setting.CLOSE_2_HIDE': function(val) {
      opener.Anot.vmodels.app.CLOSE_2_HIDE = val
    },
    'setting.DARK_MODE': function(val) {
      opener.Anot.vmodels.app.DARK_MODE = val
    },
    'setting.READONLY': function(val) {
      opener.Anot.vmodels.app.READONLY = val
    }
  },
  mounted() {},
  methods: {
    toggleNav(ev) {
      let target = ev.target
      if (target.tagName === 'NAV') {
        return
      }
      if (target.tagName !== 'A') {
        target = target.parentNode
      }
      this.nav = target.dataset.nav
      this.pluginID = ''
    },
    quit() {
      opener.preferenceOpen = false
      this.savePluginSetting()
      win.close()
    },
    pluginSelect(ev) {
      // log(ev.target)
      if (!ev.target.files.length) {
        return
      }
      // log(ev.target.value, ev.target.files[0])
      let file = ev.target.files[0]

      // fs.cp(file.path, path.resolve(global.memoink.path.PLUGIN_DIR, file.name))
      ev.target.value = ''
      const Qiniu = require(file.path)

      // log(Qiniu)
      Qiniu.__install__()
    },
    parseField(uuid, field) {
      switch (field.type) {
        case 'button':
          return `
            <span class="label"></span>
            <span 
              class="do-ui-button medium grey" 
              :click="pluginActionHandle('${uuid}', '${field.action}')">
              ${field.label}
            </span>`
        case 'input':
          return `
            <span class="label">${field.label} :</span>
            <input class="do-ui-input" :duplex="setting.PLUGINS.${uuid}.${
            field.key
          }" />`
        case 'radio':
          return `
            <span class="label">${field.label} :</span>
            ${field.option
              .map(it => {
                return `<label class="do-ui-radio">
                <input type="radio" :duplex-string="setting.PLUGINS.${uuid}.${
                  field.key
                }" value="${it.key}" />${it.value}
              </label>`
              })
              .join('')}
          `
        case 'switch':
          return `
            <span class="label">${field.label} :</span>
            <anot-switch :value="setting.PLUGINS.${uuid}.${
            field.key
          }"></anot-switch>
          `
        case 'file':
          return `
            <span class="label">${field.label} :</span>
            <input 
              class="do-ui-input"
              type="file"
              nwworkingdir="${BACKUP_DIR}"
              :duplex="setting.PLUGINS.${uuid}.${field.key}" />`
        case 'select':
          return `
            <span class="label">${field.label} :</span>
            <label class="do-ui-select">
              <select :duplex="setting.PLUGINS.${uuid}.${field.key}">
                ${field.option
                  .map(it => {
                    return `<option value="${it.key}">${it.value}</option>`
                  })
                  .join('')}
              </select>
              <span class="trigon">
                <i class="do-icon-trigon-up"></i>
                <i class="do-icon-trigon-down"></i>
              </span>
            </label>
          `
        default:
          return ''
      }
    },
    showPluginSetting(it) {
      this.pluginID = it.uuid
    },

    closePluginSetting() {
      this.pluginID = ''
    },
    pluginActionHandle(uuid, action) {
      global.App.EVENTS[uuid + '_' + action].call({
        request,
        getSummary,
        Qiniu,
        layer,
        lang,
        close() {
          win.close()
          opener.close()
        },
        setting: this.setting.PLUGINS.$model
      })
    },
    savePluginSetting() {
      let setting = this.setting.$model
      App.loadInit(setting)
      this.closePluginSetting()
    }
  }
})
