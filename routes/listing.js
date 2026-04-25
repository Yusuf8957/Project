const express = require("express");
const router = express.Router();

const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listing.js");
const Listing = require("../models/listing");

const multer = require("multer");
const { storage } = require("../cloudConfig");
const upload = multer({ storage });


//  SUGGEST (Autocomplete) 
router.get("/suggest", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json([]);
    }

    const listings = await Listing.find({
      $or: [
        { location: { $regex: q, $options: "i" } },
        { title: { $regex: q, $options: "i" } },
        { country: { $regex: q, $options: "i" } },
      ]
    }).limit(6);

    const suggestions = [
      ...new Set([
        ...listings.map(l => l.location),
        ...listings.map(l => l.title),
      ])
    ].filter(s => s && s.toLowerCase().includes(q.toLowerCase())).slice(0, 6);

    return res.json(suggestions);

  } catch (err) {
    return res.json([]);
  }
});


//  SEARCH 
router.get("/search", async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      req.flash("error", "Please enter a search term!");
      return res.redirect("/listings");
    }

    const listings = await Listing.find({
      $or: [
        { location: { $regex: q, $options: "i" } },
        { title: { $regex: q, $options: "i" } },
        { country: { $regex: q, $options: "i" } },
      ]
    });

    const related = await Listing.aggregate([{ $sample: { size: 6 } }]);

    return res.render("listings/search.ejs", { listings, related, q });

  } catch (err) {
    console.log("SEARCH ERROR:", err);
    return next(err);
  }
});


//  NEW 
router.get(
  "/new",
  isLoggedIn,
  wrapAsync(listingController.renderNewForm)
);


//  INDEX + CREATE 
router.route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.createListing)
  );


//  SHOW + UPDATE + DELETE 
router.route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(
    isLoggedIn,
    isOwner,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.updateListing)
  )
  .delete(
    isLoggedIn,
    isOwner,
    wrapAsync(listingController.deleteListing)
  );


//  EDIT 
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.renderEditForm)
);


module.exports = router;