const express = require('express');
const app = express();
const path = require('path');
const session = require("express-session");
const FileStore = require('session-file-store')(session);

app.use(express.urlencoded({
    extended: true
}));

app.use(session({
    secret: 'ProgiUnderdogs',
    resave: false,
    store: new FileStore(),
    saveUninitialized: true,
    cookie: { maxAge: 600000 }
}))

app.use(express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const homeRouter = require("./routes/home.routes");
const loginRouter = require("./routes/login.routes");
const settingsRouter = require("./routes/settings.routes");
const usersRouter = require("./routes/users.routes");
const eventsRouter = require("./routes/events.routes");
app.use("/", homeRouter);
app.use("/login", loginRouter);
app.use("/settings", settingsRouter);
app.use("/users", usersRouter);
app.use("/events", eventsRouter);
const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}!`);
})