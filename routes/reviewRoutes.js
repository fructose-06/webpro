const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const InternshipReview = require("../models/review");

// Helper: ค้นหารีวิวจาก review_id (1, 2, 3...) หรือ MongoDB _id
async function findReviewByIdParam(idParam) {
    const numId = Number(idParam);
    if (Number.isInteger(numId) && numId > 0) {
        const byNum = await InternshipReview.findOne({ review_id: numId });
        if (byNum) return byNum;
    }
    if (mongoose.Types.ObjectId.isValid(idParam)) {
        return await InternshipReview.findById(idParam);
    }
    return null;
}

// 1. สร้างรีวิวใหม่ (POST /api/reviews)
router.post("/", async (req, res) => {
    try {
        const lastReview = await InternshipReview.findOne({ review_id: { $ne: null } }).sort({ review_id: -1 });
        const nextId = lastReview && lastReview.review_id ? lastReview.review_id + 1 : 1;

        // จัดลำดับ question_no (1, 2, 3...) สำหรับ Weak Entity: INTERVIEW_QUESTION
        const rawQuestions = Array.isArray(req.body.interview_questions) ? req.body.interview_questions : [];
        const numberedQuestions = rawQuestions.map((q, idx) => ({
            question_no: idx + 1,
            question_title: q.question_title || q.text || "",
            difficulty: q.difficulty || "ง่าย"
        }));

        // จัดการข้อมูล IMAGE (HAS_IMAGE: (0, N)) — ถ้าไม่มีรูปภาพ ไม่ต้องบันทึกฟิลด์รูปลง DB
        const rawImages = [];
        if (Array.isArray(req.body.images)) {
            req.body.images.forEach((img) => {
                const src = typeof img === "string" ? img : img?.image;
                if (typeof src === "string" && src.trim() !== "") {
                    rawImages.push(src.trim());
                }
            });
        } else if (typeof req.body.image === "string" && req.body.image.trim() !== "") {
            rawImages.push(req.body.image.trim());
        }

        const numberedImages = rawImages.map((imgData, idx) => ({
            image_id: idx + 1,
            image: imgData
        }));

        const reviewPayload = { ...req.body };
        delete reviewPayload.image;
        delete reviewPayload.image_id;

        const newReview = new InternshipReview({
            ...reviewPayload,
            review_id: nextId,
            interview_questions: numberedQuestions,
            images: numberedImages
        });
        const savedReview = await newReview.save();
        res.status(201).json(savedReview);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. ดึงรีวิวทั้งหมด (GET /api/reviews)
router.get("/", async (req, res) => {
    try {
        const reviews = await InternshipReview.find().sort({ created_at: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 3. ดึงรีวิวรายตัวตาม review_id หรือ _id (GET /api/reviews/:id)
router.get("/:id", async (req, res) => {
    try {
        const review = await findReviewByIdParam(req.params.id);
        if (!review) {
            return res.status(404).json({ message: "ไม่พบข้อมูลรีวิวนี้" });
        }
        res.json(review);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 4. กดถูกใจรีวิว / UPVOTES (POST /api/reviews/:id/like)
router.post("/:id/like", async (req, res) => {
    try {
        const review = await findReviewByIdParam(req.params.id);
        if (!review) {
            return res.status(404).json({ message: "ไม่พบข้อมูลรีวิวนี้" });
        }
        review.likes = (review.likes || 0) + 1;
        await review.save();
        res.json(review);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 5. เพิ่มความคิดเห็นในรีวิว / HAS_COMMENT & REPLIES_TO (POST /api/reviews/:id/comments)
router.post("/:id/comments", async (req, res) => {
    try {
        const { content, author_id, author_name, parent_comment_no } = req.body || {};
        if (!content || !String(content).trim()) {
            return res.status(400).json({ message: "กรุณากรอกข้อความคิดเห็น" });
        }
        const review = await findReviewByIdParam(req.params.id);
        if (!review) {
            return res.status(404).json({ message: "ไม่พบข้อมูลรีวิวนี้" });
        }

        // รันเลข comment_no (Partial Key ของ Weak Entity REVIEW_COMMENT)
        const maxCommentNo = (review.comments || []).reduce(
            (max, c) => (c.comment_no && c.comment_no > max ? c.comment_no : max),
            0
        );
        const nextCommentNo = maxCommentNo + 1;

        review.comments.push({
            comment_no: nextCommentNo,
            parent_comment_no: parent_comment_no ? Number(parent_comment_no) : null,
            author_id: author_id ? Number(author_id) : null,
            author_name: author_name || "นักศึกษา",
            content: String(content).trim()
        });
        await review.save();
        res.status(201).json(review);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 6. แก้ไขความคิดเห็น (PUT /api/reviews/:id/comments/:commentNo)
router.put("/:id/comments/:commentNo", async (req, res) => {
    try {
        const { content } = req.body || {};
        if (!content || !String(content).trim()) {
            return res.status(400).json({ message: "กรุณากรอกข้อความคิดเห็น" });
        }
        const review = await findReviewByIdParam(req.params.id);
        if (!review) {
            return res.status(404).json({ message: "ไม่พบข้อมูลรีวิวนี้" });
        }
        const commentNo = Number(req.params.commentNo);
        const targetComment = (review.comments || []).find((c) => c.comment_no === commentNo);
        if (!targetComment) {
            return res.status(404).json({ message: "ไม่พบความคิดเห็นนี้" });
        }
        targetComment.content = String(content).trim();
        targetComment.updated_at = new Date();
        await review.save();
        res.json(review);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;