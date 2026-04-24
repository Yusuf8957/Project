const express = require("express");
const router = express.Router();

const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listing.js");

const multer = require("multer");
const { storage } = require("../cloudConfig");
const upload = multer({ storage });


// ================= NEW =================
// ⚠️ IMPORTANT: "/new" must be ABOVE "/:id"
router.get(
  "/new",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    return res.render("listings/new"); // ✅ direct render (safe)
  })
);


// ================= INDEX + CREATE =================
router.route("/")
  .get(wrapAsync(async (req, res) => {
    return listingController.index(req, res);
  }))
  .post(
    isLoggedIn,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(async (req, res) => {
      return listingController.createListing(req, res);
    })
  );


// ================= SHOW + UPDATE + DELETE =================
router.route("/:id")
  .get(wrapAsync(async (req, res) => {
    return listingController.showListing(req, res);
  }))
  .put(
    isLoggedIn,
    isOwner,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(async (req, res) => {
      return listingController.updateListing(req, res);
    })
  )
  .delete(
    isLoggedIn,
    isOwner,
    wrapAsync(async (req, res) => {
      return listingController.deleteListing(req, res);
    })
  );


// ================= EDIT =================
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(async (req, res) => {
    return listingController.renderEditForm(req, res);
  })
);

module.exports = router;