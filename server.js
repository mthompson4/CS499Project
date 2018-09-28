const express = require('express');
const app = express();
var path = require('path');
app.use(express.static(__dirname + '/static'));

app.route('/').get((req, res) => {
	res.sendFile(path.join(__dirname+'/index.html'));
})

app.listen(8000, () => {
	console.log('Server Started!');
})