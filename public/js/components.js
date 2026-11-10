/**
 * Shared UI Components (No Mock Data — 100% Connected to MongoDB)
 * Matches Figma "Homepage(Main)" (#20:3) Review Card Design
 */
(function () {
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
    const avg = ((rMentor + rCulture + rWorkload) / 3) || 5.0;

    const payText = doc.daily_pay && String(doc.daily_pay).trim() !== ""
      ? (String(doc.daily_pay).includes("THB") || String(doc.daily_pay).includes("฿") || String(doc.daily_pay).includes("ไม่มี")
          ? doc.daily_pay
          : `${doc.daily_pay} THB/Day`)
      : "ไม่ระบุเบี้ยเลี้ยง";

    const qCount = Array.isArray(doc.interview_questions) ? doc.interview_questions.length : 0;

    return {
      id: doc.review_id || doc._id,
      review_id: doc.review_id,
      company: doc.company_name || "ไม่ระบุชื่อบริษัท",
      industry_type: doc.industry_type || "",
      mode: doc.work_mode || "On-site",
      jobTitle: doc.job_name || "นักศึกษาฝึกงาน",
      salary: payText,
      skills: Array.isArray(doc.skills) && doc.skills.length > 0 ? doc.skills : ["General"],
      interviewCount: `${qCount} Interview Questions`,
      rating: Number(avg.toFixed(1)),
      author: doc.is_anonymous ? "ผู้ไม่ประสงค์ออกนาม" : (doc.author_name || "นักศึกษาฝึกงาน"),
      date: formatThaiDate(doc.created_at),
      likes: Number(doc.likes || 0),
      comments: Array.isArray(doc.comments) ? doc.comments.length : 0
    };
  }

  function createReviewCard(item) {
    const filledCount = Math.round(item.rating || 5);
    const starsHTML = Array.from({ length: 5 }, (_, idx) => {
      const filledClass = idx < filledCount ? "filled" : "";
      return `<i data-lucide="star" class="star-icon ${filledClass}"></i>`;
    }).join("");

    const cardId = item.id || "";

    return `
      <article class="review-card" data-review-id="${cardId}">
        <div class="card-header">
          <h3 class="company-name">${item.company}</h3>
          <span class="mode-badge">${item.mode}</span>
        </div>

        <div class="card-row">
          <i data-lucide="briefcase-business" class="row-icon"></i>
          <span class="job-title">${item.jobTitle}</span>
        </div>

        <div class="card-row">
          <i data-lucide="circle-dollar-sign" class="row-icon"></i>
          <span class="salary-text">${item.salary}</span>
        </div>

        <div class="card-row skills-row">
          <i data-lucide="code-xml" class="row-icon"></i>
          <div class="skill-tags">
            ${(item.skills || []).slice(0, 3).map((s) => `<span class="skill-pill">${s}</span>`).join("")}
          </div>
        </div>

        <div class="contains-row">
          <span class="contains-label">Contains</span>
          <span class="info-pill">${item.interviewCount}</span>
          <span class="info-pill">pros</span>
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
            <span class="author-name">${item.author}</span>
            <span class="review-date">${item.date}</span>
          </div>
        </div>

        <div class="card-actions">
          <button type="button" class="action-btn js-like-btn" data-id="${cardId}" aria-label="ถูกใจ">
            <i data-lucide="thumbs-up" class="filled-action-icon"></i>
            <span>${item.likes}</span>
          </button>
          <button type="button" class="action-btn js-comment-btn" data-id="${cardId}" aria-label="ความคิดเห็น">
            <i data-lucide="message-square"></i>
            <span>${item.comments}</span>
          </button>
          <button type="button" class="action-btn js-bookmark-btn" data-id="${cardId}" aria-label="บันทึก">
            <i data-lucide="bookmark" class="filled-action-icon"></i>
          </button>
        </div>
      </article>
    `;
  }

  function renderReviewCards(containerId = "cardsGrid", reviewsList = []) {
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

    container.innerHTML = reviewsList.map(createReviewCard).join("");
    if (window.lucide) {
      window.lucide.createIcons();
    }

    // คลิกที่การ์ดเพื่อเปิดหน้าอ่านโพสต์เต็ม (review-detail.html?id=...)
    container.querySelectorAll(".review-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".action-btn")) return;
        const id = card.getAttribute("data-review-id");
        if (id) {
          window.location.href = `review-detail.html?id=${encodeURIComponent(id)}`;
        }
      });
    });

    // ปุ่มกดถูกใจ (บันทึกจริงลง MongoDB)
    container.querySelectorAll(".js-like-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        const countEl = btn.querySelector("span");
        if (!id) return;
        try {
          const res = await fetch(`/api/reviews/${encodeURIComponent(id)}/like`, { method: "POST" });
          if (res.ok) {
            const updated = await res.json();
            if (countEl) countEl.textContent = updated.likes;
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
    mapDbReviewToCard,
    createReviewCard,
    renderReviewCards
  };
})();
