lucide.createIcons();

// Elements
const pageNumbers = document.getElementById("pageNumbers");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const cardGrid = document.getElementById("cardGrid");

const sortSelect = document.getElementById("sortSelect");
const companyInput = document.getElementById("company");
const companySuggestions = document.getElementById("companySuggestions");
const roleSelect = document.getElementById("role");
const companyTypeSelect = document.getElementById("ctype");
const modeRadios = document.querySelectorAll('input[name="mode"]');
const payRadios = document.querySelectorAll('input[name="pay"]');
const skillInput = document.getElementById("skillInput");
const skillTags = document.getElementById("skillTags");
const skillSuggestions = document.getElementById("skillSuggestions");
const applyFilterBtn = document.getElementById("applyFilterBtn");
const resetFilterBtn = document.getElementById("resetFilterBtn");

const params = new URLSearchParams(window.location.search);
let globalQuery = params.get("q")?.trim() || "";

// เก็บเฉพาะข้อมูลจริงจาก MongoDB (ไม่มี Mock Data)
const reviews = [];
let filteredReviews = [];
let selectedSkills = [];
let activeSuggestionIndex = -1;
let activeCompanyIndex = -1;
let currentUserId = null;

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
            const avg = ((Number(doc.rating_mentor || 0) + Number(doc.rating_culture || 0) + Number(doc.rating_workload || 0)) / 3);
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
                industryType: doc.industry_type || "",
                workMode: doc.work_mode || "On-site",
                role: doc.job_name || "นักศึกษาฝึกงาน",
                salary: doc.daily_pay ? `${doc.daily_pay} THB/Day` : "ไม่ระบุเบี้ยเลี้ยง",
                skills: Array.isArray(doc.skills) && doc.skills.length > 0 ? doc.skills : ["General"],
                contains: containsArr,
                rating: Number(avg.toFixed(1)),
                author: doc.is_anonymous ? "ผู้ไม่ประสงค์ออกนาม" : (doc.author_name || "นักศึกษาฝึกงาน"),
                date: dateStr,
                createdAt: d,
                likes: Number(doc.likes || 0),
                comments: Array.isArray(doc.comments) ? doc.comments.length : 0,
                bookmarked: Array.isArray(doc.bookmarked_by) && doc.bookmarked_by.some((b) => b.user_id === currentUserId),
                rawDoc: doc
            };
        });

        reviews.splice(0, reviews.length, ...mapped);
        populateRoles();
        populateCompanyTypes();
        applyFilters();
    } catch (err) {
        console.error("Failed to load DB reviews on filter page:", err);
    }
}
async function loadCurrentUser() {
    const res = await fetch("/api/auth/me");
    if (!res.ok) return;
    const user = await res.json();
    currentUserId = user.userId;
}

function populateRoles() {
    const roles = [...new Set(reviews.map(review => review.role))];

    roleSelect.innerHTML = `<option>ทั้งหมด</option>`;
    roles.forEach((role) => {
        const option = document.createElement("option");
        option.value = role;
        option.textContent = role;

        roleSelect.appendChild(option);
    });
}
function populateCompanyTypes() {
    const types = [...new Set(reviews.map(review => review.industryType))];

    companyTypeSelect.innerHTML = `<option>ทั้งหมด</option>`;
    types.forEach((type) => {
        const option = document.createElement("option");
        option.value = type;
        option.textContent = type;

        companyTypeSelect.appendChild(option);
    });
}
function getAllCompanies() {
    return [...new Set(reviews.map(review => review.company))];
}
function getAllSkills() {
    return [...new Set(reviews.flatMap(review => review.skills))];
}

function renderCompanySuggestions(keyword) {
    companySuggestions.innerHTML = "";
    if (!keyword) return;
    const matches = getAllCompanies().filter(
        company => company.toLowerCase().includes(keyword.toLowerCase())
    );
    if (matches.length === 0) {
        companySuggestions.innerHTML =
            `<div class="suggestion-item">
                ไม่พบบริษัท
            </div>`;
        return;
    }
    matches.slice(0, 5).forEach((company, index) => {
        const item = document.createElement("div");
        item.className = `suggestion-item ${index === activeCompanyIndex ? "active" : ""
            }`;
        item.textContent = company;
        item.addEventListener("click", () => {
            companyInput.value = company;
            companySuggestions.innerHTML = "";
            activeCompanyIndex = -1;
        });
        companySuggestions.appendChild(item);
    });
}
function renderSkillSuggestions(keyword) {
    skillSuggestions.innerHTML = "";
    if (!keyword) return;
    const matches = getAllSkills()
        .filter(skill => skill.toLowerCase().includes(keyword.toLowerCase()))
        .filter(skill => !selectedSkills.includes(skill));

    matches.slice(0, 5).forEach((skill, index) => {
        const item = document.createElement("div");
        item.className = `suggestion-item ${index === activeSuggestionIndex ? "active" : ""
            }`;
        item.textContent = skill;

        item.addEventListener("click", () => {
            selectedSkills.push(skill);
            skillInput.value = "";
            skillSuggestions.innerHTML = "";
            activeSuggestionIndex = -1;
            renderSkillTags();
        });

        skillSuggestions.appendChild(item);
    });
}
function renderSkillTags() {
    skillTags.innerHTML = "";
    selectedSkills.forEach((skill) => {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.innerHTML = `
            ${skill}
            <button type="button" aria-label="ลบ ${skill}"><i data-lucide="x"></i></button>
        `;
        tag.querySelector("button")
            .addEventListener("click", () => {
                selectedSkills = selectedSkills.filter(s => s !== skill);
                renderSkillTags();
                renderSkillSuggestions(skillInput.value.trim());
            });

        skillTags.appendChild(tag);
    });
    lucide.createIcons();
}

function renderPages() {
    pageNumbers.innerHTML = "";

    const maxVisible = 5;

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, currentPage + 2);

    if (start > 1) {
        addPageButton(1);

        if (start > 2) {
            pageNumbers.append("...");
        }
    }

    for (let page = start; page <= end; page++) {
        addPageButton(page);
    }

    if (end < totalPages) {
        if (end < totalPages - 1) {
            pageNumbers.append("...");
        }

        addPageButton(totalPages);
    }
}

function addPageButton(page) {
    const btn = document.createElement("button");
    btn.textContent = page;

    if (page === currentPage) {
        btn.setAttribute("aria-current", "page");
    }

    btn.addEventListener("click", () => {
        currentPage = page;
        render();
    });

    pageNumbers.appendChild(btn);
}

function renderCards() {
    const start = (currentPage - 1) * cardsPerPage;
    const end = start + cardsPerPage;
    const pageData = filteredReviews.slice(start, end);

    cardGrid.innerHTML = "";

    if (pageData.length === 0) {
        cardGrid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #666;">ยังไม่มีข้อมูลรีวิวที่ตรงกับเงื่อนไข</p>`;
        return;
    }

    if (window.InternsightUI) {
        const uiCards = pageData.map((r) => window.InternsightUI.mapDbReviewToCard(r.rawDoc));
        window.InternsightUI.renderReviewCards("cardGrid", uiCards);
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

                <button type="button" class="js-filter-bookmark" aria-label="บันทึก">
                    <i data-lucide="bookmark" class="${review.bookmarked ? "active-bookmark" : ""}"></i>
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

        const bookmarkBtn = card.querySelector(".js-filter-bookmark");
        bookmarkBtn?.addEventListener("click", async (e) => {
            e.stopPropagation();
            if (!review.id) return;
            const icon = bookmarkBtn.querySelector("svg");
            try {
                const res = await fetch(`/api/reviews/${encodeURIComponent(review.id)}/bookmark`, { method: "POST" });
                if (res.ok) {
                    const updated = await res.json();
                    review.bookmarked = updated.bookmarked_by.some((b) => b.user_id === currentUserId);

                    icon?.classList.toggle("active-bookmark", review.bookmarked);
                }
            } catch (err) {
                console.error(err);

            }
        }
        );

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

companyInput.addEventListener("input", () => {
    activeCompanyIndex = -1;
    renderCompanySuggestions(companyInput.value.trim());
});
skillInput.addEventListener("input", () => {
    activeSuggestionIndex = -1;
    renderSkillSuggestions(skillInput.value.trim());
});

function sortReviews() {
    const sortType = sortSelect.value;
    if (sortType === "รีวิวล่าสุด") {
        filteredReviews.sort(
            (a, b) => b.createdAt - a.createdAt
        );
    }
    else if (sortType === "รีวิวที่เก่าที่สุด") {
        filteredReviews.sort(
            (a, b) => a.createdAt - b.createdAt
        );
    }
    else if (
        sortType === "รีวิวที่มียอดไลก์สูงสุด"
    ) {
        filteredReviews.sort(
            (a, b) => b.likes - a.likes
        );
    }
    else if (
        sortType === "รีวิวที่มีคะแนนสูงสุด"
    ) {
        filteredReviews.sort(
            (a, b) => b.rating - a.rating
        );
    }
}

function applyFilters() {
    const q = globalQuery.toLowerCase();
    const keyword = companyInput.value.trim().toLowerCase();
    const selectedRole = roleSelect.value;
    const selectedType = companyTypeSelect.value;
    const selectedMode = document.querySelector('input[name="mode"]:checked')?.nextElementSibling?.textContent;
    const selectedPay = Array.from(payRadios).find(radio => radio.checked)?.nextElementSibling?.textContent;
    filteredReviews = reviews.filter((review) => {
        const globalMatch = !q ||
            review.company.toLowerCase().includes(q) ||
            review.role.toLowerCase().includes(q) ||
            (review.industryType || "").toLowerCase().includes(q) ||
            review.skills.some(skill => skill.toLowerCase().includes(q));
        const companyMatch = !keyword || review.company.toLowerCase().includes(keyword);
        const roleMatch = selectedRole === "ทั้งหมด" || review.role.includes(selectedRole);
        const typeMatch = selectedType === "ทั้งหมด" || review.industryType === selectedType;
        const modeMatch = selectedMode === "ทั้งหมด" || review.workMode === selectedMode;
        const payValue = Number(review.salary.replace(/\D/g, "") || 0);

        let payMatch = true;
        if (selectedPay === "ไม่มีเบี้ยเลี้ยง") {
            payMatch = payValue === 0;
        }
        else if (selectedPay === "300-500 ฿") {
            payMatch = payValue >= 300 && payValue <= 500;
        }
        else if (selectedPay === "501-800 ฿") {
            payMatch = payValue >= 501 && payValue <= 800;
        }
        else if (selectedPay === "801+ ฿") {
            payMatch = payValue >= 801;
        }

        const skillMatch = selectedSkills.length === 0 || selectedSkills.some(skill => review.skills.includes(skill));

        return globalMatch && companyMatch && roleMatch && typeMatch && modeMatch && payMatch && skillMatch;
    });
    sortReviews();
    currentPage = 1;
    totalPages = Math.max(1, Math.ceil(filteredReviews.length / cardsPerPage));

    render();
}
applyFilterBtn.addEventListener("click", applyFilters);

companyInput.addEventListener("keydown", (e) => {
    const matches = getAllCompanies()
        .filter(company => company.toLowerCase().includes(companyInput.value.trim().toLowerCase()));

    if (e.key === "ArrowDown") {
        e.preventDefault();
        activeCompanyIndex = Math.min(activeCompanyIndex + 1, matches.length - 1);

        renderCompanySuggestions(
            companyInput.value.trim()
        );
    }

    if (e.key === "ArrowUp") {
        e.preventDefault();
        activeCompanyIndex = Math.max(activeCompanyIndex - 1, -1);

        renderCompanySuggestions(
            companyInput.value.trim()
        );
    }

    if (e.key === "Enter") {
        e.preventDefault();
        if (activeCompanyIndex >= 0 && matches[activeCompanyIndex]) {
            companyInput.value = matches[activeCompanyIndex];
            companySuggestions.innerHTML = "";
            activeCompanyIndex = -1;
        }
    }
});
skillInput.addEventListener("keydown", (e) => {
    const matches = getAllSkills()
        .filter(skill => skill.toLowerCase().includes(skillInput.value.trim().toLowerCase()))
        .filter(skill => !selectedSkills.includes(skill));

    if (e.key === "ArrowDown") {
        e.preventDefault();
        activeSuggestionIndex = Math.min(activeSuggestionIndex + 1, matches.length - 1);

        renderSkillSuggestions(
            skillInput.value.trim()
        );
    }
    if (e.key === "ArrowUp") {
        e.preventDefault();
        activeSuggestionIndex = Math.max(activeSuggestionIndex - 1, -1);

        renderSkillSuggestions(
            skillInput.value.trim()
        );
    }

    if (e.key === "Enter") {
        e.preventDefault();
        if (activeSuggestionIndex >= 0 && matches[activeSuggestionIndex]) {
            const skill = matches[activeSuggestionIndex];
            if (!selectedSkills.includes(skill)) {
                selectedSkills.push(skill);
            }
            skillInput.value = "";
            skillSuggestions.innerHTML = "";
            activeSuggestionIndex = -1;
            renderSkillTags();
        }
    }
});

document.addEventListener("click", (e) => {
    if (!skillInput.contains(e.target) && !skillSuggestions.contains(e.target)) {
        skillSuggestions.innerHTML = "";
    }
    if (!companyInput.contains(e.target) && !companySuggestions.contains(e.target)) {
        companySuggestions.innerHTML = "";
    }
});

resetFilterBtn.addEventListener("click", () => {
    companyInput.value = "";
    roleSelect.value = "ทั้งหมด";
    companyTypeSelect.value = "ทั้งหมด";

    document.querySelector(
        'input[name="mode"]'
    ).checked = true;

    document.querySelector(
        'input[name="pay"]'
    ).checked = true;

    selectedSkills = [];

    skillInput.value = "";
    skillTags.innerHTML = "";
    skillSuggestions.innerHTML = "";
    companySuggestions.innerHTML = "";

    activeSuggestionIndex = -1;
    globalQuery = "";
    const topSearch = document.getElementById("globalSearchInput");
    if (topSearch) topSearch.value = "";
    if (window.location.search) {
        window.history.replaceState(null, "", "filter.html");
    }
    filteredReviews = [...reviews];
    currentPage = 1;
    totalPages = Math.max(1, Math.ceil(filteredReviews.length / cardsPerPage));

    render();
});

(async () => {
    await loadCurrentUser();
    await loadDatabaseReviews();
})();
