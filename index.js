// ----------------------------------------------------------------
//     Includes and parameters
// ----------------------------------------------------------------

const mysql     = require('mysql');
const express	= require('express');
const server 	= express();

const port = 3000;

// ----------------------------------------------------------------
//     Make database connection
// ----------------------------------------------------------------

let db = mysql.createConnection({
	host     : 'localhost',
	port	 : 8889,
	user     : 'newspaper',
	password : 'new-york',
	database : 'nyt'
});

db.connect();

// ----------------------------------------------------------------
//     Start the server
// ----------------------------------------------------------------

server.use(express.static('public'));

server.get('/query', (req, response) => {

	console.log(`Searching for '${req.query.phrase}'`)
	if (!req.query.phrase) response.send("Pleaswe provide search phrase");
	
	let query = `	SELECT DATE_FORMAT(pub_date, '%Y') as 'year',
					COUNT(*) as 'count'
					FROM articles
					WHERE article_string
					LIKE '% ${req.query.phrase} %'
					GROUP BY DATE_FORMAT(pub_date, '%Y')`;

	db.query(query, (err, res, fields) => {
		err 
			? response.send("Could not get query")
			: response.send(JSON.stringify(res));
	})

});

server.listen(port, () => {
	console.log(`Started server on port ${port}...`);
})
