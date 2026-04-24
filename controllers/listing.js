const Listing = require("../models/listing");
const ExpressError = require("../utils/ExpressError.js");

// ================= INDEX =================
module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index", { allListings });
};

// ================= NEW FORM =================
module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

// ================= SHOW =================
module.exports.showListing = async (req, res) => {
  let { id } = req.params;

  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: { path: "author" },
    })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing does not exist!");
    return res.redirect("/listings");
  }

  res.render("listings/show.ejs", { listing });
};

// ================= CREATE =================
module.exports.createListing = async (req, res) => {

  const location = req.body.listing.location;

  // 🔥 MapTiler Geocoding
  const response = await fetch(
    `https://api.maptiler.com/geocoding/${encodeURIComponent(location)}.json?key=${process.env.MAPTILER_KEY}`
  );
  const data = await response.json();

  if (!data.features.length) {
    req.flash("error", "Invalid location!");
    return res.redirect("/listings/new");
  }

  const coords = data.features[0].center;

  const newListing = new Listing({
    ...req.body.listing,
    price: Number(req.body.listing.price),
    owner: req.user._id,
    geometry: {
      type: "Point",
      coordinates: coords,
    },
  });

  // image
  if (req.file) {
    newListing.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
  }

  await newListing.save();

  req.flash("success", "New Listing Created!");
  res.redirect(`/listings/${newListing._id}`);
};

// ================= EDIT FORM =================
module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing does not exist!");
    return res.redirect("/listings");
  }

  res.render("listings/edit.ejs", { listing });
};

// ================= UPDATE =================
module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let { title, price } = req.body.listing;

  if (!title || title.trim().length < 3) {
    throw new ExpressError(400, "Title must be at least 3 characters");
  }

  if (!price || isNaN(Number(price))) {
    throw new ExpressError(400, `Invalid price: ${price}`);
  }

  const location = req.body.listing.location;

  // 🔥 MapTiler Geocoding
  const response = await fetch(
    `https://api.maptiler.com/geocoding/${encodeURIComponent(location)}.json?key=${process.env.MAPTILER_KEY}`
  );
  const data = await response.json();

  if (!data.features.length) {
    req.flash("error", "Invalid location!");
    return res.redirect(`/listings/${id}/edit`);
  }

  const coords = data.features[0].center;

  let listing = await Listing.findByIdAndUpdate(id, {
    ...req.body.listing,
    price: Number(req.body.listing.price),
  });

  // ✅ update location
  listing.geometry = {
    type: "Point",
    coordinates: coords,
  };

  // image update
  if (req.file) {
    listing.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
  }

  await listing.save();

  req.flash("success", "Listing Updated ✏️");
  res.redirect(`/listings/${id}`);
};

// ================= DELETE =================
module.exports.deleteListing = async (req, res) => {
  let { id } = req.params;

  await Listing.findByIdAndDelete(id);

  req.flash("success", "Listing Deleted ❌");
  res.redirect("/listings");
};