/**
 *
 * @authors yutent (yutent@doui.cc)
 * @date    2018-08-16 20:27:03
 */

'use strict'

import '/lib/request/index.js'

const sec = require('crypto.js')
const path = require('path')
const fs = require('iofs')
const http = require('http')

const API_URL = [
  'http://rs.qiniu.com',
  'http://api.qiniu.com',
  'http://rsf.qbox.me'
]
const UP_URL = {
  z0: 'http://upload.qiniu.com',
  z1: 'http://upload-z1.qiniu.com',
  z2: 'http://upload-z2.qiniu.com',
  na0: 'http://upload-na0.qiniu.com'
}

class Qiniu {
  constructor(ak, sk, region) {
    this.ak = ak
    this.sk = sk
    this.region = region || 'z0'
    this.url = UP_URL[this.region]
  }

  base64(str) {
    return sec
      .base64encode(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
  }

  sign(str) {
    return sec
      .hmac('sha1', str, this.sk, 'base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
  }

  token(path = '', body = '') {
    path += '\n'
    if (body) {
      path += body
    }
    let sign = this.sign(path)
    return `QBox ${this.ak}:${sign}`
  }

  uptoken(prefix = '', file) {
    let info = {
      scope: `memoink:${prefix + file}`,
      deadline: Math.round(Date.now() / 1000) + 3600
    }
    info = this.base64(JSON.stringify(info))

    let sign = this.sign(info)
    return { token: `${this.ak}:${sign}:${info}`, key: prefix + file }
  }

  mkBucket() {
    let name = this.base64('memoink')
    let path = `/mkbucketv2/${name}/region/${this.region}`
    let auth = this.token(path)

    request
      .post(API_URL[0] + path)
      .set('Authorization', auth)
      .then(res => {
        return true
      })
  }

  getDomain() {
    let path = `/v6/domain/list?tbl=memoink`
    let auth = this.token(path)

    return request
      .post(API_URL[1] + path)
      .set('Authorization', auth)
      .then(res => {
        return res.body.pop()
      })
  }

  /**
   * [listFiles 资源列举]
   * @param  {String} prefix [指定前缀]
   * @param  {String} mark   [上一次列举返回的位置标记，作为本次列举的起点信息。]
   */
  listFiles(prefix = '', mark = '', limit = 1000) {
    let path = `/list?bucket=memoink&prefix=${prefix}&marker=${mark}&limit=${limit}`
    let auth = this.token(path)

    return request
      .post(API_URL[2] + path)
      .set('Authorization', auth)
      .then(res => {
        res.body.items = res.body.items.map(it => it.key)
        return res.body.items
      })
  }

  download(url, file, target = 'ATTACH_DIR') {
    url += `/${file}?e=${Math.round(Date.now() / 1000) + 3600}`

    let sign = this.sign(url)
    let filePath = path.join(global.memoink.path[target], file)
    let ws
    let defer = Promise.defer()

    let dir = path.parse(filePath).dir

    if (!fs.exists(dir)) {
      fs.mkdir(dir)
    }
    ws = fs.origin.createWriteStream(filePath)

    url += `&token=${this.ak}:${sign}`

    http.get(url, res => {
      res
        .on('data', d => {
          ws.write(d)
        })
        .on('end', err => {
          ws.end()
          defer.resolve(filePath)
        })
    })
    return defer.promise
  }

  /*upload(file, prefix, env = 'db') {
    let data = this.uptoken(
      prefix,
      env === 'db' ? `${new Date().format('Y-m-d')}.ink` : file
    )

    let format = new File([fs.cat(path.join(global.env[env], file))], file)
    request
      .post(this.url)
      .field('file', format)
      .field('token', data.token)
      .field('key', data.key)
      .then(res => {
        return true
      })
  }*/
}

export default Qiniu
