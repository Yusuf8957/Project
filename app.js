require("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");

const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");

const listingsRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const flash = require("connect-flash");

// 🔥 ADD THIS (security)
const helmet = require("helmet");

const dbUrl = process.env.ATLASDB_URL;


// ================= DB CONNECT =================
mongoose.connect(dbUrl)
  .then(() => console.log("connected to DB"))
  .catch((err) => console.log(err));


// ================= VIEW ENGINE =================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);


// ================= MIDDLEWARE =================

// 🔥 FORCE HTTPS (important for Render)
app.use((req, res, next) => {
  if (req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect("https://" + req.headers.host + req.url);
  }
  next();
});

// 🔥 SECURITY HEADERS
app.use(helmet());

// static
app.use(express.static(path.join(__dirname, "public")));

// uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));


// ================= SESSION =================
const sessionOptions = {
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    secure: true, // 🔥 HTTPS ke liye important
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
};

app.use(session(sessionOptions));
app.use(flash());


// ================= PASSPORT =================
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// ================= LOCALS =================
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});


// ================= ROUTES =================

// 🔥 UPTIME ROUTE
app.get("/ping", (req, res) => {
  return res.send("OK");
});

app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);


// ================= ERROR HANDLING =================

// 404
app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"));
});

// global error
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  let { statusCode = 500, message = "Something went wrong!" } = err;
  res.status(statusCode).render("error.ejs", { message });
});


// ================= SERVER =================
app.listen(8080, () => {
  console.log("server is listening to port 8080");
});