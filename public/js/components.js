/**
 * Shared UI Components (No Mock Data — 100% Connected to MongoDB)
 * Matches Figma "Homepage(Main)" (#20:3) Review Card Design
 */
(function () {
  let cachedUserPromise = null;
  function getCurrentUserId() {
    if (!cachedUserPromise) {
      cachedUserPromise = fetch("/api/auth/me")
        .then((r) => (r.ok ? r.json() : null))
        .then((u) => (u && u.userId ? Number(u.userId) : null))
        .catch(() => null);
    }
    return cachedUserPromise;
  }
  getCurrentUserId();
  function formatThaiDate(dateStr) {
    if (!dateStr) return "วันนี้";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  function mapDbReviewToCard(doc) {
    const rMentor = Number(doc.rating_mentor || 0);
    const rCulture = Number(doc.rating_culture || 0);
    const rWorkload = Number(doc.rating_workload || 0);
    const avg = (rMentor + rCulture + rWorkload) / 3;

    const payText = doc.daily_pay && String(doc.daily_pay).trim() !== ""
      ? (String(doc.daily_pay).includes("THB") || String(doc.daily_pay).includes("฿") || String(doc.daily_pay).includes("ไม่มี")
        ? doc.daily_pay
        : `${doc.daily_pay} THB/Day`)
      : "ไม่ระบุเบี้ยเลี้ยง";

    const qCount = Array.isArray(doc.interview_questions) ? doc.interview_questions.length : 0;

    const containsItems = [];
    if (qCount > 0) containsItems.push(`${qCount} Interview Questions`);
    if (doc.pros && String(doc.pros).trim()) containsItems.push("pros");
    if (doc.cons && String(doc.cons).trim()) containsItems.push("cons");
    if (containsItems.length === 0) containsItems.push("Experience");

    return {
      id: doc.review_id || doc._id,
      review_id: doc.review_id,
      company: doc.company_name || "ไม่ระบุชื่อบริษัท",
      industry_type: doc.industry_type || "",
      mode: doc.work_mode || "On-site",
      jobTitle: doc.job_name || "นักศึกษาฝึกงาน",
      salary: payText,
      skills: Array.isArray(doc.skills) && doc.skills.length > 0 ? doc.skills : ["General"],
      containsItems,
      rating: Number(avg.toFixed(1)),
      author: doc.is_anonymous ? "ผู้ไม่ประสงค์ออกนาม" : (doc.author_name || "นักศึกษาฝึกงาน"),
      date: formatThaiDate(doc.created_at),
      likes: Number(doc.likes || 0),
      upvoted_by: Array.isArray(doc.upvoted_by) ? doc.upvoted_by : [],
      bookmarked_by: Array.isArray(doc.bookmarked_by) ? doc.bookmarked_by : [],
      comments: Array.isArray(doc.comments) ? doc.comments.length : 0
    };
  }

  function escapeHtml(value) {
    return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  }

  function createReviewCard(item, currentUserId = null) {
    const filledCount = Math.floor(Number(item.rating) || 0);
    const starsHTML = Array.from({ length: 5 }, (_, idx) => {
      const filledClass = idx < filledCount ? "filled" : "";
      return `<i data-lucide="star" class="star-icon ${filledClass}"></i>`;
    }).join("");

    const cardId = escapeHtml(item.id || "");

    return `
      <article class="review-card" data-review-id="${cardId}">
        <div class="card-header">
          <h3 class="company-name" title="${escapeHtml(item.company)}"><a href="review-detail.html?id=${encodeURIComponent(item.id || "")}">${escapeHtml(item.company)}</a></h3>
          <span class="mode-badge">${escapeHtml(item.mode)}</span>
        </div>

        <div class="card-row">
          <i data-lucide="briefcase-business" class="row-icon"></i>
          <span class="job-title" title="${escapeHtml(item.jobTitle)}">${escapeHtml(item.jobTitle)}</span>
        </div>

        <div class="card-row">
          <i data-lucide="circle-dollar-sign" class="row-icon"></i>
          <span class="salary-text" title="${escapeHtml(item.salary)}">${escapeHtml(item.salary)}</span>
        </div>

        <div class="card-row skills-row">
          <i data-lucide="code-xml" class="row-icon"></i>
          <div class="skill-tags">
            ${(item.skills || []).slice(0, 2).map((s) => `<span class="skill-pill">${escapeHtml(s)}</span>`).join("")}
            ${(item.skills || []).length > 2 ? `<span class="skill-pill">+${(item.skills || []).length - 2}</span>` : ""}
          </div>
        </div>

        <div class="contains-row">
          <span class="contains-label">Contains</span>
          ${(item.containsItems || []).slice(0, 2).map((c) => `<span class="info-pill">${escapeHtml(c)}</span>`).join("")}
          ${(item.containsItems || []).length > 2 ? `<span class="info-pill" title="${escapeHtml((item.containsItems || []).slice(2).join(", "))}">+${(item.containsItems || []).length - 2}</span>` : ""}
        </div>

        <div class="rating-row">
          <div class="stars">${starsHTML}</div>
          <span class="rating-num">${Number(item.rating).toFixed(1)}</span>
        </div>

        <div class="author-info">
          <span class="author-avatar-wrap">
            <i data-lucide="user-round"></i>
          </span>
          <div class="author-details">
            <span class="author-name">${escapeHtml(item.author)}</span>
            <span class="review-date">${escapeHtml(item.date)}</span>
          </div>
        </div>

        <div class="card-actions">
          <button type="button" class="action-btn js-like-btn ${currentUserId && Array.isArray(item.upvoted_by) && item.upvoted_by.includes(currentUserId) ? "active" : ""}" data-id="${cardId}" aria-label="ถูกใจ">
            <i data-lucide="thumbs-up"></i>
            <span>${escapeHtml(item.likes)}</span>
          </button>
          <button type="button" class="action-btn js-comment-btn" data-id="${cardId}" aria-label="ความคิดเห็น">
            <i data-lucide="message-square"></i>
            <span>${escapeHtml(item.comments)}</span>
          </button>
          <button type="button" class="action-btn js-bookmark-btn ${currentUserId && Array.isArray(item.bookmarked_by) && item.bookmarked_by.some((b) => Number(b.user_id) === currentUserId) ? "active" : ""}" data-id="${cardId}" aria-label="บันทึก">
            <i data-lucide="bookmark" class="${currentUserId && Array.isArray(item.bookmarked_by) && item.bookmarked_by.some((b) => Number(b.user_id) === currentUserId) ? "active-bookmark" : ""}"></i>
          </button>
        </div>
      </article>
    `;
  }

  async function renderReviewCards(containerId = "cardsGrid", reviewsList = []) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!reviewsList || reviewsList.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; color: #555;">
          <p style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">ยังไม่มีรีวิวฝึกงานในฐานข้อมูล</p>
          <p style="font-size: 14px;">กดที่ปุ่มดินสอมุมขวาล่างเพื่อสร้างโพสต์รีวิวแรกได้เลย!</p>
        </div>
      `;
      return;
    }

    const uid = await getCurrentUserId();
    container.innerHTML = reviewsList.map((item) => createReviewCard(item, uid)).join("");
    if (window.lucide) {
      window.lucide.createIcons();
    }

    // คลิกที่การ์ดเพื่อเปิดหน้าอ่านโพสต์เต็ม (review-detail.html?id=...)
    container.querySelectorAll(".review-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".action-btn, a")) return;
        const id = card.getAttribute("data-review-id");
        if (id) {
          window.location.href = `review-detail.html?id=${encodeURIComponent(id)}`;
        }
      });
    });

    // ปุ่มกดถูกใจ (ผูกตาม user_id แบบ Toggle)
    container.querySelectorAll(".js-like-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        const countEl = btn.querySelector("span");
        if (!id) return;
        try {
          const userId = await getCurrentUserId();
          const res = await fetch(`/api/reviews/${encodeURIComponent(id)}/like`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId })
          });
          if (res.ok) {
            const updated = await res.json();
            if (countEl) countEl.textContent = updated.likes;
            const isLiked = userId && Array.isArray(updated.upvoted_by) && updated.upvoted_by.includes(userId);
            btn.classList.toggle("active", Boolean(isLiked));
          }
        } catch (err) {
          console.error(err);
        }
      });
    });

    // ปุ่มบันทึก Bookmark (ผูกตาม user_id แบบ Toggle)
    container.querySelectorAll(".js-bookmark-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        if (!id) return;
        try {
          const userId = await getCurrentUserId();
          const res = await fetch(`/api/reviews/${encodeURIComponent(id)}/bookmark`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId })
          });
          if (res.ok) {
            const updated = await res.json();
            const isBookmarked = Boolean(
              userId && Array.isArray(updated.bookmarked_by) && updated.bookmarked_by.some((b) => Number(b.user_id) === userId)
            );
            btn.classList.toggle("active", isBookmarked);
            btn.querySelector("svg")?.classList.toggle("active-bookmark", isBookmarked);
          } else {
            const err = await res.json().catch(() => ({}));
            alert(err.message || "ไม่สามารถบันทึกรีวิวได้");
          }
        } catch (err) {
          console.error(err);
        }
      });
    });

    // ปุ่มความคิดเห็น
    container.querySelectorAll(".js-comment-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        if (id) {
          window.location.href = `review-detail.html?id=${encodeURIComponent(id)}#commentsSection`;
        }
      });
    });
  }

  window.InternsightUI = {
    loadCurrentUser: getCurrentUserId,
    mapDbReviewToCard,
    createReviewCard,
    renderReviewCards
  };
})();
