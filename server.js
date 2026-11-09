require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");
const mongoose = require("mongoose");
const { argon2, randomBytes, timingSafeEqual } = require("node:crypto");
const { promisify } = require("node:util");
const deriveKey = promisify(argon2);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware พื้นฐาน
app.use(cors());
const guestFiles = new Set([
    "/login.html", "/register.html",
    "/css/login.css", "/css/register.css", "/js/login.js", "/js/register.js"
]);

app.use((req, res, next) => {
    const readsFile = req.method === "GET" || req.method === "HEAD";
    if (readsFile && guestFiles.has(req.path)) return next();

    res.set("Cache-Control", "private, no-store");
    if (req.method === "POST" &&
        (req.path === "/api/auth/register" || req.path === "/api/auth/login")) return next();
    if (activeSession(req)) return next();
    if (readsFile && !/^\/api(?:\/|$)/i.test(req.path)) return res.redirect("/login.html");
    return res.sendStatus(401);
});

app.get("/", (req, res) => res.redirect("/home.html"));

app.use(express.json({ limit: "10mb" })); // ให้อ่านข้อมูล JSON ที่ส่งมาจากหน้าเว็บได้

// 1. เชื่อมต่อ PostgreSQL (SQL)
const pgPool = new Pool({
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
});

pgPool
    .connect()
    .then((client) => {
        console.log("Connected to PostgreSQL (internsight_db)");
        client.release();
    })
    .catch((err) => {
        console.error("PostgreSQL connection error:", err.message);
    });

async function hashPassword(password) {
    const salt = randomBytes(16);
    const digest = await deriveKey("argon2id", {
        message: Buffer.from(password), nonce: salt, memory: 19456,
        passes: 2, parallelism: 1, tagLength: 32
    });
    const encode = (bytes) => bytes.toString("base64").replace(/=+$/, "");
    return `$argon2id$v=19$m=19456,t=2,p=1$${encode(salt)}$${encode(digest)}`;
}

async function matchesPassword(password, storedHash) {
    const parts = storedHash?.split("$");
    if (storedHash && (parts.length !== 6 || parts[1] !== "argon2id" ||
        parts[2] !== "v=19" || parts[3] !== "m=19456,t=2,p=1")) {
        throw new Error("unsupported_password_hash");
    }
    const salt = storedHash ? Buffer.from(parts[4], "base64") : Buffer.alloc(16);
    const expected = storedHash ? Buffer.from(parts[5], "base64") : Buffer.alloc(32);
    const actual = await deriveKey("argon2id", {
        message: Buffer.from(password), nonce: salt, memory: 19456,
        passes: 2, parallelism: 1, tagLength: 32
    });
    return expected.length === actual.length && timingSafeEqual(expected, actual);
}

app.post("/api/auth/register", async (req, res) => {
    const { studentId, email, admissionYear, password } = req.body || {};
    const address = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (typeof studentId !== "string" || !/^[0-9]{1,20}$/.test(studentId) ||
        !Number.isInteger(admissionYear) || admissionYear < 2503 ||
        admissionYear > new Date().getFullYear() + 543 ||
        !/^[^\s@]+@[^\s@]+$/.test(address) || address.length > 100 ||
        typeof password !== "string" || !password.length || password.length > 1024) {
        return res.status(400).json({ message: "กรุณาตรวจรหัสนักศึกษา ปีที่เข้า อีเมล และรหัสผ่าน" });
    }

    try {
        const hash = await hashPassword(password);
        await pgPool.query(
            "INSERT INTO public.users (student_code, admission_year, email, password_hash) VALUES ($1, $2, $3, $4)",
            [studentId, admissionYear, address, hash]
        );
        return res.status(201).json({ message: "สร้างบัญชีสำเร็จ" });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({ message: "รหัสนักศึกษาหรืออีเมลนี้สมัครบัญชีแล้ว" });
        }
        console.error({ event: "registration_failed", code: error.code || error.name });
        return res.status(500).json({ message: "บันทึกบัญชีไม่ได้ กรุณาลองอีกครั้ง" });
    }
});

// เก็บสถานะการเข้าสู่ระบบเฉพาะช่วงที่เซิร์ฟเวอร์ทำงาน
const sessions = new Map();
const sessionLimitMs = 24 * 60 * 60 * 1000;
function sessionKey(req) {
    return /(?:^|; *)internsight_sid=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || "")?.[1];
}
function activeSession(req) {
    const session = sessions.get(sessionKey(req));
    return session && session.until > Date.now() ? session : null;
}

app.use(express.static(path.join(__dirname, "private"), { cacheControl: false, index: false }));

app.use(express.static(path.join(__dirname, "public"))); // ให้เปิดไฟล์ HTML ในโฟลเดอร์ public ได้

setInterval(() => {
    for (const [key, session] of sessions) {
        if (session.until <= Date.now()) sessions.delete(key);
    }
}, 60000).unref();

app.use("/api/auth", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

app.post("/api/auth/login", async (req, res) => {
    const { studentId, password } = req.body || {};
    if (typeof studentId !== "string" || !/^[0-9]{1,20}$/.test(studentId) ||
        typeof password !== "string" || !password.length || password.length > 1024) {
        return res.status(400).json({ message: "กรุณาตรวจรหัสนักศึกษาและรหัสผ่าน" });
    }
    try {
        const { rows } = await pgPool.query(
            "SELECT user_id, student_code, user_name, password_hash FROM public.users WHERE student_code = $1",
            [studentId]
        );
        const user = rows[0];
        if (!await matchesPassword(password, user?.password_hash) || !user) {
            return res.status(401).json({ message: "รหัสนักศึกษาหรือรหัสผ่านไม่ถูกต้อง" });
        }
        sessions.delete(sessionKey(req));
        const key = randomBytes(32).toString("hex");
        const profile = { userId: user.user_id, studentCode: user.student_code, userName: user.user_name };
        sessions.set(key, { profile, until: Date.now() + sessionLimitMs });
        res.cookie("internsight_sid", key, { httpOnly: true, sameSite: "lax", secure: req.secure, path: "/" });
        return res.sendStatus(204);
    } catch (error) {
        console.error({ event: "login_failed", code: error.code || error.name });
        return res.status(500).json({ message: "เข้าสู่ระบบไม่ได้ กรุณาลองอีกครั้ง" });
    }
});

app.get("/api/auth/me", (req, res) => {
    const session = activeSession(req);
    if (!session) return res.sendStatus(401);
    return res.json(session.profile);
});

app.get("/api/settings", async (req, res) => {
    const { userId } = activeSession(req).profile;
    const result = await pgPool.query(
        "SELECT student_code, email, user_name FROM public.users WHERE user_id = $1", [userId]
    );
    if (!result.rowCount) return res.sendStatus(401);
    return res.json(result.rows[0]);
});

app.put("/api/settings/profile", async (req, res) => {
    const { name } = req.body || {};
    if (typeof name !== "string" || name.trim().length > 100) {
        return res.status(400).json({ message: "กรุณาตรวจชื่อที่แสดง" });
    }
    const { userId } = activeSession(req).profile;
    const userName = name.trim() || null;
    const result = await pgPool.query(
        "UPDATE public.users SET user_name = $1 WHERE user_id = $2",
        [userName, userId]
    );
    if (!result.rowCount) return res.sendStatus(401);
    for (const session of sessions.values()) {
        if (session.profile.userId === userId) session.profile.userName = userName;
    }
    return res.sendStatus(204);
});

app.put("/api/settings/password", async (req, res) => {
    const { current, replacement } = req.body || {};
    if (typeof current !== "string" || !current.length || current.length > 1024 ||
        typeof replacement !== "string" || replacement.length < 8 || replacement.length > 1024 ||
        !/[a-z]/i.test(replacement) || !/[0-9]/.test(replacement) || current === replacement) {
        return res.status(400).json({ message: "ตรวจรหัสผ่านใหม่ตามเงื่อนไขบนฟอร์ม" });
    }
    const { userId } = activeSession(req).profile;
    const result = await pgPool.query("SELECT password_hash FROM public.users WHERE user_id = $1", [userId]);
    const previous = result.rows[0]?.password_hash;
    if (!previous || !await matchesPassword(current, previous)) {
        return res.status(403).json({ message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" });
    }
    const updated = await pgPool.query(
        "UPDATE public.users SET password_hash = $1 WHERE user_id = $2 AND password_hash = $3",
        [await hashPassword(replacement), userId, previous]
    );
    if (!updated.rowCount) return res.status(409).json({ message: "ข้อมูลบัญชีเปลี่ยนแล้ว กรุณาลองใหม่" });
    for (const [key, session] of sessions) {
        if (session.profile.userId === userId && key !== sessionKey(req)) sessions.delete(key);
    }
    return res.sendStatus(204);
});

app.use("/api/settings", (error, req, res, next) => {
    console.error({ event: "settings_failed", code: error.code || error.name });
    res.status(500).json({ message: "ติดต่อฐานข้อมูลไม่ได้ กรุณาตรวจการตั้งค่าฐานข้อมูล" });
});

app.post("/api/auth/logout", (req, res) => {
    sessions.delete(sessionKey(req));
    res.clearCookie("internsight_sid", { path: "/", httpOnly: true, sameSite: "lax", secure: req.secure });
    return res.sendStatus(204);
});

// 2. เชื่อมต่อ MongoDB (NoSQL)
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("Connected to MongoDB (internsight_nosql)");
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err.message);
    });

const reviewRoutes = require("./routes/reviewRoutes");
app.use("/api/reviews", reviewRoutes);

// เริ่มรัน Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/login.html`);
});
