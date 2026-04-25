const Listing = require("../models/listing");
const User = require("../models/user");


//  INDEX 
module.exports.index = async (req, res, next) => {
  try {
    const allListings = await Listing.find({});

    // Wishlist ke liye user populate karo
    let wishlist = [];
    if (req.user) {
      const user = await User.findById(req.user._id);
      wishlist = user.wishlist.map(id => id.toString());
    }

    return res.render("listings/index", { allListings, wishlist });
  } catch (err) {
    return next(err);
  }
};


//  NEW FORM 
module.exports.renderNewForm = async (req, res) => {
  return res.render("listings/new");
};


//  SHOW 
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


//  CREATE 
module.exports.createListing = async (req, res, next) => {
  try {
    if (!req.body.listing) {
      req.flash("error", "Invalid form data!");
      return res.redirect("/listings/new");
    }

    if (!req.user) {
      req.flash("error", "You must be logged in!");
      return res.redirect("/login");
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
      return res.redirect("/listings/new");
    }

    if (!data.features || data.features.length === 0) {
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
    console.log("CREATE ERROR:", err);
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

    if (!req.body.listing) {
      req.flash("error", "Invalid form data!");
      return res.redirect(`/listings/${id}/edit`);
    }

    let { title, price } = req.body.listing;

    if (!title || title.trim().length < 3) {
      req.flash("error", "Title must be at least 3 characters");
      return res.redirect(`/listings/${id}/edit`);
    }

    if (!price || isNaN(Number(price))) {
      req.flash("error", "Invalid price!");
      return res.redirect(`/listings/${id}/edit`);
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

    if (!data.features || data.features.length === 0) {
      req.flash("error", "Invalid location!");
      return res.redirect(`/listings/${id}/edit`);
    }

    const coords = data.features[0].center;

    let listing = await Listing.findByIdAndUpdate(id, {
      ...req.body.listing,
      price: Number(req.body.listing.price),
    });

    if (!listing) {
      req.flash("error", "Listing not found!");
      return res.redirect("/listings");
    }

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
    console.log("UPDATE ERROR:", err);
    return next(err);
  }
};


//  DELETE
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

module.exports.searchListings = async (req, res, next) => {
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
    }) || [];

    let related = [];
    try {
      related = await Listing.aggregate([{ $sample: { size: 6 } }]);
    } catch (e) {
      related = [];
    }

    return res.render("listings/search.ejs", {
      listings: listings || [],
      related: related || [],
      q
    });

  } catch (err) {
    console.log("SEARCH ERROR:", err);
    return next(err);
  }
};