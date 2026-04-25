const express = require("express");
const router = express.Router();
const User = require("../models/user");
const { isLoggedIn } = require("../middleware");

// ADD TO WISHLIST 
router.post("/add/:listingId", isLoggedIn, async (req, res) => {
  try {
    const { listingId } = req.params;
    const user = await User.findById(req.user._id);

    const alreadyAdded = user.wishlist.includes(listingId);

    if (alreadyAdded) {
      // Remove from wishlist
      user.wishlist = user.wishlist.filter(
        id => id.toString() !== listingId
      );
      await user.save();
      return res.json({ status: "removed" });
    } else {
      // Add to wishlist
      user.wishlist.push(listingId);
      await user.save();
      return res.json({ status: "added" });
    }

  } catch (err) {
    console.log("WISHLIST ERROR:", err);
    return res.status(500).json({ error: "Something went wrong!" });
  }
});


// WISHLIST PAGE
router.get("/", isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("wishlist");
    return res.render("wishlist/index", { wishlist: user.wishlist });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;