require("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const ExpressError = require("./utils/ExpressError.js");

const listingsRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const wishlistRouter = require("./routes/wishlist.js");
const bookingRouter = require("./routes/booking.js");
const authRoutes = require("./routes/auth");

//  DATABASE 
mongoose.connect(process.env.ATLASDB_URL)
  .then(() => console.log("connected to DB"))
  .catch(err => console.log(err));

// VIEW ENGINE 
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

//  MIDDLEWARE 
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));

// SESSION STORE 
const store = MongoStore.create({
  mongoUrl: process.env.ATLASDB_URL,
  touchAfter: 24 * 3600,
});

store.on("error", (err) => {
  console.log("SESSION STORE ERROR", err);
});

app.use(session({
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  }
}));

app.use(flash());

//  PASSPORT 
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//  LOCALS 
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  res.locals.currentPath = req.originalUrl.split("?")[0];
  next();
});

//  ROUTES 
app.get("/", (req, res) => {
  return res.redirect("/listings");
});

app.use("/listings/:id/reviews", reviewRouter);
app.use("/listings", listingsRouter);
app.use("/bookings", bookingRouter);
app.use("/wishlist", wishlistRouter);
app.use("/api/auth", authRoutes);
app.use("/", userRouter);

//ERROR HANDLER 
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  let { statusCode = 500, message = "Something went wrong!" } = err;
  return res.status(statusCode).render("error.ejs", { message });
});

//SERVER 
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});