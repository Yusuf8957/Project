const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");

const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listing.js");

// ✅ CLOUDINARY STORAGE USE
const multer = require("multer");
const { storage } = require("../cloudConfig");
const upload = multer({ storage });


// ================= ROUTES =================

// 👉 INDEX + CREATE
router.route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.createListing)
  );


// 👉 NEW (IMPORTANT FIX: ensure correct flow)
router.get("/new", isLoggedIn, wrapAsync(listingController.renderNewForm));


// 👉 SHOW + UPDATE + DELETE
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


// 👉 EDIT
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.renderEditForm)
);


module.exports = router;