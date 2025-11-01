require('dotenv').config();
const express = require('express');
const session = require("express-session");
const FileStore = require('session-file-store')(session);
const path = require('path');

const app = express();

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    store: new FileStore(),
    saveUninitialized: true,
    cookie: { maxAge: 600000 }
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// rute
const homeRouter = require('./routes/home.routes');
app.use('/', homeRouter);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Listening on port ${PORT}!`));
