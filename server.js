const express = require('express');
const http = require('http');
const app = express();
var path = require('path');

app.use(express.static(__dirname + '/dist/CS499Project'));

app.get('/*', (req, res) => res.sendFile(path.join(__dirname)));

const server = app.listen(8080, () => {
	const host = server.address().address;
	const port = server.address().port;

	console.log(`Example app listening at http://${host}:${port}`);
});