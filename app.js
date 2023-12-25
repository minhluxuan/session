const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const mysql = require("mysql");
const cron = require("cron");
const cors = require("cors");

const dbOptions = {
  host: "sql12.freemysqlhosting.net",
  port: 3306,
  user: "sql12672558",
  password: "mnsK6vV9Hg",
  database: "sql12672558",
};

const pool = mysql.createPool(dbOptions);
const sessionStore = new MySQLStore({}, pool);

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(cors({
  origin: "http://localhost", // add another in the future
  methods: "POST, GET, PUT, PATCH, DELETE",
  credentials: true,
}));
app.use(
  session({
    secret: "^nd82@37nki$897ncs",
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: false,
      maxAge: 30 * 1000,
    },
  })
);

const cleanUpExpiredSession = new cron.CronJob("* * * * *", async () => {
  try {
    const currentTime = new Date();
    await sessionStore.clearExpiredSessions(currentTime);
    console.log("Expired sessions has been cleared successfully!");
  } catch (err) {
    console.log("Error cleaning up expired session: ", err);
  }
});

cleanUpExpiredSession.start();

// Initiate new session
app.get('/set_session', (req, res) => {
  req.session.User = {
      name: "John Doe",
      age: 20
  }

  return res.status(200).json({status: 'success'})
});

// Get session data
app.get('/get_session', (req, res) => {
  if(req.session.User){
      return res.status(200).json({status: 'success', session: req.session.User})
  }

  return res.status(200).json({status: 'error', session: 'No session'});
});

// Count current access (session) number
app.get('/count_session', (req, res) => {
  const count = Object.keys(req.sessionStore.sessions).length;
  return res.status(200).json({count: count});
});

// Destroy session
app.get('/destroy_session', (req, res) => {
  if (req.session.User) {
    req.session.destroy((err) => {
      if (err) {
        console.log("Error: ", err);
        res.status(500).send("Fail to destroy session!");
      }
      else {
        res.status(200).send("Session has been destroyed successfully!");
      }
    });
  }
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
