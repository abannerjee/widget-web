var api = 'http://localhost:3000'
var app = {
  name: 'widgetfactory',
  api: {
    widget: api.concat('/widget'),
    widgets: api.concat('/widgets'),
    categories: api.concat('/categories'),
    subcategories: api.concat('/subcategories'),
    orders: api.concat('/order'),
    inventory: api.concat('/inventory'),
  },
  widgets: null,
  categories: null,
  subcategories: null,
  inventory: null,
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
  // Create cookie to store cart info if one does not exist,
  // otherwise update the cookie with latest cart info.
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

function updateCartTotal() {
  $('#cart-total span').text(app.cart.length)
  $('#cart-badge').text(app.cart.length)
  updateCookie()
}

function addToCart(id) {
  // Multiples of the same widget cannot be added to the cart
  if (_.includes(app.cart, id) == 0) {
    var widget = _.find(app.widgets, {w_id: id})
    app.cart.push(id)

    // Add a widget entry to the cart
    var entry = '<li w_id="' + id + '" class="cart list-group-item">' + widget.w_name
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
    updateCartTotal()
  }
}

function removeFromCart(id) {
  // Remove from cart modal and header
  // and update total
  _.pull(app.cart, id)
  $('.cart.list-group-item[w_id="' + id + '"]').detach()
  updateCartTotal()
}

function makePurchase() {
  if (app.cart.length) {
    var data = []

    // Get all widget and property ids for items
    // in the cart and create an order.
    $('.cart.list-group-item').each(function(){
      var w_id = $(this).attr('w_id')
      var p_ids = []

      $(this).find('select').each(function(){
        p_ids.push($(this).val())
      })

      data.push({
        w_id: w_id,
        p_ids: p_ids
      })
    })

    // POST order
    $.post(app.api.orders, {'data': JSON.stringify(data)}, function(data, status){
      // Clear out cart
      app.cart = []
      $('.cart.list-group-item').detach()
      $('#cart-modal').modal('hide')
      updateCartTotal()

      // Show order confirmation
      bootbox.alert({
        size: "small",
        title: "Thank You!",
        message: "Your order confirmation ID is " + data
      })
    })
  }
}

/*
 * Funcions to check order given an order ID
 */
function checkOrder(){
  bootbox.prompt({
    title: "Enter your order ID",
    inputType: 'number',
    callback: function(result){
      if (result) {
        $.getJSON(app.api.orders.concat('/', result), {}, function(data, textStatus, jqXHR){
          if (textStatus == 'success') {
            var orderAlert = {
              title: 'Order ' + result,
              message: ''
            }

            data.forEach(function(order){
              var widget = _.find(app.widgets, {w_id: order.o_widget_id})

              orderAlert.message += '\
                Date: ' + order.to_char + '<br />\
                Widget: ' + widget.w_name + '<br />\
                Properties: \
              '

              order.o_configuration.forEach(function(id){
                var prop = _.find(app.subcategories, {p_id: id})
                orderAlert.message += prop.p_name + ', '
              })

              orderAlert.message += '<br \><br \>'
            })
            bootbox.alert(orderAlert)
          }
          else {
            bootbox.alert({message: 'Cannot retrieve your order', size: 'small'})
          }
        })
      }
    }
  })
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


/*
 * Function used to check widgets inventory
 */
function editInventory(w_id) {
  bootbox.prompt({
    title: "Enter new quantity",
    inputType: 'number',
    callback: function(result){
      if (result) {
        var data = {
          w_id: JSON.stringify(w_id),
          stock: JSON.stringify(result)
        }
        $.post(app.api.inventory, data, function(data, status){
          if (status == 'success') {
            bootbox.alert({message: 'Successfully updated stock', size: 'small'})
            $.getJSON(app.api.inventory, {}, function(data, textStatus, jqXHR){
              app.inventory = data || []
              updateInventory()
            })
          }
          else {
            bootbox.alert({message: 'Error updating stock', size: 'small'})
          }
        })
      }
    }
  })
}

/*
 * Function used to add a new widget
 */
function submitNewWidget() {
  // Get widget values
  var name = $('#widget-select-name').val()
  var type = $('#widget-select-type input:radio:checked').attr('id')
  var props = $('#widget-select-props input:checkbox:checked')

  // Values must be selected for all fields
  if (name.length && type.length && props.length) {
    var data = {
      name: name,
      type: type,
      props: []
    }

    // Get all prop ids
    props.each(function(){
      data.props.push($(this).attr('id'))
    })

    // POST new widget
    $.post(app.api.widget, {'data': JSON.stringify(data)}, function(data, status){
      if (status == 'success') {
        bootbox.alert({size: 'small', message: 'New widget created'})
        $('#add-widget-modal').modal('hide')
        update()
      }
      else {
        bootbox.alert({size: 'small', message: 'Error creating widget'})
      }
    })

  }
}


// Home - Featured Widgets
function updateHome() {
  var count = 0;
  $('.widget-holder').each(function(){
    var widget = app.widgets[count]
    $(this).empty()
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

// Inventory - Stock of all widgets
function updateInventory() {
  $('#inventory-list').empty()

  app.inventory.forEach(function(inv){
    var widget = _.find(app.widgets, {w_id: inv.i_widget_id})
    $('#inventory-list').append('\
      <li class="inventory list-group-item">' + widget.w_name +
        '<span style="float:right">' + inv.i_stock +
          '<a class="btn-update-inv" href="#" style="padding-left:10px" \
            onclick=editInventory(' + inv.i_widget_id + ')>Update</a>\
        </span>\
      </li>\
    ')
  })
}

// Create Widget - Initialize modal for creating widget
function initCreateWidget() {
  // Clear out existing layout
  $('#widget-select-name').val('')
  $('#widget-select-type').empty()
  $('#widget-select-props').empty()

  // Add all types
  app.categories.forEach(function(cat){
    $('#widget-select-type').append('\
      <label class="radio-inline">\
        <input type="radio" id="' + cat.p_id + '">' + cat.p_name +
      '</label>\
    ')
  })

  // Add all properties
  app.subcategories.forEach(function(sub){
    $('#widget-select-props').append('\
      <label class="checkbox-inline">\
        <input type="checkbox" id="' + sub.p_id +'">' + sub.p_name +
      '</label>\
    ')
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
    }),
    $.getJSON(app.api.inventory, {}, function(data, textStatus, jqXHR){
      app.inventory = data || []
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
  updateInventory()
  initCreateWidget()
}

$(document).ready(function(){
  getData()
})