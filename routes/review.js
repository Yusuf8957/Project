const express = require("express");
const router = express.Router({ mergeParams: true });

const Listing = require("../models/listing");
const Review = require("../models/review");

const { isLoggedIn, isReviewAuthor } = require("../middleware");


// ================= ADD REVIEW =================
router.post("/", isLoggedIn, async (req, res) => {
  try {
    let listing = await Listing.findById(req.params.id);

    if (!listing) {
      req.flash("error", "Listing not found!");
      return res.redirect("/listings");
    }

    if (!req.body.review || !req.body.review.rating) {
      req.flash("error", "Rating required!");
      return res.redirect(`/listings/${req.params.id}`);
    }

    let newReview = new Review(req.body.review);
    newReview.author = req.user._id;

    await newReview.save();

    listing.reviews.push(newReview._id);
    await listing.save();

    req.flash("success", "Review Added!");
    return res.redirect(`/listings/${listing._id}`);

  } catch (err) {
    console.log(err);
    req.flash("error", "Something went wrong!");
    return res.redirect("/listings"); // ✅ FIX
  }
});


// ================= DELETE REVIEW =================
router.delete("/:reviewId",
  isLoggedIn,
  isReviewAuthor,
  async (req, res) => {
    try {
      let { id, reviewId } = req.params;

      await Listing.findByIdAndUpdate(id, {
        $pull: { reviews: reviewId },
      });

      await Review.findByIdAndDelete(reviewId);

      req.flash("success", "Review Deleted!");
      return res.redirect(`/listings/${id}`);

    } catch (err) {
      console.log(err);
      req.flash("error", "Delete failed!");
      return res.redirect(`/listings/${req.params.id}`); // ✅ FIX
    }
  }
);

module.exports = router;