//var api = 'http://34.192.230.162:3000'
var api = 'http://localhost:3000'
var app = {
  api: {
    widgets: api.concat('/widgets'),
    categories: api.concat('/categories'),
    subcategories: api.concat('/subcategories'),
  },
  widgets: null,
  categories: null,
  subcategories: null,
}

/* Updates the filter side bar with type and property options */
function updateFilterSidebar() {

  // Types
  $('#filters').append('<br><label>TYPE</label>')
  app.categories.forEach(function(cat){
    $('#filters').append('\
      <div class="checkbox">\
        <label>\
          <input value="' + cat.p_name + '" type="checkbox">' + cat.p_name +
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
            <input value="' + prop.p_name + '" type="checkbox">' + prop.p_name +
          '</label>\
        </div>\
      ')
    })
  })
}

/* Returns HTML template for a widget */
function getWidgetHTML(widget) {
  var ret = '\
    <img src="http://pingendo.github.io/pingendo-bootstrap/assets/placeholder.png" class="img-responsive">\
    <div style="padding:0" class="col-xs-12">\
      <div style="padding:0" class="col-xs-8">\
        <h4 style="margin:10px 0">' + widget.w_name + '<h4>\
      </div>\
      <div class="col-xs-4">\
        <a style="margin: 10px 0" class="btn btn-primary btn-xs">Add to Cart</a>\
      </div>\
    </div>\
    <div style="padding:0" class="col-xs-12"\
      <ul>\
  '

  Object.keys(widget.properties).forEach(function(key){
    ret += '<li>' + key + ': ' + widget.properties[key] + '</li>'
  })

  return ret + '</ul></div>'
}

/* Home - Featured Widgets */
function updateHome() {
  var count = 0;
  $('.widget-holder').each(function(){
    var widget = app.widgets[count]
    $(this).append(getWidgetHTML(widget))
    count += 1
  })
}

/* Widgets - Browse all widgets */
function updateWidgets() {
  app.widgets.forEach(function(widget){
    $('#widget-list').append('\
      <div class="col-lg-3 col-md-4">' + getWidgetHTML(widget) + '</div>'
    )
  })
}


/* Retrieves widget data from the API Server */
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