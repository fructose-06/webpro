lucide.createIcons();

// Elements
const pageNumbers = document.getElementById("pageNumbers");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const cardGrid = document.getElementById("cardGrid");

// เก็บเฉพาะข้อมูลจริงจาก MongoDB (ไม่มี Mock Data)
const reviews = [];

let currentPage = 1;
const cardsPerPage = 6;
let totalPages = 1;

// ดึงรีวิวจริงจาก MongoDB (/api/reviews)
async function loadDatabaseReviews() {
    try {
        const res = await fetch("/api/reviews");
        if (!res.ok) return;
        const dbDocs = await res.json();
        const mapped = dbDocs.map((doc) => {
            const avg = (((Number(doc.rating_mentor || 0) + Number(doc.rating_culture || 0) + Number(doc.rating_workload || 0)) / 3) || 5.0);
            const qCount = Array.isArray(doc.interview_questions) ? doc.interview_questions.length : 0;
            const containsArr = [];
            if (qCount > 0) containsArr.push(`${qCount} Interview Questions`);
            if (doc.pros) containsArr.push("Pros");
            if (doc.cons) containsArr.push("Cons");
            if (containsArr.length === 0) containsArr.push("Experience");

            const d = doc.created_at ? new Date(doc.created_at) : new Date();
            const dateStr = !isNaN(d.getTime())
                ? d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })
                : "วันนี้";

            return {
                id: doc.review_id || doc._id,
                company: doc.company_name || "ไม่ระบุชื่อบริษัท",
                workMode: doc.work_mode || "On-site",
                role: doc.job_name || "นักศึกษาฝึกงาน",
                salary: doc.daily_pay ? `${doc.daily_pay} THB/Day` : "ไม่ระบุเบี้ยเลี้ยง",
                skills: Array.isArray(doc.skills) && doc.skills.length > 0 ? doc.skills : ["General"],
                contains: containsArr,
                rating: Number(avg.toFixed(1)),
                author: doc.is_anonymous ? "ผู้ไม่ประสงค์ออกนาม" : (doc.author_name || "นักศึกษาฝึกงาน"),
                date: dateStr,
                likes: Number(doc.likes || 0),
                comments: Array.isArray(doc.comments) ? doc.comments.length : 0
            };
        });

        reviews.splice(0, reviews.length, ...mapped);
        totalPages = Math.max(1, Math.ceil(reviews.length / cardsPerPage));
        render();
    } catch (err) {
        console.error("Failed to load DB reviews on filter page:", err);
    }
}

function renderPages() {
    pageNumbers.innerHTML = "";
    for (let page = 1; page <= totalPages; page++) {
        const pageLink = document.createElement("button");
        pageLink.textContent = page;
        if (page === currentPage) {
            pageLink.setAttribute("aria-current", "page");
        }
        pageLink.addEventListener("click", () => {
            currentPage = page;
            render();
        });
        pageNumbers.appendChild(pageLink);
    }
}

function renderCards() {
    const start = (currentPage - 1) * cardsPerPage;
    const end = start + cardsPerPage;
    const pageData = reviews.slice(start, end);

    cardGrid.innerHTML = "";

    if (pageData.length === 0) {
        cardGrid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #666;">ยังไม่มีข้อมูลรีวิวในระบบ</p>`;
        return;
    }

    pageData.forEach((review) => {
        let starsHtml = "";
        for (let i = 1; i <= 5; i++) {
            if (i <= Math.floor(review.rating)) {
                starsHtml += '<i data-lucide="star" class="filled-star"></i>';
            } else {
                starsHtml += '<i data-lucide="star" class="empty-star"></i>';
            }
        }

        const card = document.createElement("article");
        card.className = "card";

        card.innerHTML = `
            <div class="top">
                <h3>${review.company}</h3>
                <span class="mode">${review.workMode}</span>
            </div>

            <div class="line role">
                <i data-lucide="briefcase-business"></i>
                ${review.role}
            </div>

            <div class="line pay">
                <i data-lucide="circle-dollar-sign"></i>
                ${review.salary}
            </div>

            <div class="line">
                <i data-lucide="code-xml"></i>
                <div class="chips js-fit"></div>
            </div>

            <div class="line contains js-fit">
                <span>Contains</span>
            </div>

            <div class="stars">
                ${starsHtml}
                <span>${review.rating}</span>
            </div>

            <div class="who">
                <span class="avatar">
                    <i data-lucide="user-round"></i>
                </span>

                <div>
                    <b>${review.author}</b>
                    <small>${review.date}</small>
                </div>
            </div>

            <div class="acts">
                <button type="button" class="js-filter-like">
                    <i data-lucide="thumbs-up"></i>
                    <span>${review.likes}</span>
                </button>

                <button type="button" class="js-filter-comment">
                    <i data-lucide="message-square"></i>
                    <span>${review.comments}</span>
                </button>

                <button type="button" aria-label="บันทึก">
                    <i data-lucide="bookmark"></i>
                </button>
            </div>
        `;

        const fitBoxes = card.querySelectorAll(".js-fit");
        fitBoxes[0]._items = review.skills;
        fitBoxes[1]._items = review.contains;

        card.style.cursor = "pointer";
        card.addEventListener("click", (e) => {
            if (e.target.closest("button")) return;
            if (review.id) {
                window.location.href = `review-detail.html?id=${encodeURIComponent(review.id)}`;
            }
        });

        card.querySelector(".js-filter-like")?.addEventListener("click", async (e) => {
            e.stopPropagation();
            if (!review.id) return;
            try {
                const res = await fetch(`/api/reviews/${encodeURIComponent(review.id)}/like`, { method: "POST" });
                if (res.ok) {
                    const updated = await res.json();
                    review.likes = updated.likes;
                    e.currentTarget.querySelector("span").textContent = updated.likes;
                }
            } catch (err) {
                console.error(err);
            }
        });

        card.querySelector(".js-filter-comment")?.addEventListener("click", (e) => {
            e.stopPropagation();
            if (review.id) {
                window.location.href = `review-detail.html?id=${encodeURIComponent(review.id)}#commentsSection`;
            }
        });

        cardGrid.appendChild(card);
    });

    lucide.createIcons();
    fitAll();
}

function updateButtons() {
    if (currentPage === 1) {
        prevBtn.setAttribute("aria-disabled", "true");
    } else {
        prevBtn.removeAttribute("aria-disabled");
    }

    if (currentPage === totalPages) {
        nextBtn.setAttribute("aria-disabled", "true");
    } else {
        nextBtn.removeAttribute("aria-disabled");
    }
}

function render() {
    renderPages();
    updateButtons();
    renderCards();
}

nextBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (currentPage < totalPages) {
        currentPage++;
    }
    render();
});

prevBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (currentPage > 1) {
        currentPage--;
    }
    render();
});

function fitChips(box) {
    const items = box._items || [];
    box.querySelectorAll(".chip").forEach((c) => c.remove());

    const chips = items.map((text) => {
        const s = document.createElement("span");
        s.className = "chip";
        s.textContent = text;
        box.appendChild(s);
        return s;
    });
    const more = document.createElement("button");
    more.type = "button";
    more.className = "chip more";
    box.appendChild(more);

    for (let n = items.length; n >= 0; n--) {
        chips.forEach((c, i) => (c.style.display = i < n ? "" : "none"));
        const remain = items.length - n;
        more.style.display = remain > 0 ? "" : "none";
        more.textContent = "+" + remain;
        more._hidden = items.slice(n);
        if (box.scrollWidth <= box.clientWidth) break;
    }
    more.onclick = (e) => {
        e.stopPropagation();
        showPop(more, more._hidden);
    };
}

function fitAll() {
    document.querySelectorAll(".js-fit").forEach(fitChips);
}
document.fonts.ready.then(fitAll);
window.addEventListener("resize", fitAll);

const pop = document.createElement("div");
pop.className = "more-pop";
pop.hidden = true;
document.body.appendChild(pop);

function showPop(btn, hiddenItems) {
    pop.innerHTML = hiddenItems.map((t) => `<span class="chip">${t}</span>`).join("");
    pop.hidden = false;
    const r = btn.getBoundingClientRect();
    pop.style.top = r.bottom + window.scrollY + 6 + "px";
    const left = r.left + window.scrollX;
    pop.style.left = Math.max(12, Math.min(left, window.innerWidth - pop.offsetWidth - 12)) + "px";
}

document.addEventListener("click", () => (pop.hidden = true));
window.addEventListener("scroll", () => (pop.hidden = true));

loadDatabaseReviews();
