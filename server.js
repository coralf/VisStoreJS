var express = require('express');
var app = express();
app.use('/public', express.static('public'));
 
app.get('/', function (req, res) {
    res.sendFile( __dirname + "/" + "index.html" );
})
 
var server = app.listen(80, function () {
  var host = server.address().address
  var port = server.address().port
})