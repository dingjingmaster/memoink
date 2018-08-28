/**
 *
 * @authors yutent (yutent@doui.cc)
 * @date    2018-08-06 15:03:30
 */

'use strict'
module.exports = {
  uuid: 'qiniu',
  name: '七牛云储存(还不能用)',
  version: 'v1.0.0',
  author: 'official',
  fields: [
    {
      key: 'AUTO_BACKUP',
      value: false,
      label: '自动备份',
      type: 'switch'
    },
    {
      key: 'ACCESS_KEY',
      value: '',
      label: 'Access Key',
      type: 'input'
    },
    {
      key: 'SECRET_KEY',
      value: '',
      label: 'Secret Key',
      type: 'input'
    },
    {
      key: 'DOMAIN',
      value: '',
      label: '正式域名',
      type: 'input'
    },
    {
      key: 'REGION',
      value: 'z0',
      label: '储存区域',
      type: 'radio',
      option: [
        { key: 'z0', value: '华东' },
        { key: 'z1', value: '华北' },
        { key: 'z2', value: '华南' },
        { key: 'na0', value: '北美' }
      ]
    },
    {
      key: 'RESTORE',
      value: '',
      label: '选择要恢复的备份',
      type: 'file'
    },
    {
      key: 'BUTTON',
      value: '',
      label: '恢复选中',
      type: 'button',
      action: 'restore'
    },
    {
      key: 'BUTTON',
      value: '',
      label: '下载最近10个备份',
      type: 'button',
      action: 'syncCache'
    }
  ],
  restore() {},
  syncCache() {
    let fs = require('iofs')
    let path = require('path')
    let App = global.App
    let { BACKUP_DIR } = global.memoink.path
    let { qiniu } = this.setting
    let qn = new this.Qiniu(qiniu.ACCESS_KEY, qiniu.SECRET_KEY, qiniu.REGION)

    let load = this.layer.load(1)
    qn
      .listFiles('backup-')
      .then(list => {
        return list.slice(-10)
      })
      .then(async list => {
        for (let it of list) {
          if (!fs.exists(path.join(BACKUP_DIR, it))) {
            await qn.download('http://' + qiniu.DOMAIN, it, 'BACKUP_DIR')
          }
        }
        this.layer.close(load)
        this.layer.alert(this.lang.DOWNLOAD_COMPLETE)
      })
  }
}
