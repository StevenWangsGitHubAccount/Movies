var config = require('./db-config.js');
var mysql = require('mysql');

config.connectionLimit = 10;
var connection = mysql.createPool(config);

/* -------------------------------------------------- */
/* ------------------- Route Handlers --------------- */
/* -------------------------------------------------- */


/* ---- Q1a (Dashboard) ---- */
function getAllGenres(req, res) {
  	var query =
	`SELECT DISTINCT Genre as "genre" FROM Genres;`
	;
	connection.query(query, function(err, rows, fields) {
		if (err) console.log(err);
		else {
			
			res.json(rows);
		}
	});
}


/* ---- Q1b (Dashboard) ---- */
function getTopInGenre(req, res) {
	var selectedGenre = req.params.genre;
	var query = 
	`SELECT DISTINCT Movies.title AS "title", Movies.rating AS "rating", Movies.vote_count AS "vote_count" FROM Movies
	JOIN Genres ON Movies.id = Genres.movie_id 
	WHERE Genres.Genre LIKE '${selectedGenre}' 
	ORDER BY Movies.rating DESC, Movies.vote_count DESC  
	LIMIT 10;`;
  	connection.query(query, function(err, rows, fields) {
  		if (err) console.log(err);
  		else {
  			res.json(rows);
  		}
	});
};

/* ---- Q2 (Recommendations) ---- */
function getRecs(req, res) {
	var inputMovie = req.params.movieName;
	var query = `
	SELECT m.title, m.id, m.rating, m.vote_count FROM Movies m 
	WHERE NOT EXISTS 
	(SELECT * FROM Movies m2 
	JOIN Genres g2 ON m2.id = g2.movie_id WHERE m2.title LIKE '${inputMovie}' 
	AND NOT EXISTS 
	(SELECT * FROM Movies m3 
	JOIN Genres g3 ON m3.id = g3.movie_id 
	WHERE m3.id = m.id AND g3.genre = g2.genre)) AND m.title <> '${inputMovie}' 
	ORDER BY m.rating DESC, m.vote_count DESC LIMIT 5;`
  	connection.query(query, function(err, rows, fields) {
  		if (err) console.log(err);
  		else {
			res.json(rows);
		}
	});
};

/* ---- (Best Genres) ---- */
function getDecades(req, res) {
	var query = `
    SELECT DISTINCT (FLOOR(year/10)*10) AS decade
    FROM (
      SELECT DISTINCT release_year as year
      FROM Movies
      ORDER BY release_year
    ) y
  `;
  connection.query(query, function(err, rows, fields) {
    if (err) console.log(err);
    else {
      res.json(rows);
    }
  });
}

/* ---- Q3 (Best Genres) ---- */
function bestGenresPerDecade(req, res) {
	var reqDecade = req.params.selectedDecade;
	var query = `
	WITH decade AS 
	(SELECT g.genre as "genre", AVG(m.rating) as "rating" FROM Movies m
	JOIN Genres g ON m.id = g.movie_id
	WHERE m.release_year >= '${reqDecade}' AND m.release_year < '${reqDecade}' + 10
	GROUP BY g.genre
	ORDER BY AVG(m.rating) DESC, g.genre ASC)
	SELECT * FROM decade
	UNION 
	SELECT DISTINCT g2.genre, 0 AS "rating" FROM Genres g2
	WHERE NOT EXISTS 
	(SELECT * FROM decade
	WHERE g2.genre = decade.genre)
	ORDER BY rating DESC, genre ASC;	
`
	connection.query(query, function(err, rows, fields) {
	if (err) console.log(err);
	else {
		res.json(rows);
	}
	});
};

// The exported functions, which can be accessed in index.js.
module.exports = {
	getAllGenres: getAllGenres,
	getTopInGenre: getTopInGenre,
	getRecs: getRecs,
	getDecades: getDecades,
  bestGenresPerDecade: bestGenresPerDecade
}
