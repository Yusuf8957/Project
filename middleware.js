const Listing = require("./models/listing");
const Review = require("./models/review");
const ExpressError = require("./utils/ExpressError");


// ================= LOGIN CHECK =================
module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {

    // ✅ ONLY save GET requests (important fix)
    if (req.method === "GET") {
      req.session.redirectUrl = req.originalUrl;
    }

    req.flash("error", "You must be logged in!");
    return res.redirect("/login");
  }

  return next();
};


// ================= SAVE REDIRECT =================
module.exports.saveRedirect = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
    delete req.session.redirectUrl;
  }
  return next();
};


// ================= OWNER CHECK =================
module.exports.isOwner = async (req, res, next) => {
  try {
    let { id } = req.params;

    let listing = await Listing.findById(id);

    // 🔥 FIX: listing null check
    if (!listing) {
      req.flash("error", "Listing not found!");
      return res.redirect("/listings");
    }

    // 🔥 FIX: user safety check
    if (!req.user || !listing.owner.equals(req.user._id)) {
      req.flash("error", "You are not the owner!");
      return res.redirect(`/listings/${id}`);
    }

    return next();
  } catch (err) {
    console.log("OWNER ERROR:", err);
    return next(err);
  }
};


// ================= REVIEW AUTHOR CHECK =================
module.exports.isReviewAuthor = async (req, res, next) => {
  try {
    let { reviewId, id } = req.params;

    let review = await Review.findById(reviewId);

    // 🔥 FIX: review null check
    if (!review) {
      req.flash("error", "Review not found!");
      return res.redirect(`/listings/${id}`);
    }

    // 🔥 FIX: user safety
    if (!req.user || !review.author.equals(req.user._id)) {
      req.flash("error", "You are not the author of this review!");
      return res.redirect(`/listings/${id}`);
    }

    return next();
  } catch (err) {
    console.log("REVIEW AUTHOR ERROR:", err);
    return next(err);
  }
};


// ================= VALIDATE LISTING =================
module.exports.validateListing = (req, res, next) => {
  let { listing } = req.body;

  if (!listing) {
    req.flash("error", "Listing data is required");
    return res.redirect("back");
  }

  if (!listing.title || listing.title.trim().length < 3) {
    req.flash("error", "Title must be at least 3 characters");
    return res.redirect("back");
  }

  if (!listing.price || isNaN(Number(listing.price))) {
    req.flash("error", "Valid price is required");
    return res.redirect("back");
  }

  if (req.method === "POST" && !req.file) {
    req.flash("error", "Image is required");
    return res.redirect("back");
  }

  return next();
};


// ================= VALIDATE REVIEW =================
module.exports.validateReview = (req, res, next) => {
  let { review } = req.body;

  if (!review || !review.comment || review.comment.trim().length === 0) {
    req.flash("error", "Review comment is required");
    return res.redirect("back");
  }

  if (!review.rating || review.rating < 1 || review.rating > 5) {
    req.flash("error", "Rating must be between 1 and 5");
    return res.redirect("back");
  }

  return next();
};