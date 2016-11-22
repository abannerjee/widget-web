//var api = 'http://34.192.230.162:3000'
var api = 'http://localhost:3000'
var app = {
  name: 'widgetfactory',
  api: {
    widgets: api.concat('/widgets'),
    categories: api.concat('/categories'),
    subcategories: api.concat('/subcategories'),
  },
  widgets: null,
  categories: null,
  subcategories: null,
  cart: [],
  cookie: null,
}

/*
 * Functions used to add widgets to the cart
 * and initialize the cart using cookies
 */
function updateCookie() {
  var cookie = "".concat(app.name, '=', JSON.stringify(app.cart))
  document.cookie = cookie
}

function initCart() {
  // Check for existing cookie
  var exists = document.cookie.match(new RegExp(app.name + '=([^;]+)')); 
  if (!exists) {
    updateCookie()
  }
  else {
    var arr = JSON.parse(exists[1])
    arr.forEach(function(id){
      addToCart(id)
    })
  }
}

function addToCart(id) {
  // Multiples of the same widget cannot be added to the cart
  if (_.includes(app.cart, id) == 0) {
    var widget = _.find(app.widgets, {w_id: id})
    app.cart.push(id)

    // Add a widget entry to the cart
    var entry = '<li w_id="' + id + '" class="list-group-item">' + widget.w_name
    var selects = ""

    // Add selector for each widget property
    var w_props = Object.keys(widget)
    var allprops = _.uniq(_.map(app.subcategories, 'p_category'))
    var iterprops = _.intersection(w_props, allprops)

    // For each property in the widget, add a select option
    _.each(iterprops, function(subname){
      var select = '<select w_id="' + widget.w_id + '" style="margin-left:20px">'

      _.each(widget[subname], function(name){
        var query = {p_name: name, p_category: subname}
        var sublookup = _.find(app.subcategories, query)

        select += '\
          <option value="' + sublookup.p_id + '">' +
            sublookup.p_name + '</option>'
      })

      select += '</select>'
      selects += select
    })

    // Add btn to remove cart
    var removeBtn = '\
        <button type="button" class="close" aria-hidden="true" \
          onclick=removeFromCart(' + id + ')>x\
        </button>\
      </li>\
    '
    $('#cart-list').append("".concat(entry, selects, removeBtn))

    // Update cart total
    $('#cart-total span').text(app.cart.length)
    $('#cart-badge').text(app.cart.length)
    updateCookie()
  }
}

function removeFromCart(id) {
  // Remove from cart modal and header
  _.pull(app.cart, id)
  $('.list-group-item[w_id="' + id + '"]').detach()

  // Update cart total
  $('#cart-total span').text(app.cart.length)
  $('#cart-badge').text(app.cart.length)
  updateCookie()
}


/*
 * Functions used to filter/retrieve widget info
 */
function submitFilter() {
  // Format query string
  var qs = "?"
  $('.checkbox :checked').each(function(){
    qs += $(this).attr('category') + '=' + $(this).attr('value') + "&"
  })

  $.getJSON(app.api.widgets.concat(qs), {}, function(data, textStatus, jqXHR){
    app.widgets = data || []
  }).then(function(){
    updateWidgets()
  })
}

// Updates the filter side bar with type and property options
function updateFilterSidebar() {
  $('#filters').empty()

  // Types
  $('#filters').append('<br><label>TYPE</label>')
  app.categories.forEach(function(cat){
    $('#filters').append('\
      <div class="checkbox">\
        <label>\
          <input type="checkbox" value="' +
          cat.p_name + '" category="' +
          cat.p_category + '">' +
          cat.p_name +
        '</label>\
      </div>\
    ')
  })

  // All other properties
  grouped = _.groupBy(app.subcategories, 'p_category')
  _.each(grouped, function(val, key){
    $('#filters').append('<br><label>' + key.toUpperCase() + '</label>')

    val.forEach(function(prop){
      $('#filters').append('\
        <div class="checkbox">\
          <label>\
            <input type="checkbox" value="' +
            prop.p_name + '" category="' +
            prop.p_category + '">' +
            prop.p_name +
          '</label>\
        </div>\
      ')
    })
  })
}

// Returns HTML template for a widget
function getWidgetHTML(widget) {
  var ret = '\
    <img src="http://pingendo.github.io/pingendo-bootstrap/assets/placeholder.png" class="img-responsive">\
    <div style="padding:0" class="col-xs-12">\
      <div style="padding:0" class="col-xs-9">\
        <h4 style="margin:10px 0">' + widget.w_name + '<h4>\
      </div>\
      <div class="col-xs-3">\
        <a style="margin: 10px 0" wid="' + widget.w_id +
        '" onclick=addToCart(' + widget.w_id + ') class="btn btn-primary btn-xs">Buy</a>\
      </div>\
    </div>\
    <div style="padding:0" class="col-xs-12"\
      <ul>\
  '

  ret += '<li>type: ' + widget['type'].toString() + '</li>'

  _.uniq(_.map(app.subcategories, 'p_category')).forEach(function(key){
    if (_.has(widget, key)) {
      ret += '<li>' + key + ': ' + widget[key].toString() + '</li>'
    }
  })

  return ret + '</ul></div>'
}

// Home - Featured Widgets
function updateHome() {
  var count = 0;
  $('.widget-holder').each(function(){
    $(this).empty()
    var widget = app.widgets[count]
    $(this).append(getWidgetHTML(widget))
    count += 1
  })
}

// Widgets - Browse all widgets
function updateWidgets() {
  $('#widget-list').empty()

  app.widgets.forEach(function(widget){
    $('#widget-list').append('\
      <div class="col-lg-3 col-md-4">' + getWidgetHTML(widget) + '</div>'
    )
  })
}


/*
 * Main functions to get all necessary widget data
 * and update the widget pages
 */
function getData() {
  $.when(
    $.getJSON(app.api.widgets, {}, function(data, textStatus, jqXHR){
      app.widgets = data || []
    }),
    $.getJSON(app.api.categories, {}, function(data, textStatus, jqXHR){
      app.categories = data || []
    }),
    $.getJSON(app.api.subcategories, {}, function(data, textStatus, jqXHR){
      app.subcategories = data || []
    })
  ).then(function(){
    update()
    initCart()
  })
}

function update() {
  updateFilterSidebar()
  updateHome()
  updateWidgets()
}

$(document).ready(function(){
  getData()
})