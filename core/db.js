/**
 *
 * @authors yutent (yutent@doui.cc)
 * @date    2018-08-06 15:55:54
 */

'use strict'
const sqlite3 = require('sqlite3').verbose()

class Sqlite {
  constructor(db) {
    this.db = new sqlite3.Database(db)
  }

  query(sql, ...param) {
    let defer = Promise.defer()
    param.unshift(sql)
    param.push(err => {
      if (err) {
        return defer.reject(err)
      }
      defer.resolve(true)
    })
    this.db.run.apply(this.db, param)
    return defer.promise
  }

  getAll(sql, ...param) {
    let defer = Promise.defer()
    param.unshift(sql)
    param.push((err, row) => {
      if (err) {
        return defer.reject(err)
      }
      defer.resolve(JSON.parse(JSON.stringify(row)))
    })
    this.db.all.apply(this.db, param)
    return defer.promise
  }

  get(sql, ...param) {
    let defer = Promise.defer()
    param.unshift(sql)
    param.push((err, row) => {
      if (err) {
        return defer.reject(err)
      }
      defer.resolve(row)
    })
    this.db.get.apply(this.db, param)
    return defer.promise
  }
}

module.exports = Sqlite
