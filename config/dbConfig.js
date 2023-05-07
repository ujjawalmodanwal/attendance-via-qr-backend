const { Pool } = require('pg');

const pool = new Pool ({
	user: 'library_database_user',
	password:'4deLBV31gg0gxSZZ4YtPCypftN7cI0mN',
	host:'dpg-chboh5ik728tp9ffq5mg-a.singapore-postgres.render.com', 
	port:'5432',
	database:'library_database_rwej',
	ssl:true,
})

module.exports = {pool};
