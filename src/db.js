const mysql = require('mysql2');

// Povezivanje na bazu
const pool = mysql.createPool({
    host: 'localhost',       // promijeni ako ti je baza na drugom hostu
    user: 'root',            // tvoje korisničko ime
    password: '',            // tvoja lozinka
    database: 'dance_arena', // ime baze
});

// Promijeni pool u Promise verziju
module.exports = pool.promise();
