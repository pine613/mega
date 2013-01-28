var request = require('request')
var through = require('through')
var pipeline = require('stream-combiner')
var crypto = require('./crypto')
var util = require('./util')

function mega(email, pass, cb) {

}

mega.file = function(opt) {
  return new File(opt)
}

mega.encrypt = function(key) {
  key = crypto.formatKey(key)

  if (!key) {
    key = require('crypto').randomBytes(24)
  }

  var stream = through(write, end)

  if (key.length != 24) {
    return process.nextTick(function() {
      stream.emit('error', new Error('Wrong key length. Key must be 192bit.'))
    })
  }

  var aes = new crypto.AES(key.slice(0, 16))

  var ul_macs = {}
  var pos = 0
  function write(d) {
    ul_macs[pos] = aes.encrypt_ctr_mac(d, [key.readInt32BE(16), key.readInt32BE(20)], pos)
    pos += d.length
    this.emit('data', d)
  }

  function end() {
    var mac = aes.condenseMacs(ul_macs)

    var newkey = new Buffer(32)
    key.copy(newkey)
    newkey.writeInt32BE(mac[0]^mac[1], 24)
    newkey.writeInt32BE(mac[2]^mac[3], 28)
    for (var i = 0; i < 16; i++) {
      newkey[i] = newkey[i] ^ newkey[16 + i]
    }
    stream.key = newkey
    this.emit('end')
  }

  return stream = pipeline(util.resizeChunks(), stream)
}

mega.decrypt = function(key) {
  key = crypto.formatKey(key)

  var aes = File.prototype._getCipher(key)

  var stream = through(write, end)

  var dl_macs = {}
  var pos = 0
  function write(d) {
    dl_macs[pos] = aes.decrypt_ctr_mac(d, [key.readInt32BE(16), key.readInt32BE(20)], pos)
    pos += d.length
    this.emit('data', d)
  }

  function end() {
    var mac = aes.condenseMacs(dl_macs)
    if ((mac[0]^mac[1]) != key.readInt32BE(24) || (mac[2]^mac[3]) != key.readInt32BE(28)) {
      return this.emit('error', new Error('MAC verification failed'))
    }
    this.emit('end')
  }

  return pipeline(util.resizeChunks(), stream)
}

function File(opt) {
  // todo: parse url
  this.downloadId = opt.downloadId
  this.nodeId = opt.nodeId
  this.key = crypto.formatKey(opt.key)
  this.name = opt.name
  this.size = opt.size
}

File.prototype._getCipher = function(bigkey) {
  // 256 -> 128
  var key = new Buffer(16)
  for (var i = 0; i < 16; i++) {
    key[i] = bigkey[i] ^ bigkey[16 + i]
  }
  return new crypto.AES(key)
}

File.prototype.loadAttributes = function(cb) {
  var req = {a: 'g', p: this.downloadId} // todo: nodeId version ('n')
  var self = this
  util.cs(req, function(err, response) {
    if (err) return cb(err)

    self.size = response.s

    var at = new Buffer(crypto.base64Clean(response.at), 'base64')
    self._getCipher(this.key).decrypt_cbc(at)

    // remove empty bytes from end
    var end = at.length
    while (!at[end - 1]) end--

    at = at.slice(0, end).toString()

    if (at.substr(0,6) != 'MEGA{"') {
      return cb(new Error('incorrect response'))
    }

    try {
      at = JSON.parse(at.substring(4));
    } catch (e) {
      return cb(new Error('malformed attributes'))
    }

    self.attributes = at
    self.name = at.n

    cb(null, self)

  })
}

File.prototype.download = function(cb) {
  var req = {a: 'g', g: 1}
  if (this.nodeId) {
    req.n = this.nodeId
  }
  else {
    req.p = this.downloadId
  }

  var stream = mega.decrypt(this.key)

  util.cs(req, function(err, response) {
    if (err) return stream.emit('error', err)

    console.log(response.g)
    request(response.g).pipe(stream)
  })

  cb && util.stream2cb(stream, cb)
  return stream
}




module.exports = mega