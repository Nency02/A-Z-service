const express = require("express");
const Service = require("../models/Service");
const jwt = require("jsonwebtoken");

const router = express.Router();
const JWT_SECRET = "your_jwt_secret";

// Middleware to verify provider
function authProvider(req, res, next) {
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

// Add a service (provider only)
router.post("/add", authProvider, async (req, res) => {
  if (req.user.role !== "provider") return res.status(403).json({ error: "Only providers can add services" });
  const { title, description, category, price, location } = req.body;
  try {
    const service = await Service.create({
      provider: req.user.id,
      title,
      description,
      category,
      price,
      location
    });
    res.json({ service });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get all services (for customers)
router.get("/", async (req, res) => {
  const services = await Service.find().populate("provider", "name email");
  res.json({ services });
});

// Get services by provider
router.get("/my", authProvider, async (req, res) => {
  const services = await Service.find({ provider: req.user.id });
  res.json({ services });
});

module.exports = router;