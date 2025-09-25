const express = require("express");
const Booking = require("../models/Booking");
const jwt = require("jsonwebtoken");

const router = express.Router();
const JWT_SECRET = "your_jwt_secret";

// Middleware to verify customer
function authCustomer(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// Book a service (customer only)
router.post("/book", authCustomer, async (req, res) => {
  if (req.user.role !== "customer") return res.status(403).json({ error: "Only customers can book services" });
  const { serviceId } = req.body;
  try {
    const booking = await Booking.create({
      service: serviceId,
      customer: req.user.id
    });
    res.json({ booking });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get bookings for customer
router.get("/my", authCustomer, async (req, res) => {
  const bookings = await Booking.find({ customer: req.user.id }).populate("service");
  res.json({ bookings });
});

module.exports = router;