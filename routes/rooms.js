const express = require("express");
const {
  getRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom,
} = require("../controllers/rooms");
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
router.route("/").get(getRooms).post(protect, authorize("admin"), createRoom);
router
  .route("/:id")
  .get(getRoom)
  .put(protect, authorize("admin"), updateRoom)
  .delete(protect, authorize("admin"), deleteRoom);

// Export
module.exports = router;
