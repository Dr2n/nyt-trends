// ----------------------------------------------------------------
//     Includes and parameters
// ----------------------------------------------------------------

const https 	= require('https');
const mysql     = require('mysql');
const express	= require('express');
const server 	= express();

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
//     Make database connection
// ----------------------------------------------------------------

