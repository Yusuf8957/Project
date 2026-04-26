const Booking = require("../models/booking");
const Listing = require("../models/listing");
const Razorpay = require("razorpay");
const crypto = require("crypto");

// ─── Helper: Create Razorpay instance fresh each time ─
// This ensures .env values are loaded before use
function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// ─── RENDER NEW BOOKING FORM ──────────────────────────
// GET /bookings/:id/book
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

// ─── CREATE BOOKING — Validate Dates & Create Razorpay Order ──
// POST /bookings/:id/book
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

    // Validate: check-in cannot be in the past
    if (checkInDate < today) {
      req.flash("error", "Check-in date cannot be in the past!");
      return res.redirect(`/bookings/${req.params.id}/book`);
    }

    // Validate: check-out must be after check-in
    if (checkOutDate <= checkInDate) {
      req.flash("error", "Check-out date must be after check-in date!");
      return res.redirect(`/bookings/${req.params.id}/book`);
    }

    // Calculate nights and price
    const nights = Math.ceil(
      (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
    );

    const totalPrice = nights * listing.price;
    const gst = Math.round(totalPrice * 0.18);
    const grandTotal = totalPrice + gst;

    // Debug: Check if Razorpay keys exist
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      req.flash("error", "Payment service not configured!");
      return res.redirect(`/listings/${listing._id}`);
    }

    // Create Razorpay order (amount in paise)
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: grandTotal * 100,
      currency: "INR",
      receipt: `bk_${listing._id}_${Date.now()}`.slice(0, 40),
    });

    // Save pending booking in session
    req.session.pendingBooking = {
      listingId: listing._id.toString(),
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights,
      totalPrice,
      gst,
      grandTotal,
      orderId: order.id,
    };

    // Render payment page
    return res.render("bookings/payment", {
      listing,
      order,
      totalPrice,
      gst,
      grandTotal,
      checkIn,
      checkOut,
      nights,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
    });

  } catch (err) {
    console.error("Razorpay Order Error:", err); // Terminal mein error dikhega
    return next(err);
  }
};

// ─── VERIFY PAYMENT & SAVE BOOKING ───────────────────
// POST /bookings/verify-payment
module.exports.verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // Verify Razorpay signature using HMAC SHA256
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      req.flash("error", "Payment verification failed! Please try again.");
      return res.redirect("/listings");
    }

    // Get pending booking from session
    const pendingBooking = req.session.pendingBooking;

    if (!pendingBooking) {
      req.flash("error", "Booking session expired! Please try again.");
      return res.redirect("/listings");
    }

    // Save confirmed booking to database
    const booking = new Booking({
      listing: pendingBooking.listingId,
      user: req.user._id,
      checkIn: pendingBooking.checkIn,
      checkOut: pendingBooking.checkOut,
      nights: pendingBooking.nights,
      totalPrice: pendingBooking.grandTotal,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      paymentStatus: "paid",
    });

    await booking.save();

    // Clear session
    delete req.session.pendingBooking;

    req.flash(
      "success",
      `Booking confirmed! ${pendingBooking.nights} night(s) — ₹${pendingBooking.grandTotal.toLocaleString("en-IN")} paid ✅`
    );

    return res.redirect("/bookings/history");

  } catch (err) {
    console.error("Payment Verify Error:", err);
    return next(err);
  }
};

// ─── BOOKING HISTORY ──────────────────────────────────
// GET /bookings/history
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

// ─── CANCEL BOOKING ───────────────────────────────────
// DELETE /bookings/:bookingId
module.exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);

    // Check if booking exists
    if (!booking) {
      req.flash("error", "Booking not found!");
      return res.redirect("/bookings/history");
    }

    // Check if current user owns this booking
    if (!booking.user.equals(req.user._id)) {
      req.flash("error", "You are not authorized to cancel this booking!");
      return res.redirect("/bookings/history");
    }

    // If booking is paid — mark as cancelled instead of deleting
    if (booking.paymentStatus === "paid") {
      await Booking.findByIdAndUpdate(req.params.bookingId, {
        paymentStatus: "cancelled",
      });
    } else {
      await Booking.findByIdAndDelete(req.params.bookingId);
    }

    req.flash("success", "Booking cancelled successfully!");
    return res.redirect("/bookings/history");

  } catch (err) {
    return next(err);
  }
};