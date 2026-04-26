const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middleware");
const bookingController = require("../controllers/booking");


router.post("/verify-payment", isLoggedIn, bookingController.verifyPayment);

// Booking form — date selection
router.get("/:id/book", isLoggedIn, bookingController.renderNewForm);

// Date submit — create Razorpay order
router.post("/:id/book", isLoggedIn, bookingController.createBooking);

// Booking history
router.get("/history", isLoggedIn, bookingController.bookingHistory);

// Cancel booking
router.delete("/:bookingId", isLoggedIn, bookingController.cancelBooking);

module.exports = router;