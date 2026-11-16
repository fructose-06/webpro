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
            user_id: req.user.userId,
            author_name: req.user.userName || "สมาชิก Internsight",
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

router.get("/bookmarks", async (req, res) => {
    try {
        const session = req.app.locals.activeSession(req);
        if (!session) {
            return res.sendStatus(401);
        }
        const userId = session.profile.userId;
        let reviews = await InternshipReview.find({"bookmarked_by.user_id": userId});
        reviews.sort((a, b) => {
            const aBookmark = a.bookmarked_by.find(
                x => x.user_id === userId
            );
            const bBookmark = b.bookmarked_by.find(
                x => x.user_id === userId
            );
            return (
                new Date(bBookmark?.created_at || 0) -
                new Date(aBookmark?.created_at || 0)
            );
        });

        res.json(reviews);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
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

// 4. กดถูกใจ / ยกเลิกถูกใจรีวิว / UPVOTES (POST /api/reviews/:id/like)
router.post("/:id/like", async (req, res) => {
    try {
        const review = await findReviewByIdParam(req.params.id);
        if (!review) {
            return res.status(404).json({ message: "ไม่พบข้อมูลรีวิวนี้" });
        }
        const userId = req.body?.user_id ? Number(req.body.user_id) : null;
        if (!Array.isArray(review.upvoted_by)) {
            review.upvoted_by = [];
        }

        if (userId) {
            const idx = review.upvoted_by.indexOf(userId);
            if (idx >= 0) {
                review.upvoted_by.splice(idx, 1);
                review.likes = Math.max(0, (review.likes || 0) - 1);
            } else {
                review.upvoted_by.push(userId);
                review.likes = (review.likes || 0) + 1;
            }
        } else {
            review.likes = (review.likes || 0) + 1;
        }

        await review.save();
        res.json(review);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 4.1 บันทึก / ยกเลิกบันทึกรีวิว / BOOKMARKS (POST /api/reviews/:id/bookmark)
router.post("/:id/bookmark", async (req, res) => {
    try {
        const review = await findReviewByIdParam(req.params.id);
        if (!review) {
            return res.status(404).json({ message: "ไม่พบข้อมูลรีวิวนี้" });
        }

        const session = typeof req.app.locals.activeSession === "function"
            ? req.app.locals.activeSession(req)
            : null;
        const userId = session?.profile?.userId
            ? Number(session.profile.userId)
            : (req.body?.user_id ? Number(req.body.user_id) : null);

        if (!userId) {
            return res.status(401).json({ message: "กรุณาเข้าสู่ระบบก่อนบันทึกรีวิว" });
        }
        if (!Array.isArray(review.bookmarked_by)) {
            review.bookmarked_by = [];
        }

        const idx = review.bookmarked_by.findIndex((b) => Number(b.user_id) === userId);
        if (idx >= 0) {
            review.bookmarked_by.splice(idx, 1);
        } else {
            review.bookmarked_by.push({ user_id: userId, created_at: new Date() });
        }

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
        const trimmed = String(content || "").trim();
        if (!trimmed) {
            return res.status(400).json({ message: "กรุณากรอกข้อความคิดเห็น" });
        }
        if (trimmed.length > 500) {
            return res.status(400).json({ message: "ความคิดเห็นต้องไม่เกิน 500 ตัวอักษร" });
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
            content: trimmed,
            likes: 0,
            liked_by: [],
            is_edited: false
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
        const { content, user_id } = req.body || {};
        const trimmed = String(content || "").trim();
        if (!trimmed) {
            return res.status(400).json({ message: "กรุณากรอกข้อความคิดเห็น" });
        }
        if (trimmed.length > 500) {
            return res.status(400).json({ message: "ความคิดเห็นต้องไม่เกิน 500 ตัวอักษร" });
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
        if (targetComment.author_id && user_id && Number(targetComment.author_id) !== Number(user_id)) {
            return res.status(403).json({ message: "คุณไม่มีสิทธิ์แก้ไขความคิดเห็นนี้" });
        }
        targetComment.content = trimmed;
        targetComment.is_edited = true;
        targetComment.updated_at = new Date();
        await review.save();
        res.json(review);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 7. ลบความคิดเห็นและคำตอบย่อยทั้งหมด (DELETE /api/reviews/:id/comments/:commentNo)
router.delete("/:id/comments/:commentNo", async (req, res) => {
    try {
        const review = await findReviewByIdParam(req.params.id);
        if (!review) {
            return res.status(404).json({ message: "ไม่พบข้อมูลรีวิวนี้" });
        }
        const commentNo = Number(req.params.commentNo);
        const targetComment = (review.comments || []).find((c) => c.comment_no === commentNo);
        if (!targetComment) {
            return res.status(404).json({ message: "ไม่พบความคิดเห็นนี้" });
        }
        const userId = req.body?.user_id || req.query?.user_id;
        if (targetComment.author_id && userId && Number(targetComment.author_id) !== Number(userId)) {
            return res.status(403).json({ message: "คุณไม่มีสิทธิ์ลบความคิดเห็นนี้" });
        }

        // รวบรวม comment_no ที่ต้องลบ (รวมคำตอบย่อยแบบ recursive)
        const toDelete = new Set([commentNo]);
        let added = true;
        while (added) {
            added = false;
            for (const c of review.comments || []) {
                if (c.parent_comment_no && toDelete.has(c.parent_comment_no) && !toDelete.has(c.comment_no)) {
                    toDelete.add(c.comment_no);
                    added = true;
                }
            }
        }
        review.comments = (review.comments || []).filter((c) => !toDelete.has(c.comment_no));
        await review.save();
        res.json(review);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 8. กดถูกใจ / ยกเลิกถูกใจความคิดเห็น (POST /api/reviews/:id/comments/:commentNo/like)
router.post("/:id/comments/:commentNo/like", async (req, res) => {
    try {
        const review = await findReviewByIdParam(req.params.id);
        if (!review) {
            return res.status(404).json({ message: "ไม่พบข้อมูลรีวิวนี้" });
        }
        const commentNo = Number(req.params.commentNo);
        const targetComment = (review.comments || []).find((c) => c.comment_no === commentNo);
        if (!targetComment) {
            return res.status(404).json({ message: "ไม่พบความคิดเห็นนี้" });
        }

        const userId = req.body?.user_id ? Number(req.body.user_id) : null;
        if (!Array.isArray(targetComment.liked_by)) {
            targetComment.liked_by = [];
        }

        if (userId) {
            const idx = targetComment.liked_by.indexOf(userId);
            if (idx >= 0) {
                targetComment.liked_by.splice(idx, 1);
                targetComment.likes = Math.max(0, (targetComment.likes || 0) - 1);
            } else {
                targetComment.liked_by.push(userId);
                targetComment.likes = (targetComment.likes || 0) + 1;
            }
        } else {
            targetComment.likes = (targetComment.likes || 0) + 1;
        }

        await review.save();
        res.json(review);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;