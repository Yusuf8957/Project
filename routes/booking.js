const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middleware");
const bookingController = require("../controllers/booking");

// ✅ Main booking route
router.get("/:id/book", isLoggedIn, bookingController.renderNewForm);
router.post("/:id/book", isLoggedIn, bookingController.createBooking);

// ✅ ADD THIS (IMPORTANT FIX)
router.get("/listings/:id/book", isLoggedIn, bookingController.renderNewForm);
router.post("/listings/:id/book", isLoggedIn, bookingController.createBooking);

// Booking history
router.get("/history", isLoggedIn, bookingController.bookingHistory);

// Cancel booking
router.delete("/:bookingId", isLoggedIn, bookingController.cancelBooking);

module.exports = router;