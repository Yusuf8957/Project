const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middleware");
const bookingController = require("../controllers/booking");

// History
router.get("/history", isLoggedIn, bookingController.bookingHistory);

// Cancel
router.delete("/cancel/:bookingId", isLoggedIn, bookingController.cancelBooking);

module.exports = router;