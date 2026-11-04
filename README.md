# Internsight — Web Programming & Database Project

โปรเจกต์เว็บไซต์รีวิวและแบ่งปันประสบการณ์ฝึกงาน (**Internsight**) ที่เชื่อมต่อฐานข้อมูลทั้งแบบ **SQL (PostgreSQL)** และ **NoSQL (MongoDB)** ผ่าน **Node.js + Express**

---

## 📌 สรุปสิ่งที่ได้ตั้งค่าและทำไปแล้ว

1. **เตรียมระบบ Backend (Node.js + Express)**
   - สร้าง `package.json` และติดตั้งไลบรารีหลัก:
     - `express`: สร้าง Web Server และ API
     - `pg`: เชื่อมต่อฐานข้อมูล **PostgreSQL** (ฝั่ง SQL)
     - `mongoose`: เชื่อมต่อฐานข้อมูล **MongoDB** (ฝั่ง NoSQL)
     - `dotenv`: จัดการตัวแปรสภาพแวดล้อมและรหัสผ่านในไฟล์ `.env`
     - `cors`: อนุญาตให้ Frontend เรียกใช้งาน API ได้
2. **ตั้งค่าความปลอดภัยใน `.gitignore`**
   - เพิ่ม `node_modules/` และ `.env` ลงใน `.gitignore` เพื่อป้องกันไม่ให้ไฟล์ไลบรารีขนาดใหญ่และรหัสผ่านฐานข้อมูลหลุดขึ้น GitHub
3. **สร้างและเชื่อมต่อฐานข้อมูล PostgreSQL (SQL)**
   - สร้าง Database ชื่อ `internsight_db` ใน **pgAdmin 4**
   - สร้างตารางเริ่มต้น `users` สำหรับเก็บข้อมูลสมาชิก
4. **เชื่อมต่อฐานข้อมูล MongoDB (NoSQL)**
   - เชื่อมต่อเข้ากับ Local MongoDB Server (`mongodb://127.0.0.1:27017/internsight_nosql`) ผ่านแอป **MongoDB Compass**
5. **สร้างไฟล์ `server.js`**
   - ตั้งค่า Express ให้เปิดหน้าเว็บจากโฟลเดอร์ `public/` และเชื่อมต่อทั้ง PostgreSQL และ MongoDB พร้อมกัน

---

## 🛠️ คู่มือการติดตั้งและรันโปรเจกต์ (สำหรับสมาชิกในทีม)

เมื่อดึงโค้ด (`git pull` หรือ `git clone`) ลงเครื่องแล้ว ให้ทำตามขั้นตอนนี้เพื่อรันโปรเจกต์และเชื่อมต่อ Database:

### 1. ติดตั้งไลบรารีทั้งหมด
เปิด Terminal ในโฟลเดอร์โปรเจกต์แล้วรันคำสั่ง:
```bash
npm install
```
*(หากต้องการติดตั้งแยกเอง: `npm install express pg mongoose dotenv cors`)*

---

### 2. ตั้งค่าฐานข้อมูล PostgreSQL (ผ่าน pgAdmin 4)
1. เปิดโปรแกรม **pgAdmin 4** -> กางเมนู `Servers` -> คลิกขวาที่ **`Databases`** -> เลือก **`Create` > `Database...`**
2. ตั้งชื่อ Database ว่า **`internsight_db`** แล้วกด **Save**
3. คลิกขวาที่ `internsight_db` -> เลือก **`Query Tool`** แล้วรันคำสั่ง SQL ด้านล่างนี้ (กด `F5` หรือปุ่ม `▶`):

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(20) NOT NULL UNIQUE,
  admission_year INT NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 3. ตั้งค่าฐานข้อมูล MongoDB (ผ่าน MongoDB Compass)
1. เปิดโปรแกรม **MongoDB Compass**
2. กด **Add new connection** (หรือใช้ค่าเริ่มต้น `mongodb://localhost:27017/`) แล้วกด **Save & Connect**
   > **หมายเหตุ:** MongoDB จะยังไม่แสดงชื่อ Database `internsight_nosql` จนกว่าจะมีข้อมูลชิ้นแรกถูกบันทึกลงไป (Lazy Creation)

---

### 4. สร้างไฟล์ `.env`
สร้างไฟล์ชื่อ **`.env`** ไว้ที่โฟลเดอร์นอกสุดของโปรเจกต์ (ระดับเดียวกับ `package.json` และ `server.js`) แล้วใส่ค่าตามนี้:

```env
PORT=3000

# ตั้งค่า PostgreSQL (SQL)
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=ใส่รหัสผ่าน_PostgreSQL_ของเครื่องคุณตรงนี้
PG_DATABASE=internsight_db

# ตั้งค่า MongoDB (NoSQL)
MONGO_URI=mongodb://127.0.0.1:27017/internsight_nosql
```

---

### 5. รันเซิร์ฟเวอร์และทดสอบ
พิมพ์คำสั่งใน Terminal:
```bash
node server.js
```

หากเชื่อมต่อสำเร็จ ใน Terminal จะแสดงข้อความ:
```text
Server running at http://localhost:3000/login.html
Connected to PostgreSQL (internsight_db)
Connected to MongoDB (internsight_nosql)
```

สามารถเปิดใช้งานหน้าเว็บผ่านเบราว์เซอร์ได้ที่:
- หน้าเข้าสู่ระบบ: `http://localhost:3000/login.html`
- หน้าสมัครสมาชิก: `http://localhost:3000/register.html`
- หน้าหลัก: `http://localhost:3000/home.html`
- หน้าค้นหาและตัวกรอง: `http://localhost:3000/filter-page.html`
- หน้าเขียนรีวิว: `http://localhost:3000/form-post-review.html`

---

## 🔄 คู่มือคำสั่ง Git เช็ค Conflict ก่อนรวมโค้ด

เวลาต้องการดึงข้อมูลล่าสุดจาก GitHub มาเช็คว่ามีโค้ดชนกัน (Conflict) หรือไม่ โดยไม่กระทบไฟล์ที่กำลังทำอยู่:

```bash
# 1. ดึงข้อมูลล่าสุดจาก GitHub ลงมาโดยยังไม่ Merge
git fetch origin

# 2. เช็คแบบจำลองว่าถ้า Merge กับ origin/main จะติด Conflict หรือไม่
git merge-tree --write-tree HEAD origin/main
```
- หากแสดงเฉพาะรหัส Commit Hash บรรทัดเดียว = **ไม่มี Conflict**
- หากแสดงข้อความ `CONFLICT` = **มีไฟล์ที่ชนกัน**
