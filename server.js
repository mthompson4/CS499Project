const express = require('express');
const app = express();
var path = require('path');

// define paths for node modules & external JS / CSS files
app.use(express.static(__dirname + '/static'));
app.use(express.static(__dirname + '/src'));
app.use(express.static(__dirname + '/dist'));

app.route('/').get((req, res) => {
	res.sendFile(path.join(__dirname+'/dist/CS499Project/index.html'));
})

app.listen(8080, () => {
	console.log('Server Started!');
})