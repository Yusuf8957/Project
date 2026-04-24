const express = require("express");
const router = express.Router({ mergeParams: true });

const Listing = require("../models/listing");
const Review = require("../models/review");

const { isLoggedIn, isReviewAuthor } = require("../middleware");


// ================= ADD REVIEW =================
router.post("/", isLoggedIn, async (req, res) => {
  try {
    let { id } = req.params;

    let listing = await Listing.findById(id);

    // 🔥 FIX: listing check
    if (!listing) {
      req.flash("error", "Listing not found!");
      return res.redirect("/listings");
    }

    // 🔥 FIX: body check
    if (!req.body.review || !req.body.review.rating) {
      req.flash("error", "Rating required!");
      return res.redirect(`/listings/${id}`);
    }

    let newReview = new Review(req.body.review);

    // 🔥 FIX: user safety
    if (!req.user) {
      req.flash("error", "You must be logged in!");
      return res.redirect("/login");
    }

    newReview.author = req.user._id;

    await newReview.save();

    listing.reviews.push(newReview._id);
    await listing.save();

    req.flash("success", "Review Added!");
    return res.redirect(`/listings/${listing._id}`);

  } catch (err) {
    console.log("ADD REVIEW ERROR:", err);
    req.flash("error", "Something went wrong!");
    return res.redirect("/listings");
  }
});


// ================= DELETE REVIEW =================
router.delete("/:reviewId",
  isLoggedIn,
  isReviewAuthor,
  async (req, res) => {
    try {
      let { id, reviewId } = req.params;

      // 🔥 FIX: listing existence check (optional but safe)
      let listing = await Listing.findById(id);
      if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
      }

      await Listing.findByIdAndUpdate(id, {
        $pull: { reviews: reviewId },
      });

      await Review.findByIdAndDelete(reviewId);

      req.flash("success", "Review Deleted!");
      return res.redirect(`/listings/${id}`);

    } catch (err) {
      console.log("DELETE REVIEW ERROR:", err);
      req.flash("error", "Delete failed!");
      return res.redirect(`/listings/${req.params.id}`);
    }
  }
);

module.exports = router;