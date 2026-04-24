const Listing = require("./models/listing");
const Review = require("./models/review");
const ExpressError = require("./utils/ExpressError");


// ================= LOGIN CHECK =================
module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {

    // ✅ FIX: always save original URL
    req.session.redirectUrl = req.originalUrl;

    req.flash("error", "You must be logged in!");
    return res.redirect("/login");
  }
  next();
};


// ================= SAVE REDIRECT =================
module.exports.saveRedirect = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
    delete req.session.redirectUrl; // ✅ clean after use
  }
  next();
};


// ================= OWNER CHECK =================
module.exports.isOwner = async (req, res, next) => {
  let { id } = req.params;
  let listing = await Listing.findById(id);

  if (!listing.owner.equals(req.user._id)) {
    req.flash("error", "You are not the owner!");
    return res.redirect(`/listings/${id}`);
  }

  next();
};


// ================= REVIEW AUTHOR CHECK =================
module.exports.isReviewAuthor = async (req, res, next) => {
  let { reviewId, id } = req.params;

  let review = await Review.findById(reviewId);

  if (!review.author.equals(req.user._id)) {
    req.flash("error", "You are not the author of this review!");
    return res.redirect(`/listings/${id}`);
  }

  next();
};


// ================= VALIDATE LISTING =================
module.exports.validateListing = (req, res, next) => {
  let { listing } = req.body;

  if (!listing) {
    throw new ExpressError(400, "Listing data is required");
  }

  if (!listing.title || listing.title.trim().length < 3) {
    throw new ExpressError(400, "Title must be at least 3 characters");
  }

  if (!listing.price || isNaN(Number(listing.price))) {
    throw new ExpressError(400, "Valid price is required");
  }

  // ✅ ONLY require image during CREATE
  if (req.method === "POST" && !req.file) {
    throw new ExpressError(400, "Image is required");
  }

  next();
};


// ================= VALIDATE REVIEW =================
module.exports.validateReview = (req, res, next) => {
  let { review } = req.body;

  if (!review || !review.comment || review.comment.trim().length === 0) {
    throw new ExpressError(400, "Review comment is required");
  }

  if (!review.rating || review.rating < 1 || review.rating > 5) {
    throw new ExpressError(400, "Rating must be between 1 and 5");
  }

  next();
};