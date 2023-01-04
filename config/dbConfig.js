const { Pool } = require('pg');

const pool = new Pool ({
	user: 'library_database_user',
	password:'VbQe2qGhMyrNVQp2a6ELN2YSXzZ5JoLz',
	host:'dpg-ceqhff02i3mov0hld820-a.singapore-postgres.render.com', 
	port:'5432',
	database:'library_database',
	ssl:true,
})

module.exports = {pool};