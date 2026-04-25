const Booking = require("../models/booking");
const Listing = require("../models/listing");

//  NEW BOOKING FORM 
module.exports.renderNewForm = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      req.flash("error", "Listing not found!");
      return res.redirect("/listings");
    }
    return res.render("bookings/new", { listing });
  } catch (err) {
    return next(err);
  }
};

//  CREATE BOOKING 
module.exports.createBooking = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      req.flash("error", "Listing not found!");
      return res.redirect("/listings");
    }

    const { checkIn, checkOut } = req.body;

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDate < today) {
      req.flash("error", "Check-in date cannot be in the past!");
      return res.redirect(`/listings/${req.params.id}/book`);
    }

    if (checkOutDate <= checkInDate) {
      req.flash("error", "Check-out must be after check-in!");
      return res.redirect(`/listings/${req.params.id}/book`);
    }

    const nights = Math.ceil(
      (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
    );

    const totalPrice = nights * listing.price;

    const booking = new Booking({
      listing: listing._id,
      user: req.user._id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights,
      totalPrice,
    });

    await booking.save();

    req.flash("success", `Booking confirmed! ${nights} night(s) for ₹${totalPrice.toLocaleString("en-IN")}`);
    return res.redirect("/bookings/history");

  } catch (err) {
    return next(err);
  }
};

// BOOKING HISTORY 
module.exports.bookingHistory = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("listing")
      .sort({ createdAt: -1 });

    return res.render("bookings/history", { bookings });
  } catch (err) {
    return next(err);
  }
};

//  CANCEL BOOKING 
module.exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
      req.flash("error", "Booking not found!");
      return res.redirect("/bookings/history");
    }

    if (!booking.user.equals(req.user._id)) {
      req.flash("error", "You are not authorized!");
      return res.redirect("/bookings/history");
    }

    await Booking.findByIdAndDelete(req.params.bookingId);

    req.flash("success", "Booking cancelled!");
    return res.redirect("/bookings/history");

  } catch (err) {
    return next(err);
  }
};