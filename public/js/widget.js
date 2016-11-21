var api = 'http://localhost:3000'
var app = {
  api: {
    widgets: api.concat('/widgets')
  }
}


/* Retrieves all widgets from the API Server */
function getData() {
  $.getJSON(app.api.widgets, {}, function(data, textStatus, jqXHR){
    app.widgets = data || []
    update()
  });
}

/* Updates displayed widget info */
function update() {

  // Home - Featured Widgets
  var count = 0;
  $('.widget-name').each(function(){
    var _this = this
    var widget = app.widgets[count]
    var props = widget.properties

    $(_this).text(widget.w_name)
    Object.keys(props).forEach(function(key){
      $(_this.parentElement.parentElement)
        .find('ul')
        .append('<li>' + key + ': ' + props[key] + '</li>')
    })

    count += 1
  })
}


$(document).ready(function(){
  getData()
})