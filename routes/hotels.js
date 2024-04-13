const express = require("express");
const {
  getHotels,
  getHotel,
  createHotel,
  updateHotel,
  deleteHotel,
} = require("../controllers/hotels");
// const {
//   getAppointments,
//   addAppointment,
// } = require("../controllers/appointments"); // By NORTH

// // Include other resource routers
// const appointmentRouter = require("./appointments");

// Create express router
const router = express.Router();

// Import route protect middleware
const { protect, authorize } = require("../middleware/auth");

// // Re-route into other resource routers
// router.use("/:hospitalId/appointments/", appointmentRouter);

// Assign controller to each route
router.route("/").get(getHotels).post(protect, authorize("admin"), createHotel);
router
  .route("/:id")
  .get(getHotel)
  .put(protect, authorize("admin"), updateHotel)
  .delete(protect, authorize("admin"), deleteHotel);

// Export
module.exports = router;
