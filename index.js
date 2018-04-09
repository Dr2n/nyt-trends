// ----------------------------------------------------------------
//     Includes and parameters
// ----------------------------------------------------------------

const MAX_ARTICLE_LENGTH = 5000;
const MAX_SECTION_LENGTH = 1000;
const DB_CLEAR = true;

const request 	= require('request');
const mysql     = require('mysql');
const stopWords = require('./stopwords');

let startYear 	= 1930;
let endYear 	= 1935;
let apiKey 		= '8f4b1028d941458d9041934219d8b96f';

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

if (DB_CLEAR) db.query("truncate table articles");

// ----------------------------------------------------------------
//     Main
// ----------------------------------------------------------------
let startTime = Date.now();
	articleCount = 0;
	categories = ["Headline", "Keywords", "Snippet", "Lead Paragraph", "Abstract"];
	categoryCount = [ 0, 0, 0, 0, 0 ];

(async () => {
	for (let year = startYear; year < endYear + 1; year++) {
		for (let month = 1; month < 13; month++) {
			startTime = Date.now();
			console.log();
			console.log(`Making request for articles from ${month.toString().padStart(2, '0')}/${year}`);
			body = await getFromUrl(getUrl(year, month));
			storeResponse(body.response.docs);
		}
	}
	
	console.log();
	console.log("== ========================= =")
	console.log("");
	console.log(`  TOTAL ARTICLE COUNT: ${articleCount}`);
	console.log();
	for (i in categories) {
		console.log(`      ${categories[i]}: ${categoryCount[i]}`);
	}
	console.log();
	console.log("== ========================= =")
	
	// close connection
	db.end();
})();


// ----------------------------------------------------------------
//     Functions
// ----------------------------------------------------------------

function getUrl(year, month) {
	return `https://api.nytimes.com/svc/archive/v1/${year.toString()}/${month.toString()}.json?api-key=${apiKey}`; 
}

async function getFromUrl(url) {
	let success = false;
	let count = 0;
	let body;
	
	while (!success) {
		try {
			body = await makeSingleRequest(url);
			body = JSON.parse(body);
			success = true;
		} catch(err) {
			console.log();
			console.log(err);
			console.log();
			console.log(`Failed ${++count} trie(s) at retrieval of ${url}`);
			console.log('Trying again...');
			console.log();
		}
	}

	return body;
}

async function makeSingleRequest(url) {
	return new Promise( (resolve, reject) => {
		request.get(url, (err, res, body) => {
			if (err) {
				reject(err);
			}
			resolve(body);
		})
	})
}

function storeResponse(articles) {
	try {
		if (!articles || articles.length <= 0) return;
		
		gotResponseTime = Date.now();
		console.log("Retrieved: " + articles.length.toString() + " headlines in " + (gotResponseTime - startTime).toString() + " ms");
		
		let loopCount = 0;
		for (i in articles) {
			// get info
			pubDate = articles[i].pub_date;
			section = getSection(articles[i]);
			articleString = processArticle(articles[i]);
			
			// exit if invalid
			if ( !articleString || !pubDate ) continue;
			
			// chuck it onto the db
			if ( (typeof articleString) != "string" ) {
				console.log(pubDate);
				console.log(articleString);
				console.log(section);
				continue;
			}

			let query = `INSERT INTO articles (pub_date, article_string, section) VALUES ('${pubDate}', '${articleString}', '${section}')`;
			db.query(query, (err, res, fields) => {
				if (err) { 
					console.log(`Error with query: ${query} in:`);
					console.log(articles[i]);
					throw err;
				}
			});
			articleCount += 1;
			loopCount += 1;
		}
		
		console.log(`Entered ${loopCount.toString()} articles into the database`);
		console.log();
		console.log('--- -- -- -- -- -- -- ---');
	} catch (err){
		console.log(err);
		//console.log("Couldn't load articles, this was the response received:");
		//console.log(body);
	}
}

function processArticle(article) {
	
	/**
	 *    some processing:
	 *     - utilise the longest out of: [ keywords, abstract, snippet, lead_paragraph, main_headline ]
	 *     - make all lowercase
	 *     - remove stop words
	 *     - replace all punctuation with spaces
	 *     - shorten all repeated spaces
	 * 	   - remove leading and trailing whitespace
	 */

	// init array
	let strings = [
		article.headline.main,
		article.keywords.map((element) => {
			return element.value;
		}).join(" "),
		article.snippet,
		article.lead_paragraph,
		article.abstract
	]

	// replace null with empty strings, and find the longest string too
	let maxIndex = 0;
	let maxLength = 0;
	for (i in strings) {
		strings[i] = strings[i] ? strings[i] : "";
		
		if (strings[i].length > maxLength) {
			maxIndex = i;
			maxLength = strings[i].length;
		} 
	}
	articleString = strings[maxIndex];

	// further text processing
	articleString = stopWords.removeFrom(articleString.toLowerCase())
						.replace(/[.,/#!$?%\^&\*;:{}=\-_`~()'"]/g, '')
						.replace(/\\/g, ' ')
						.replace(/\s\s+/g, ' ')
						.trim();

	// return
	if (articleString.length == 0) return null;
	if (articleString.split(" ").length < 2) return null;
	categoryCount[maxIndex]++;
	return articleString.substring(0, 5000);
}

function getSection(article) {
	section = article.section_name ? article.section_name : "";	
	section = stopWords.removeFrom(section.toLowerCase())
				.replace(/[.,\/#!$?%\^&\*;:{}=\-_`~()'"]/g, '')
				.replace(/\\/g, ' ')
				.replace(/\s\s+/g, ' ')
				.trim();
	
	return section.length > 0 ? section.substring(0, 1000) : null;
}
