if (process.browser) {
  global.Buffer = require('buffer').Buffer
}
var mega = require('mega')
var reactive = require('reactive')
var Emitter = require('emitter')
var $ = require('jquery-browserify')
var storage
var data = {}
Emitter(data)

function update(val) {
  for (var key in val) {
    data[key] = val[key]
    data.emit('change ' + key, val[key])
  }
}

function login(email, password) {
  var opt = {}
  if (email) {
    opt.email = email
    opt.password = password
  }
  storage = mega(opt, function(err) {
    if (err) {
      return update({storage_error: err.message})
    }
    update({storage_error: false, files: storage.mounts})
  })
  storage.on('update', function(f) {
    f.emit('change name', f.name)
  })
  storage.on('add', function(f) {
    f.parent.emit('change children', f.parent.children)
  })
  storage.on('delete', function(f) {
    f.parent.emit('change children', f.parent.children)
  })
  storage.on('move', function(f, from) {
    from.emit('change children', from.children)
    f.parent.emit('change children', f.parent.children)
  })

}

function typeToString(type) {
  return ({
    0: 'File',
    1: 'Dir',
    2: 'Root',
    3: 'Inbox',
    4: 'Trash'
  })[type]
}

function emptyIfUndefined(val) {
  return val ? val : ''
}

function renderFile(file, el) {
  var tmpl = el.cloneNode(true)
  reactive(el, file, {typeToString: typeToString, emptyIfUndefined: emptyIfUndefined})
  file.on('change children', function(children) {
    if (children) {
      var c = $(el).find('.children')
      c.empty()
      for (var i = 0; i < children.length; i++) {
        c.append(renderFile(children[i], tmpl.cloneNode(true)))
      }
    }
  })
  file.emit('change children', file.children)
  return el
}

data.on('change url', function(url) {
  try {
    mega.file(url).loadAttributes(function(err, file) {
      if (err) {
        return update({url_error: err.message})
      }
      update({
        url_error: false,
        name: file.name,
        size: file.size
      })
    })
  } catch (err) {
    update({url_error: err})
  }
})

data.on('change files', function(files) {
  var tmpl = $('.file-list .item')[0]
  $('.file-list').empty()
  for (var i = 0; i < files.length; i++) {
    $('.file-list').append(renderFile(files[i], tmpl.cloneNode(true)))
  }
})

data.on('change url_error', function(error) {
  update({url_success: !error})
})
data.on('change storage_error', function(error) {
  update({storage_success: !error})
})


$(function() {
  reactive(document.body, data, {
    urlchange: function(e) {
      update({url: e.target.value})
    },
    login: function(e) {
      login($('#email').val(), $('#password').val())
    },
    typeToString: typeToString,
    emptyIfUndefined: emptyIfUndefined
  })

})