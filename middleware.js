const Listing = require("./models/listing");
const Review = require("./models/review");
const ExpressError = require("./utils/ExpressError");


// ================= LOGIN CHECK =================
module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
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

    if (!listing) {
      req.flash("error", "Listing not found!");
      return res.redirect("/listings");
    }

    if (!req.user || !listing.owner.equals(req.user._id)) {
      req.flash("error", "You are not the owner!");
      return res.redirect(`/listings/${id}`);
    }

    return next();
  } catch (err) {
    return next(err);
  }
};


// ================= REVIEW AUTHOR CHECK =================
module.exports.isReviewAuthor = async (req, res, next) => {
  try {
    let { reviewId, id } = req.params;
    let review = await Review.findById(reviewId);

    if (!review) {
      req.flash("error", "Review not found!");
      return res.redirect(`/listings/${id}`);
    }

    if (!req.user || !review.author.equals(req.user._id)) {
      req.flash("error", "You are not the author of this review!");
      return res.redirect(`/listings/${id}`);
    }

    return next();
  } catch (err) {
    return next(err);
  }
};


// ================= VALIDATE LISTING =================
module.exports.validateListing = (req, res, next) => {
  let { listing } = req.body;

  if (!listing) {
    req.flash("error", "Listing data is required");
    return res.redirect("/listings");
  }

  if (!listing.title || listing.title.trim().length < 3) {
    req.flash("error", "Title must be at least 3 characters");
    return res.redirect(
      req.method === "POST" ? "/listings/new" : `/listings/${req.params.id}/edit`
    );
  }

  if (!listing.price || isNaN(Number(listing.price))) {
    req.flash("error", "Valid price is required");
    return res.redirect(
      req.method === "POST" ? "/listings/new" : `/listings/${req.params.id}/edit`
    );
  }

  if (req.method === "POST" && !req.file) {
    req.flash("error", "Image is required");
    return res.redirect("/listings/new");
  }

  return next();
};


// ================= VALIDATE REVIEW =================
module.exports.validateReview = (req, res, next) => {
  let { review } = req.body;

  if (!review || !review.comment || review.comment.trim().length === 0) {
    req.flash("error", "Review comment is required");
    return res.redirect(`/listings/${req.params.id}`);
  }

  if (!review.rating || review.rating < 1 || review.rating > 5) {
    req.flash("error", "Review rating must be between 1 and 5");
    return res.redirect(`/listings/${req.params.id}`);
  }

  return next();
};