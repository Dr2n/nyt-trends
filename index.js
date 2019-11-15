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
	if (!req.query.phrase || req.query.phrase == '') response.send("Pleaswe provide search phrase");
	
	// let query = `	SELECT DATE_FORMAT(pub_date, '%Y') as 'year',
	// 				COUNT(*) as 'count'
	// 				FROM articles
	// 				WHERE article_string
	// 				LIKE '% ${req.query.phrase} %'
	// 				GROUP BY DATE_FORMAT(pub_date, '%Y')`;

	let query = `	SELECT a.year as 'year', COUNT(*) as 'count'
					FROM (
						SELECT year
						FROM articles
						WHERE MATCH(article_string) AGAINST ('"${req.query.phrase}"' IN BOOLEAN MODE)
					) as a
					GROUP BY a.year`;

	db.query(query, (err, res, fields) => {
		err 
			? response.send("Could not get query")
			: response.send(JSON.stringify(res));
	})

});

server.get('/similar-to', (req, response) => {
	console.log(`Querying similar-to for ${req.query.year}: ${req.query.phrase}`);
	let query = `	
				SELECT a.text
				FROM (
					SELECT article_string as 'text'
					FROM articles
					WHERE year = ${req.query.year}
				) as a
				WHERE a.text LIKE "% ${req.query.phrase} %"
				`;

	let startTime = Date.now();

	db.query(query, (err, res, fields) => {
		console.log(`Received response in ${Date.now() - startTime} ms`);
		startTime = Date.now();
		if (err) {
			response.send("Could not get similar to")
			return;
		}

		let words = "";
		res.map( element => {
			words += ` ${element.text} `;
		})

		wordCounts = {};
		words.trim().split(" ").forEach( word => {
			wordCounts['_' + word] = wordCounts['_' + word] ? wordCounts['_' + word] + 1 : 1;
		});

		var inOrder = Object.keys(wordCounts)
						.sort( (a, b) => {
							return wordCounts[b] - wordCounts[a];
						})
						.map( word => word.substring(1))
						.filter( word => word != req.query.phrase)
						.filter( word => word.length > 2)
						.filter(word => isNaN(word))
						.filter(word => !stopWords.includes(word))
						.slice(0, 50)
						.map( i => {
							return {name: i, count: wordCounts['_' + i]};
						});

		response.send(JSON.stringify(inOrder));
		console.log(`Sent information after another ${Date.now() - startTime} ms`);
	})
})

server.listen(port, () => {
	console.log(`Started server on port ${port}...`);
})

/** Additional Stopwords */

let stopWords = [
	'new',
	'york',
	'united', 
	'states',
	'said',
	'will',
	'like',
	'can',
	'many',
	'one',
	'two',
	'three',
	'last',
	'european',
	'also',
	'world',
	'street',
	'served',
	'first',
	'year',
	'years',
	'may',
	'every',
	'people',
	'just',
	'president',
	'american',
	'yesterday',
	'life',
	'made',
	'the',
	'yea',
	'today',
	'week',
	'weeks',
	'state',
	'nay',
	'now',
	'end',
	'says'

];
