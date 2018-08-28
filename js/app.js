/**
 *
 * @authors yutent (yutent@doui.cc)
 * @date    2018-08-05 01:14:35
 */

'use strict'

import '/lib/anot.next.js'
import '/lib/marked/index.js'
import '/lib/prism/index.js'
import '/lib/meditor/index.js'
import '/lib/request/index.js'
import Qiniu from '/lib/qiniu.js'
import Attach from '/lib/meditor/addon/attach-native.js'
import { preventLinkClick, load } from './utils.js'

const fs = require('iofs')
const path = require('path')

const log = console.log
const win = nw.Window.get()
const $doc = Anot(document)

preventLinkClick(win)
win.setShadow(false)

const App = global.App
const { PLUGIN_DIR, ATTACH_DIR } = global.memoink.path

/*****************************************************************/
/*              处理插件的配置及回调事件  start                      */
/*****************************************************************/
const files = fs.ls(PLUGIN_DIR)
let setting = App.init

for (let it of files) {
  let tmp = load(it)
  // 未加载过时,初始化配置
  if (!setting.PLUGINS[tmp.uuid]) {
    setting.PLUGINS[tmp.uuid] = {}
  }

  for (let it of tmp.fields) {
    if (it.type === 'button') {
      if (tmp[it.action]) {
        global.App.EVENTS[tmp.uuid + '_' + it.action] = tmp[it.action]
      }
    } else {
      if (!setting.PLUGINS[tmp.uuid].hasOwnProperty(it.key)) {
        setting.PLUGINS[tmp.uuid][it.key] = it.value
      }
    }
  }

  if (tmp.onNoteChange) {
    global.App.EVENTS.onNoteChange.push(tmp.onNoteChange)
  }
  if (tmp.onBookChange) {
    global.App.EVENTS.onBookChange.push(tmp.onBookChange)
  }
  if (tmp.onAttachAdd) {
    global.App.EVENTS.onAttachAdd.push(tmp.onAttachAdd)
  }
  if (tmp.onBackup) {
    global.App.EVENTS.onBackup.push(tmp.onBackup)
  }
}

/*****************************************************************/
/*                 处理插件的配置及回调事件  end                     */
/*****************************************************************/

// 经过上面的加载之后, 配置信息要更新
setting = Anot.deepCopy(App.loadInit(setting))
const lang = load('./js/lang/' + setting.LANG)

marked.setOptions({
  highlight: function(code, lang) {
    return Prism.highlight(code, Prism.languages[lang])
  }
})

let isMacOS = App.platform === 'MacOS'

window.qn = new Qiniu(
  setting.PLUGINS.qiniu.ACCESS_KEY,
  setting.PLUGINS.qiniu.SECRET_KEY,
  setting.PLUGINS.qiniu.REGION
)

Anot({
  $id: 'app',
  state: {
    nav: 'total',
    docTitle: lang.MEMOINK,
    winFocus: true,
    layout: 0,
    __book__: {}, // 字典
    __note__: {}, // 字典
    bookList: [],
    noteList: [],
    subjectList: [],
    subjectFilter: '-',
    searchTxt: '',
    stat: {
      total: 0,
      star: 0,
      trash: 0
    },
    note: {
      uuid: '',
      title: '',
      book: '',
      subject: '',
      content: '',
      attaches: ''
    },
    noteHtml: '',
    lang,
    editMode: false,
    listStyle: 1, // 列表样式 1: icon, 0: list
    toolbar: [
      'h1',
      'quote',
      '|',
      'bold',
      'italic',
      'through',
      '|',
      'unordered',
      'ordered',
      '|',
      'hr',
      'link',
      '|',
      'table',
      'image',
      'attach',
      'inlinecode',
      'blockcode',
      '|',
      'about'
    ],
    MARKDOWN_THEME: setting.MARKDOWN_THEME || 'default',
    AUTO_SAVE: setting.AUTO_SAVE,
    INDENT: setting.INDENT,
    CLOSE_2_HIDE: setting.CLOSE_2_HIDE,
    DARK_MODE: setting.DARK_MODE,
    READONLY: setting.READONLY,
    timer: null // 即时保存定时器
  },

  skip: ['lang', 'isNewNote'],
  mounted() {
    win
      .on('focus', () => {
        this.winFocus = true
        win.setShadow(true)
      })
      .on('blur', () => {
        this.winFocus = false
      })

    this.appReady()

    $doc.bind('keydown', ev => {
      log(ev.keyCode)
      switch (ev.keyCode) {
        case 78: // key N
          if (isMacOS ? ev.metaKey : ev.ctrlKey) {
            ev.preventDefault()
            this.newNote()
          }
        case 83: // key S
          if (isMacOS ? ev.metaKey : ev.ctrlKey) {
            ev.preventDefault()
            this.saveNote()
          }
          break
        case 81: // key Q
          if (isMacOS ? ev.metaKey : ev.ctrlKey) {
            ev.preventDefault()
            this.quit(true)
          }
          break
        case 87: // key W
          if (isMacOS ? ev.metaKey : ev.ctrlKey) {
            ev.preventDefault()
            this.quit()
          }
          break
        case 188: //key ,
          if (isMacOS ? ev.metaKey : ev.ctrlKey) {
            ev.preventDefault()
            this.openPreference()
          }
          break
        default:
          break
      }
    })

    // Anot(this.$refs.note).bind('dblclick', ev => {

    //   log(ev.target)
    // })
  },
  watch: {
    'note.title'(val) {
      this.docTitle = val
    },
    editMode(val) {
      if (val && setting.AUTO_SAVE) {
        this.autoSave()
      } else {
        clearTimeout(this.timer)
      }
    }
  },
  computed: {},
  methods: {
    quit(force) {
      if (this.CLOSE_2_HIDE && !force) {
        win.hide()
      } else {
        win.close()
      }
    },
    minimize() {
      win.minimize()
    },
    maximize() {
      win.toggleFullscreen()
    },
    appReady() {
      this.bookList.clear()
      this.noteList.clear()
      let book = this.nav

      App.books().then(list => {
        this.bookList.pushArray(list)
        for (let it of this.bookList) {
          this.__book__[it.uuid] = it
        }
      })

      let result = null

      // 星标笔记
      if (book === 'star') {
        result = App.stars()
        // 回收站
      } else if (book === 'trash') {
        result = App.trash()
      } else {
        if (book === 'total') {
          book = null
        }
        result = App.notes(book)
      }

      result.then(list => {
        this.noteList.pushArray(list)
        for (let it of this.noteList) {
          this.__note__[it.uuid] = it
          this.subjectList.ensure(it.subject)
        }
      })
      App.stat().then(stat => {
        for (let i in stat) {
          this.stat[i] = stat[i]
        }
      })
    },
    editorReady(ME) {
      Attach.__init__(ME)
    },
    toggleLayout() {
      this.layout = this.layout ^ 1
    },
    openPreference() {
      if (window.preferenceOpen) {
        return
      }
      window.preferenceOpen = true
      nw.Window.open(
        '/preference.html',
        {
          width: 768,
          height: 512,
          min_width: 768,
          min_height: 512,
          frame: false,
          resizable: false,
          always_on_top: true,
          show_in_taskbar: false
        },
        w => {
          w.window.__ENV_LANG__ = setting.LANG
        }
      )
    },
    changeListStyle(id) {
      this.listStyle = id
    },
    bookFormat(it) {
      let book = this.__book__[it.book]
      return book && book.name
    },
    noteVisible(it) {
      if (this.subjectFilter === '-') {
        return true
      } else {
        return this.subjectFilter === it.subject
      }
    },
    // 同时兼顾查看笔记列表功能
    changeNav(target) {
      if (this.nav === target) {
        return
      }
      this.nav = target
      this.noteHtml = ''
      this.editMode = false

      for (let i in this.note.$model) {
        this.note[i] = ''
      }

      this.noteList.clear()
      let result = null

      // 星标笔记
      if (target === 'star') {
        result = App.stars()
        // 回收站
      } else if (target === 'trash') {
        result = App.trash()
      } else {
        if (target === 'total') {
          target = null
        }
        result = App.notes(target)
      }

      result.then(list => {
        this.noteList.pushArray(list)

        this.subjectList.clear()
        for (let it of this.noteList) {
          this.__note__[it.uuid] = it
          this.subjectList.ensure(it.subject)
        }

        if ([null, 'star', 'trash'].includes(target)) {
          this.stat[target || 'total'] = list.length
        } else {
          this.__book__[target].total = list.length
        }
      })
    },
    search(ev) {
      if (ev.keyCode === 13) {
        let txt = this.searchTxt.trim()
        if (txt) {
          this.noteList.clear()
          App.search(txt).then(list => {
            if (list.length) {
              this.noteList.pushArray(list)
              this.subjectList.clear()
              for (let it of this.noteList) {
                this.__note__[it.uuid] = it
                this.subjectList.ensure(it.subject)
              }
            } else {
              layer.toast(lang.SEARCH.NONE)
            }
          })
        }
      }
    },
    // 查看笔记的详细内容
    viewNote(item) {
      let note = item.$model

      this.docTitle = note.title
      for (let i in note) {
        this.note[i] = note[i]
      }
      this.editMode = false
      App.note(note.uuid).then(doc => {
        this.note.content = doc.content
        this.note.attaches = doc.attaches
        this.noteHtml = this.reviseCompile(marked.safe(doc.content))
      })
    },
    // 目录右键菜单
    bookMenu(item, ev) {
      ev.preventDefault()
      let that = this
      let _y = ev.pageY
      _y = _y > window.innerHeight - 86 ? _y - 86 : _y
      layer.open({
        type: 7,
        menubar: false,
        maskClose: true,
        fixed: true,
        extraClass: 'do-mod-contextmenu__fixed',
        offset: [_y, 'auto', 'auto', ev.pageX],
        shift: {
          top: _y,
          left: ev.pageX
        },
        content: `<ul class="do-mod-contextmenu" :click="onClick">
          <li data-key="del"><i class="do-icon-trash"></i>${
            lang.BOOK.DELETE
          }</li>
          <li data-key="edit"><i class="do-icon-edit"></i>${
            lang.BOOK.RENAME
          }</li>
        </ul>`,
        onClick(ev) {
          if (ev.currentTarget === ev.target) {
            return
          }
          let target = ev.target
          let act = null
          if (target.nodeName === 'I') {
            target = target.parentNode
          }
          act = target.dataset.key
          this.close()
          if (act === 'del') {
            // 默认目录不允许删除
            if (item.uuid === 'defaults') {
              return layer.toast(lang.BOOK.FORBIDDEN, 'error')
            }
            layer.confirm(lang.BOOK.CONFIRM + ` (${item.name}) ?`, function() {
              App.notes(item.uuid).then(list => {
                if (list.length) {
                  layer.toast(lang.BOOK.NOT_EMPTY, 'error')
                } else {
                  App.delete('book', item.uuid).then(res => {
                    that.bookList.remove(item)
                    delete that.__book__[item.uuid]
                    this.close()
                  })
                }
              })
            })
          } else {
            layer.prompt(lang.BOOK.RENAME + ` (${item.name})`, (name, id) => {
              App.update('book', item.uuid, { name }).then(res => {
                layer.close(id)
                item.name = name
              })
            })
          }
        }
      })
    },
    // 笔记右键菜单
    noteMenu(item, ev) {
      ev.preventDefault()
      let that = this
      let _y = ev.pageY
      _y = _y > window.innerHeight - 191 ? _y - 191 : _y
      layer.open({
        type: 7,
        menubar: false,
        maskClose: true,
        fixed: true,
        extraClass: 'do-mod-contextmenu__fixed',
        offset: [_y, 'auto', 'auto', ev.pageX],
        shift: {
          top: _y,
          left: ev.pageX
        },
        content: `<ul class="do-mod-contextmenu" :click="onClick">
          <li data-key="del"><i class="do-icon-trash"></i>${
            this.nav === 'trash' ? lang.NOTE.DELETE : lang.NOTE.MOVE_2_TRASH
          }</li>
          ${
            this.nav === 'trash'
              ? `<li data-key="restore"><i class="do-icon-backward"></i>${
                  lang.NOTE.RESTORE
                }</li>`
              : `<li data-key="star"><i class="do-icon-star"></i>${
                  item.stat > 0 ? lang.NOTE.UNSTAR : lang.NOTE.STAR
                }</li>`
          }
          ${
            this.nav === 'trash'
              ? ''
              : `
            <li data-key="edit"><i class="do-icon-edit"></i>${
              lang.NOTE.EDIT
            }</li>
            <li data-key="pdf"><i class="do-icon-download"></i>${
              lang.NOTE.EXPORT_PDF
            }</li>
            <li data-key="html"><i class="do-icon-download"></i>${
              lang.NOTE.EXPORT_HTML
            }</li>`
          }
          
        </ul>`,
        onClick(ev) {
          if (ev.currentTarget === ev.target) {
            return
          }
          let target = ev.target
          let act = null
          if (target.nodeName === 'I') {
            target = target.parentNode
          }
          act = target.dataset.key
          this.close()

          switch (act) {
            // 删除操作
            case 'del':
              // 从回收站中彻底删除
              if (that.nav === 'trash') {
                layer.confirm(
                  lang.NOTE.CONFIRM + ` (${item.title}) ?`,
                  function() {
                    App.delete('note', item.uuid).then(res => {
                      that.noteList.remove(item)
                      that.stat.trash--
                      delete that.__note__[item.uuid]
                      this.close()
                    })
                  }
                )
              } else {
                // 这一步的删除, 只是移入回收站, 并不是真正的删除
                App.update('note', item.uuid, { stat: -1 }).then(res => {
                  that.noteList.remove(item)
                  that.__book__[item.book].total--
                  that.stat.total--
                  that.stat.trash++
                })
              }
              break
            case 'star':
              item.stat = item.stat ^ 1
              App.update('note', item.uuid, { stat: item.stat }).then(res => {
                if (item.stat) {
                  that.stat.star++
                } else {
                  that.stat.star--
                }
              })
              break
            case 'restore':
              App.update('note', item.uuid, { stat: 0 }).then(res => {
                that.noteList.remove(item)
                that.stat.trash--
                that.stat.total++
                that.__book__[item.book].total++
              })
              break
            case 'edit':
              that.editNote(item)
              break
            case 'pdf':
            case 'html':
              that.exportToFile(act)
              break
            default:
              break
          }
        }
      })
    },
    addNewBook() {
      layer.prompt(lang.BOOK.ADD, (name, id) => {
        let book = { uuid: App.uuid, name }
        App.save('book', book).then(res => {
          layer.close(id)
          book.sort = 0
          book.total = 1
          // this.__book__[book.uuid] = book
          let note = {
            uuid: App.uuid,
            title: 'untitled note',
            book: book.uuid,
            book_name: book.name,
            subject: '',
            content: '',
            summary: ''
          }
          App.save('note', note).then(res => {
            this.bookList.push(book)
            let last = this.bookList[this.bookList.length - 1]
            this.__book__[last.uuid] = last
            this.changeNav(last.uuid)
          })
        })
      })
    },
    autoSave() {
      clearTimeout(this.timer)
      this.timer = setTimeout(() => {
        clearTimeout(this.timer)
        let note = this.note.$model
        Anot.ls(note.uuid, JSON.stringify(note))
        this.autoSave()
      }, 3000)
    },
    newNote() {
      this.noteHtml = ''
      for (let i in this.note.$model) {
        this.note[i] = ''
      }
      if (['total', 'star', 'trash'].includes(this.nav)) {
        this.note.book = 'defaults'
      } else {
        this.note.book = this.nav
      }
      this.docTitle = lang.NOTE.NEW
      this.isNewNote = true

      // 优先缓存中笔记ID, 方便找回之前上传过的附件
      this.note.uuid = Anot.ls('note-uuid') || App.uuid
      Anot.ls('note-uuid', this.note.uuid)
      let cache = Anot.ls(this.note.uuid)
      if (cache) {
        layer.confirm(
          lang.NOTE.CACHE,
          id => {
            cache = JSON.parse(cache)
            for (let i in cache) {
              this.note[i] = cache[i]
            }
            layer.close(id)
            this.editMode = true
          },
          id => {
            layer.close(id)
            this.editMode = true
          }
        )
      } else {
        this.editMode = true
      }
    },
    // 编辑笔记(只是进入编辑模式)
    editNote(item, ev) {
      if (item) {
        let note = item.$model

        for (let i in note) {
          this.note[i] = note[i]
        }
        App.note(note.uuid).then(doc => {
          this.note.content = doc.content
        })
      } else {
        // 没有uuid, 或者阅读模式, 禁用双击编辑
        if (!this.note.uuid) {
          return
        }
        if (this.READONLY) {
          if (ev.target.nodeName === 'IMG') {
            let { naturalHeight, naturalWidth } = ev.target
            let _w = naturalWidth > 1200 ? 1200 : naturalWidth
            let _h = (_w / naturalWidth) * naturalHeight
            _h = _h > 700 ? 700 : _h
            nw.Window.open(
              'preview.html',
              {
                width: _w,
                height: _h,
                always_on_top: true
              },
              w => {
                w.window.__preview__ = ev.target.src
              }
            )
          }
          return
        }
      }
      let cache = Anot.ls(this.note.uuid)
      if (cache) {
        cache = JSON.parse(cache)
        for (let i in cache) {
          this.note[i] = cache[i]
        }
      }
      this.editMode = true
    },

    saveNote() {
      let note = this.note.$model
      if (!note.title) {
        return layer.toast(lang.NOTE.EMPTY_TITLE, 'error')
      }
      if (!note.content) {
        return layer.toast(lang.NOTE.EMPTY_CONTENT, 'error')
      }
      let html = this.reviseCompile(marked.safe(note.content))

      // summary是用于全文搜索
      note.summary = html
        .replace(/\n+/g, '')
        .replace(/\s+/g, ' ')
        .replace(/<[\/]?([a-z0-9\-])*[^>]*>/g, '')
        .replace(/&lt;/g, '<')
        .replace(/<[\/]?([a-z0-9\-])*[^>]*>/g, '')

      if (this.isNewNote) {
        App.save('note', note).then(res => {
          let { uuid, title, book, subject, attaches } = note

          this.noteList.push({ uuid, title, book, subject, stat: 0, attaches })
          let last = this.noteList[this.noteList.length - 1]
          this.__note__[uuid] = last
          this.__book__[note.book].total++
          this.subjectList.ensure(subject)
          this.stat.total++
          this.isNewNote = false
          Anot.ls('note-uuid', '')
          Anot.ls(uuid, '')
          this.editMode = false
          this.noteHtml = html
        })
      } else {
        let { uuid, title, subject, book, content, summary, attaches } = note
        App.update('note', uuid, {
          title,
          subject,
          book,
          content,
          summary,
          attaches
        }).then(res => {
          this.__note__[uuid].title = title
          this.__note__[uuid].subject = subject
          this.__note__[uuid].book = book

          this.subjectList.ensure(subject)
          this.editMode = false
          this.noteHtml = html
          Anot.ls(uuid, '')
        })
      }
    },
    reviseCompile(result) {
      return result.replace(/app:\/\//g, `file://${ATTACH_DIR}/`)
    },
    saveAttach(attach, file) {
      let that = this
      let filename = path.join(this.note.uuid, attach.name)
      let savePath = path.resolve(ATTACH_DIR, filename)
      let reader = new FileReader()
      let defer = Promise.defer()
      let attaches = JSON.parse(this.note.attaches) || []

      reader.onload = function() {
        fs.echo(Buffer.from(this.result, 'binary'), savePath)
        defer.resolve('app://' + filename)
        Anot.Array.ensure(attaches, 'app://' + filename)
        that.note.attaches = JSON.stringify(attaches)
      }
      reader.readAsBinaryString(file)
      return defer.promise
    },
    getAttachList() {
      let attaches = JSON.parse(this.note.attaches) || []
      attaches = attaches.map(it => {
        return {
          name: path.parse(it).base,
          url: this.reviseCompile(it)
        }
      })
      return Promise.resolve(attaches)
    },
    exportToFile(mode) {
      let html = ''
      let css = fs.cat('./css/topdf.css')
      html = `<head><style>${css} @page { size: auto A4 portrait; margin: 0} body {width: 100%;height:100%;padding:30px 50px;}</style>
      </head>
      <body>${this.$refs.note.outerHTML}</body>
      `
      if (mode === 'pdf') {
        let elem = document.createElement('iframe')
        elem.style.display = 'none'
        elem.style.position = 'fixed'
        document.body.appendChild(elem)

        document.title = this.note.title
        elem.contentWindow.document.open()
        elem.contentWindow.document.write(html)
        elem.contentWindow.document.close()
        elem.contentWindow.print()
        document.body.removeChild(elem)
      } else {
        let a = document.createElement('a')
        let blob = new Blob([`<html>${html}</html>`], {
          type: 'text/html;charset=utf-8;'
        })
        let url = URL.createObjectURL(blob)
        a.href = url
        a.download = this.note.title + '.html'
        a.click()
      }
    }
  }
})

global.tray.on('click', ev => {
  win.show()
})
