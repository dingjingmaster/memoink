/**
 *
 * @authors yutent (yutent@doui.cc)
 * @date    2018-08-16 17:56:33
 */

'use strict'
module.exports = {
  uuid: 'Transfer',
  name: '旧版数据迁移',
  version: 'v1.0.0',
  author: 'official',
  fields: [
    {
      key: 'BUTTON',
      value: '',
      label: '一键迁移',
      type: 'button',
      action: 'transfer'
    },
    {
      key: 'BUTTON',
      value: '',
      label: '修正远程数据',
      type: 'button',
      action: 'revise'
    }
  ],
  transfer() {
    let App = global.App
    App.getOldData().then(({ book, note }) => {
      for (let it of book) {
        App.save('book', { uuid: it.id, name: it.name }).catch(err =>
          App.println(err)
        )
      }

      for (let it of note) {
        let { id: uuid, title, topic: subject, content, book } = it
        let summary = this.getSummary(content)
        App.save('note', {
          uuid,
          title,
          subject,
          content,
          book,
          summary
        }).catch(err => App.println(err))
      }
      this.layer.alert(this.lang.TRANFER_COMPLETE, () => {
        this.close()
      })
    })
  },
  revise() {
    let fs = require('iofs')
    let path = require('path')
    let App = global.App
    let { ATTACH_DIR } = global.memoink.path
    let { qiniu } = this.setting
    let qn = new this.Qiniu(qiniu.ACCESS_KEY, qiniu.SECRET_KEY, qiniu.REGION)

    if (!qn.ak || !qn.sk) {
      return this.layer.alert(this.lang.QINIU_CONFIG_ERROR)
    }
    App.notes()
      .then(list => {
        return list.map(it => it.uuid)
      })
      .then(async list => {
        let arr = []
        for (let uuid of list) {
          let doc = await App.note(uuid)
          let matches = doc.content.match(/app:\/\/([^\)]*)/g)
          if (matches) {
            App.update('note', uuid, {
              attaches: JSON.stringify(matches)
            }).catch(err => {
              App.println(err)
            })
            matches = matches.map(it => {
              return it.slice(6)
            })
            arr = arr.concat(matches)
          }
        }
        return arr
      })
      .then(async list => {
        let load = this.layer.load(1)
        for (let it of list) {
          if (!fs.exists(path.join(ATTACH_DIR, it))) {
            await qn.download('http://' + qiniu.DOMAIN, it)
          }
        }
        this.layer.close(load)
        this.layer.alert(this.lang.REVISE_COMPLETE)
      })
  }
}
