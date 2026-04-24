const express = require("express");
const router = express.Router({ mergeParams: true });

const Listing = require("../models/listing");
const Review = require("../models/review");

// middleware
const { isLoggedIn, isReviewAuthor } = require("../middleware");


// ================= ADD REVIEW =================
router.post("/", isLoggedIn, async (req, res) => {
  try {
    let listing = await Listing.findById(req.params.id);

    // ✅ listing check
    if (!listing) {
      req.flash("error", "Listing not found!");
      return res.redirect("/listings");
    }

    // ✅ body check
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
    res.redirect(`/listings/${listing._id}`);

  } catch (err) {
    console.log(err);
    req.flash("error", "Something went wrong!");
    res.redirect("/listings");
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
      res.redirect(`/listings/${id}`);

    } catch (err) {
      console.log(err);
      req.flash("error", "Delete failed!");
      res.redirect(`/listings/${req.params.id}`);
    }
  }
);

module.exports = router;