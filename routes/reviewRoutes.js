const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const InternshipReview = require("../models/review");
const Company = require("../models/company");
const JobRole = require("../models/jobRole");
const TechSkill = require("../models/techSkill");

function escapeRegex(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function resolveCompany(companyName, industryType = "") {
    const cleanName = String(companyName || "").trim();
    if (!cleanName) return { company_id: null, company_name: "", industry_type: industryType };

    const existing = await Company.findOne({ company_name: new RegExp(`^${escapeRegex(cleanName)}$`, "i") });
    if (existing) {
        if (!existing.industry_type && industryType) {
            existing.industry_type = industryType;
            await existing.save();
        }
        return {
            company_id: existing.company_id,
            company_name: existing.company_name,
            industry_type: industryType || existing.industry_type || ""
        };
    }

    const [lastCompany, lastReviewCompany] = await Promise.all([
        Company.findOne().sort({ company_id: -1 }),
        InternshipReview.findOne({ company_id: { $ne: null } }).sort({ company_id: -1 })
    ]);
    const nextCompanyId = Math.max(lastCompany?.company_id || 0, lastReviewCompany?.company_id || 0) + 1;

    const created = await Company.create({
        company_id: nextCompanyId,
        company_name: cleanName,
        industry_type: String(industryType || "").trim()
    });
    return {
        company_id: created.company_id,
        company_name: created.company_name,
        industry_type: created.industry_type
    };
}

async function resolveJobRole(jobName) {
    const cleanName = String(jobName || "").trim();
    if (!cleanName) return { job_id: null, job_name: "" };

    const existing = await JobRole.findOne({ job_name: new RegExp(`^${escapeRegex(cleanName)}$`, "i") });
    if (existing) {
        return { job_id: existing.job_id, job_name: existing.job_name };
    }

    const [lastJob, lastReviewJob] = await Promise.all([
        JobRole.findOne().sort({ job_id: -1 }),
        InternshipReview.findOne({ job_id: { $ne: null } }).sort({ job_id: -1 })
    ]);
    const nextJobId = Math.max(lastJob?.job_id || 0, lastReviewJob?.job_id || 0) + 1;

    const created = await JobRole.create({
        job_id: nextJobId,
        job_name: cleanName
    });
    return { job_id: created.job_id, job_name: created.job_name };
}

async function resolveTechSkills(rawSkills = []) {
    const cleanNames = [...new Set((Array.isArray(rawSkills) ? rawSkills : []).map((s) => String(s || "").trim()).filter(Boolean))];
    const skillIds = [];
    const skillNames = [];

    for (const name of cleanNames) {
        let doc = await TechSkill.findOne({ skill_name: new RegExp(`^${escapeRegex(name)}$`, "i") });
        if (!doc) {
            const lastSkill = await TechSkill.findOne().sort({ skill_id: -1 });
            const nextSkillId = (lastSkill?.skill_id || 0) + 1;
            doc = await TechSkill.create({ skill_id: nextSkillId, skill_name: name });
        }
        skillIds.push(doc.skill_id);
        skillNames.push(doc.skill_name);
    }

    return { skill_ids: skillIds, skills: skillNames };
}

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

// Helper: ดึงชื่อล่าสุดจาก PostgreSQL (public.users) มาอัปเดตให้โพสต์และคอมเมนต์ที่ไม่ใช่ไม่ระบุตัวตน
async function attachCurrentAuthorNames(pgPool, docs) {
    if (!pgPool || !docs) return docs;
    const list = Array.isArray(docs) ? docs : [docs];
    const userIds = new Set();

    for (const doc of list) {
        if (doc?.user_id && !doc.is_anonymous) userIds.add(Number(doc.user_id));
        if (Array.isArray(doc?.comments)) {
            for (const c of doc.comments) {
                if (c?.author_id) userIds.add(Number(c.author_id));
            }
        }
    }

    if (userIds.size === 0) return docs;

    try {
        const { rows } = await pgPool.query(
            "SELECT user_id, user_name, profile_image FROM public.users WHERE user_id = ANY($1::int[])",
            [[...userIds]]
        );
        const userMap = new Map();
        for (const row of rows) {
            userMap.set(Number(row.user_id), {
                name: row.user_name && String(row.user_name).trim() ? String(row.user_name).trim() : null,
                image: row.profile_image || null
            });
        }

        for (const doc of list) {
            if (!doc) continue;
            if (doc.user_id && !doc.is_anonymous && userMap.has(Number(doc.user_id))) {
                const info = userMap.get(Number(doc.user_id));
                if (info.name) doc.author_name = info.name;
                if (typeof doc.set === "function") {
                    doc.set("author_image", info.image, { strict: false });
                } else {
                    doc.author_image = info.image;
                }
            }
            if (Array.isArray(doc.comments)) {
                for (const c of doc.comments) {
                    if (c?.author_id && userMap.has(Number(c.author_id))) {
                        const info = userMap.get(Number(c.author_id));
                        if (info.name) c.author_name = info.name;
                        if (typeof c.set === "function") {
                            c.set("author_image", info.image, { strict: false });
                        } else {
                            c.author_image = info.image;
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.error("attachCurrentAuthorNames error:", err.message);
    }

    return docs;
}

// 1. สร้างรีวิวใหม่ (POST /api/reviews)
router.post("/", async (req, res) => {
    try {
        const companyName = String(req.body?.company_name || "").trim();
        const jobName = String(req.body?.job_name || "").trim();
        const industryType = String(req.body?.industry_type || "").trim();
        const description = String(req.body?.description || "").trim();
        const pros = String(req.body?.pros || "").trim();
        const cons = String(req.body?.cons || "").trim();
        const skillsArr = Array.isArray(req.body?.skills) ? req.body.skills.filter((s) => String(s || "").trim() !== "") : [];
        if (!companyName || !jobName || !industryType || skillsArr.length === 0 || !description || !pros || !cons) {
            return res.status(400).json({ message: "กรุณากรอกข้อมูลสำคัญให้ครบถ้วน (บริษัท ตำแหน่ง ประเภท ทักษะ ประสบการณ์ ข้อดี และข้อเสีย)" });
        }

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

        const [resolvedCompany, resolvedJob, resolvedSkills] = await Promise.all([
            resolveCompany(reviewPayload.company_name, reviewPayload.industry_type),
            resolveJobRole(reviewPayload.job_name),
            resolveTechSkills(reviewPayload.skills)
        ]);

        const newReview = new InternshipReview({
            ...reviewPayload,
            company_id: resolvedCompany.company_id,
            company_name: resolvedCompany.company_name || reviewPayload.company_name,
            industry_type: resolvedCompany.industry_type || reviewPayload.industry_type,
            job_id: resolvedJob.job_id,
            job_name: resolvedJob.job_name || reviewPayload.job_name,
            skill_ids: resolvedSkills.skill_ids,
            skills: resolvedSkills.skills,
            user_id: req.user.userId,
            author_name: reviewPayload.is_anonymous
                ? "ผู้ไม่ประสงค์ออกนาม"
                : (req.user.userName || "สมาชิก Internsight"),
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
        await attachCurrentAuthorNames(req.app.locals.pgPool, reviews);
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

        await attachCurrentAuthorNames(req.app.locals.pgPool, reviews);
        res.json(reviews);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
});

// 2.2 ดึงตัวเลือกที่มีอยู่ใน Database สำหรับหน้าเขียนรีวิว (GET /api/reviews/options)
router.get("/options", async (req, res) => {
    try {
        const [
            masterCompanies,
            masterJobs,
            masterSkills,
            rawCompanies,
            rawPositions,
            rawIndustries,
            rawSkills,
            companyIndustryDocs
        ] = await Promise.all([
            Company.find({}, { company_id: 1, company_name: 1, industry_type: 1, _id: 0 }),
            JobRole.find({}, { job_id: 1, job_name: 1, _id: 0 }),
            TechSkill.find({}, { skill_id: 1, skill_name: 1, _id: 0 }),
            InternshipReview.distinct("company_name"),
            InternshipReview.distinct("job_name"),
            InternshipReview.distinct("industry_type"),
            InternshipReview.distinct("skills"),
            InternshipReview.find(
                { company_name: { $ne: "" }, industry_type: { $ne: "" } },
                { company_name: 1, industry_type: 1, _id: 0 }
            ).sort({ created_at: -1 })
        ]);

        const cleanSort = (arr) =>
            [...new Set((arr || []).map((v) => String(v || "").trim()).filter(Boolean))].sort((a, b) =>
                a.localeCompare(b, "th")
            );

        const companyIndustries = {};
        for (const c of masterCompanies) {
            const cName = String(c.company_name || "").trim();
            const ind = String(c.industry_type || "").trim();
            if (cName && ind) companyIndustries[cName] = ind;
        }
        for (const doc of companyIndustryDocs) {
            const cName = String(doc.company_name || "").trim();
            const ind = String(doc.industry_type || "").trim();
            if (cName && ind && !companyIndustries[cName]) {
                companyIndustries[cName] = ind;
            }
        }

        res.json({
            companies: cleanSort([...masterCompanies.map((c) => c.company_name), ...rawCompanies]),
            positions: cleanSort([...masterJobs.map((j) => j.job_name), ...rawPositions]),
            industries: cleanSort([...masterCompanies.map((c) => c.industry_type), ...rawIndustries]),
            skills: cleanSort([...masterSkills.map((s) => s.skill_name), ...rawSkills]),
            companyIndustries
        });
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
        await attachCurrentAuthorNames(req.app.locals.pgPool, review);
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
        await attachCurrentAuthorNames(req.app.locals.pgPool, review);
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
        await attachCurrentAuthorNames(req.app.locals.pgPool, review);
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
        await attachCurrentAuthorNames(req.app.locals.pgPool, review);
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
        await attachCurrentAuthorNames(req.app.locals.pgPool, review);
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
        await attachCurrentAuthorNames(req.app.locals.pgPool, review);
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
        await attachCurrentAuthorNames(req.app.locals.pgPool, review);
        res.json(review);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;