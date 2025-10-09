const express = require('express');
const app = express();
const path = require('path');
const session = require("express-session");
const FileStore = require('session-file-store')(session);

app.use(session({
    secret: 'ProgiUnderdogs',
    resave: false,
    store: new FileStore(),
    saveUninitialized: true,
    cookie: { maxAge: 600000 }
}))


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({
    extended: true
}));


const homeRouter = require("./routes/home.routes");
app.use("/", homeRouter);

const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}!`);
})