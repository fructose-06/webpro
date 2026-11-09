const express = require("express");
const router = express.Router();
const InternshipReview = require("../models/review");

router.post("/", async (req, res) => {
    try {
        const newReview = new InternshipReview(req.body);
        const savedReview = await newReview.save();
        res.status(201).json(savedReview);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;