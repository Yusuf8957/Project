const Listing = require("../models/listing");
const ExpressError = require("../utils/ExpressError.js");


// ================= INDEX =================
module.exports.index = async (req, res, next) => {
  try {
    const allListings = await Listing.find({});
    return res.render("listings/index", { allListings });
  } catch (err) {
    return next(err);
  }
};


// ================= NEW FORM =================
module.exports.renderNewForm = (req, res) => {
  return res.render("listings/new");
};


// ================= SHOW =================
module.exports.showListing = async (req, res, next) => {
  try {
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

    return res.render("listings/show", { listing });

  } catch (err) {
    return next(err);
  }
};


// ================= CREATE =================
module.exports.createListing = async (req, res, next) => {
  try {
    const location = req.body.listing.location;

    const response = await fetch(
      `https://api.maptiler.com/geocoding/${encodeURIComponent(location)}.json?key=${process.env.MAP_TOKEN}`
    );

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      req.flash("error", "Invalid API key or location!");
      return res.redirect("/listings/new");
    }

    if (!data.features || !data.features.length) {
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

    if (req.file) {
      newListing.image = {
        url: req.file.path,
        filename: req.file.filename,
      };
    }

    await newListing.save();

    req.flash("success", "New Listing Created!");
    return res.redirect(`/listings/${newListing._id}`);

  } catch (err) {
    return next(err);
  }
};


// ================= EDIT FORM =================
module.exports.renderEditForm = async (req, res, next) => {
  try {
    let { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
      req.flash("error", "Listing does not exist!");
      return res.redirect("/listings");
    }

    return res.render("listings/edit", { listing });

  } catch (err) {
    return next(err);
  }
};


// ================= UPDATE =================
module.exports.updateListing = async (req, res, next) => {
  try {
    let { id } = req.params;
    let { title, price } = req.body.listing;

    if (!title || title.trim().length < 3) {
      throw new ExpressError(400, "Title must be at least 3 characters");
    }

    if (!price || isNaN(Number(price))) {
      throw new ExpressError(400, `Invalid price: ${price}`);
    }

    const location = req.body.listing.location;

    const response = await fetch(
      `https://api.maptiler.com/geocoding/${encodeURIComponent(location)}.json?key=${process.env.MAP_TOKEN}`
    );

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      req.flash("error", "Invalid API key or location!");
      return res.redirect(`/listings/${id}/edit`);
    }

    if (!data.features || !data.features.length) {
      req.flash("error", "Invalid location!");
      return res.redirect(`/listings/${id}/edit`);
    }

    const coords = data.features[0].center;

    let listing = await Listing.findByIdAndUpdate(id, {
      ...req.body.listing,
      price: Number(req.body.listing.price),
    });

    listing.geometry = {
      type: "Point",
      coordinates: coords,
    };

    if (req.file) {
      listing.image = {
        url: req.file.path,
        filename: req.file.filename,
      };
    }

    await listing.save();

    req.flash("success", "Listing Updated ✏️");
    return res.redirect(`/listings/${id}`);

  } catch (err) {
    return next(err);
  }
};


// ================= DELETE =================
module.exports.deleteListing = async (req, res, next) => {
  try {
    let { id } = req.params;

    await Listing.findByIdAndDelete(id);

    req.flash("success", "Listing Deleted ❌");
    return res.redirect("/listings");

  } catch (err) {
    return next(err);
  }
};