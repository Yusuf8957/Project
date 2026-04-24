const Listing = require("../models/listing");
const Review = require("../models/review");

// ================= CREATE Review =================
module.exports.createReview = async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }

  const newReview = new Review(req.body.review);
  newReview.author = req.user._id;

  await newReview.save();

  listing.reviews.push(newReview._id);
  await listing.save();

  req.flash("success", "Review Added!");
  return res.redirect(`/listings/${listing._id}`);
};

// ================= DELETE Review =================
module.exports.deleteReview = async (req, res) => {
  const { id, reviewId } = req.params;

  await Listing.findByIdAndUpdate(id, {
    $pull: { reviews: reviewId }
  });

  await Review.findByIdAndDelete(reviewId);

  req.flash("success", "Review Deleted!");
  return res.redirect(`/listings/${id}`);
};