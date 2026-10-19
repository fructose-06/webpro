lucide.createIcons();

// 1. เรนเดอร์ไอคอนของ Lucide ให้แสดงผล
lucide.createIcons();

// 2. ระบบดึงชื่อผู้ใช้จาก localStorage (จำลองระบบ Login)
function loadUserProfile() {
    // ลองหาชื่อในความจำของเบราว์เซอร์ ถ้าไม่มีให้ใช้ค่าเริ่มต้น 'User - 101'
    let savedUser = localStorage.getItem('currentUser');
    if (!savedUser) {
        savedUser = 'User - 101';
        localStorage.setItem('currentUser', savedUser);
    }

    // แสดงชื่อบนหน้าเว็บจริง
    const userNameElement = document.getElementById('currentUserName');
    if (userNameElement) {
        userNameElement.textContent = savedUser;
    }
}

// 3. คลิกที่โปรไฟล์เพื่อลองเปลี่ยนชื่อผู้ใช้เล่น (ทดสอบการจำลอง)
document.getElementById('userProfileBtn')?.addEventListener('click', () => {
    const newName = prompt('ลองพิมพ์ชื่อใหม่เพื่อทดสอบระบบจำลอง Login:', localStorage.getItem('currentUser'));
    if (newName && newName.trim() !== '') {
        localStorage.setItem('currentUser', newName.trim());
        loadUserProfile(); // อัปเดตชื่อบนหน้าจอทันที
    }
});

// รันระบบโหลดชื่อเมื่อเปิดหน้าเว็บ
loadUserProfile();

// 1. ข้อมูลจำลอง (Mock Data) สำหรับการ์ดรีวิวแต่ละใบ
const mockReviews = [
    {
        company: "บริษัท เทคอินโนเวชั่น จำกัด",
        mode: "work mode",
        jobTitle: "Frontend Developer",
        salary: "350 THB/Day",
        skills: ["HTML", "CSS", "JavaScript"],
        interviewCount: "3 Interview Questions",
        rating: 4.5,
        author: "User - 101",
        date: "19 ต.ค. 2026",
        likes: 12,
        comments: 5
    },
    {
        company: "สยามดิจิทัล แล็บส์",
        mode: "work mode",
        jobTitle: "UX/UI Designer",
        salary: "400 THB/Day",
        skills: ["Figma", "Design System"],
        interviewCount: "2 Interview Questions",
        rating: 5.0,
        author: "User - 204",
        date: "18 ต.ค. 2026",
        likes: 24,
        comments: 8
    },
    {
        company: "ดาต้าพลัส คอนซัลติ้ง",
        mode: "work mode",
        jobTitle: "Data Analyst Intern",
        salary: "500 THB/Day",
        skills: ["SQL", "Python", "PowerBI"],
        interviewCount: "4 Interview Questions",
        rating: 4.8,
        author: "User - 099",
        date: "15 ต.ค. 2026",
        likes: 19,
        comments: 2
    },
    {
        company: "กูเกิล ประเทศไทย",
        mode: "work mode",
        jobTitle: "Software Engineer Intern",
        salary: "800 THB/Day",
        skills: ["Go", "Cloud", "Algorithms"],
        interviewCount: "5 Interview Questions",
        rating: 5.0,
        author: "User - 777",
        date: "14 ต.ค. 2026",
        likes: 99,
        comments: 18
    },
    {
        company: "ไลน์แมน วงใน",
        mode: "work mode",
        jobTitle: "Mobile Developer (Flutter)",
        salary: "450 THB/Day",
        skills: ["Dart", "Flutter", "REST API"],
        interviewCount: "3 Interview Questions",
        rating: 4.7,
        author: "User - 555",
        date: "12 ต.ค. 2026",
        likes: 31,
        comments: 6
    }
];

// 2. ฟังก์ชัน Loop สร้างการ์ดลงหน้าเว็บ
function renderReviewCards() {
    const cardsContainer = document.getElementById('cardsGrid');
    if (!cardsContainer) return;

    // วิ่ง Loop เอาข้อมูลแต่ละตัวมาสร้างเป็น HTML
    cardsContainer.innerHTML = mockReviews.map(item => `
        <article class="review-card">
            <div class="card-header">
                <h3 class="company-name">${item.company}</h3>
                <span class="mode-badge">${item.mode}</span>
            </div>

            <div class="card-row">
                <i data-lucide="briefcase" class="row-icon"></i>
                <span class="job-title">${item.jobTitle}</span>
            </div>

            <div class="card-row">
                <i data-lucide="circle-dollar-sign" class="row-icon"></i>
                <span class="salary-text">${item.salary}</span>
            </div>

            <div class="card-row skills-row">
                <i data-lucide="code" class="row-icon"></i>
                <div class="skill-tags">
                    ${item.skills.map(s => `<span class="skill-pill">${s}</span>`).join('')}
                </div>
            </div>

            <div class="contains-row">
                <span class="contains-label">Contains</span>
                <span class="info-pill">${item.interviewCount}</span>
                <span class="info-pill">pros</span>
            </div>

            <div class="rating-row">
                <div class="stars">
                    <i data-lucide="star" class="star-icon"></i>
                    <i data-lucide="star" class="star-icon"></i>
                    <i data-lucide="star" class="star-icon"></i>
                    <i data-lucide="star" class="star-icon"></i>
                    <i data-lucide="star" class="star-icon"></i>
                </div>
                <span class="rating-num">${item.rating}</span>
            </div>

            <div class="card-footer">
                <div class="author-info">
                    <i data-lucide="circle-user" class="author-avatar"></i>
                    <div class="author-details">
                        <span class="author-name">${item.author}</span>
                        <span class="review-date">${item.date}</span>
                    </div>
                </div>
                <div class="card-actions">
                    <button type="button" class="action-btn">
                        <i data-lucide="thumbs-up"></i>
                        <span>${item.likes}</span>
                    </button>
                    <button type="button" class="action-btn">
                        <i data-lucide="message-square"></i>
                        <span>${item.comments}</span>
                    </button>
                    <button type="button" class="action-btn">
                        <i data-lucide="bookmark"></i>
                    </button>
                </div>
            </div>
        </article>
    `).join('');

    // ⚠️ สำคัญมาก: ต้องสั่งให้ Lucide วาดไอคอนใหม่ทุกครั้งที่สร้าง HTML เสร็จ!
    lucide.createIcons();
}

// สั่งรันฟังก์ชันเมื่อเปิดหน้าเว็บ
renderReviewCards();

// ควบคุมการเปิด-ปิด Sidebar
const openMenuBtn = document.getElementById('openMenuBtn');
const closeMenuBtn = document.getElementById('closeMenuBtn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

function openSidebar() {
    sidebar.classList.add('active');
    sidebarOverlay.classList.add('active');
}

function closeSidebar() {
    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
}

// 1. กดปุ่มแฮมเบอร์เกอร์ -> เปิด
openMenuBtn?.addEventListener('click', openSidebar);

// 2. กดปุ่มกากบาท (X) -> ปิด
closeMenuBtn?.addEventListener('click', closeSidebar);

// 3. กดที่ฉากหลังสีดำ -> ปิด
sidebarOverlay?.addEventListener('click', closeSidebar);
