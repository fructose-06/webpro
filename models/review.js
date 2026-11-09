const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    is_anonymous: { type: Boolean, default: false },
    description: { type: String, default: "" },
    work_mode: { type: String, default: "On-site" },
    rating_culture: { type: Number, min: 0, max: 5, default: 0 },
    rating_workload: { type: Number, min: 0, max: 5, default: 0 },
    rating_mentor: { type: Number, min: 0, max: 5, default: 0 },
    pros: { type: String, default: "" },
    cons: { type: String, default: "" },
    daily_pay: { type: String, default: "" }
},
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
    }
);

module.exports = mongoose.model("InternshipReview", reviewSchema);