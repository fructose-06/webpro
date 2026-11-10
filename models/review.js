const mongoose = require("mongoose");

// Sub-schema สำหรับ Weak Entity: INTERVIEW_QUESTION (PK ร่วม: review_id + question_no)
const interviewQuestionSchema = new mongoose.Schema(
    {
        question_no: { type: Number, required: true },
        question_title: { type: String, required: true },
        difficulty: { type: String, default: "ง่าย" }
    },
    { _id: false }
);

// Sub-schema สำหรับ Weak Entity: REVIEW_COMMENT (PK ร่วม: review_id + comment_no)
// รองรับ Recursive Relationship: REPLIES_TO (parent_comment_no) และ Writes (author_id)
const reviewCommentSchema = new mongoose.Schema(
    {
        comment_no: { type: Number, required: true },
        parent_comment_no: { type: Number, default: null },
        author_id: { type: Number, default: null },
        author_name: { type: String, default: "นักศึกษา" },
        content: { type: String, required: true }
    },
    {
        _id: false,
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
    }
);

// Main Schema: INTERNSHIP_REVIEW
const reviewSchema = new mongoose.Schema(
    {
        review_id: { type: Number, unique: true, sparse: true },
        user_id: { type: Number, default: null }, // FK จาก USER (SUBMITS)
        author_name: { type: String, default: "นักศึกษาฝึกงาน" },

        // ข้อมูลจาก COMPANY (REVIEWS_FOR)
        company_id: { type: Number, default: null },
        company_name: { type: String, default: "" },
        industry_type: { type: String, default: "" },

        // ข้อมูลจาก JOB_ROLE (HAS_JOB_ROLE)
        job_id: { type: Number, default: null },
        job_name: { type: String, default: "" },

        // ข้อมูลจาก TECH_SKILL (REVIEW_SKILL)
        skills: [{ type: String }],

        // ข้อมูลจาก IMAGE (HAS_IMAGE: (0, N) — เก็บเฉพาะเมื่อมีการอัปโหลดรูปภาพจริงเท่านั้น)
        images: [
            new mongoose.Schema(
                {
                    image_id: { type: Number, required: true },
                    image: { type: String, required: true }
                },
                { _id: false }
            )
        ],

        // Attributes หลักของ INTERNSHIP_REVIEW
        is_anonymous: { type: Boolean, default: false },
        description: { type: String, default: "" },
        work_mode: { type: String, default: "On-site" },
        rating_culture: { type: Number, min: 0, max: 5, default: 0 },
        rating_workload: { type: Number, min: 0, max: 5, default: 0 },
        rating_mentor: { type: Number, min: 0, max: 5, default: 0 },
        pros: { type: String, default: "" },
        cons: { type: String, default: "" },
        daily_pay: { type: String, default: "" },

        // UPVOTES & Bookmarks (ความสัมพันธ์ M:N กับ USER)
        likes: { type: Number, default: 0 },
        upvoted_by: [{ type: Number }],
        bookmarked_by: [
            {
                user_id: { type: Number },
                created_at: { type: Date, default: Date.now }
            }
        ],

        // Weak Entities ที่ขึ้นตรงกับ INTERNSHIP_REVIEW
        interview_questions: [interviewQuestionSchema],
        comments: [reviewCommentSchema]
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
    }
);

module.exports = mongoose.model("InternshipReview", reviewSchema);
