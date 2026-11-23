document.addEventListener("DOMContentLoaded", async () => {
  if (window.lucide) window.lucide.createIcons();

  const cols = document.querySelector(".cols");
  const emptyState = document.querySelector(".bookmark-empty");

  const list = document.querySelector(".list");
  const detailCard = document.querySelector(".detail");
  const field = (name) => document.querySelector(`[data-field="${name}"]`);
  const sortSelect = document.querySelector(".sel");

  const bookmarkModal = document.querySelector(".bookmark-modal");
  const confirmBtn = document.querySelector(".bookmark-confirm-btn");
  const cancelBtn = document.querySelector(".bookmark-cancel-btn");

  const searchInput = document.querySelector(".find input");
  const searchEmpty = document.querySelector(".search-empty");

  let reviews = [];
  let allReviews = [];
  let selectedReview = null;
  let pendingRemoveReview = null;

  const esc = (text) =>
    String(text || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const formatThaiDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
  };

  const mapDoc = (doc) => {
    const culture = Number(doc.rating_culture || 0);
    const workload = Number(doc.rating_workload || 0);
    const mentor = Number(doc.rating_mentor || 0);
    const rating = Number((((culture + workload + mentor) / 3) || 0).toFixed(1));
    const pay = doc.daily_pay && String(doc.daily_pay).trim() !== ""
      ? (String(doc.daily_pay).includes("THB") || String(doc.daily_pay).includes("฿") || String(doc.daily_pay).includes("ไม่มี")
          ? doc.daily_pay
          : `${doc.daily_pay} THB/Day`)
      : "ไม่ระบุเบี้ยเลี้ยง";

    return {
      id: doc.review_id || doc._id,
      reviewId: doc.review_id || doc._id,
      company: doc.company_name || "ไม่ระบุชื่อบริษัท",
      role: doc.job_name || "นักศึกษาฝึกงาน",
      mode: doc.work_mode || "On-site",
      pay,
      skills: Array.isArray(doc.skills) && doc.skills.length > 0 ? doc.skills : ["ไม่ระบุทักษะ"],
      rating,
      culture,
      workload,
      mentor,
      pros: doc.pros || "-",
      cons: doc.cons || "-",
      userId: !doc.is_anonymous && doc.user_id ? Number(doc.user_id) : null,
      authorImage: !doc.is_anonymous && doc.author_image ? doc.author_image : null,
      user: doc.is_anonymous ? "ผู้ไม่ประสงค์ออกนาม" : (doc.author_name || "นักศึกษาฝึกงาน"),
      date: formatThaiDate(doc.created_at)
    };
  };

  const renderAvatarInner = (r) =>
    r?.authorImage
      ? `<img src="${esc(r.authorImage)}" alt="${esc(r.user)}">`
      : `<i data-lucide="user-round"></i>`;

  const itemHTML = (r, index) => `
    <li class="item" data-index="${index}">
      <div class="r1">
        <h3 title="${esc(r.company)}">${esc(r.company)}</h3>
        <span class="rate"><i data-lucide="star"></i>${r.rating} / 5</span>
        <small>${esc(r.date)}</small>
        <i data-lucide="bookmark" class="solid"></i>
      </div>
      <div class="r2"><i data-lucide="briefcase-business"></i>${esc(r.role)}</div>
      <div class="r3">
        <i data-lucide="code-xml"></i>
        ${r.skills.map((s) => `<span class="chip">${esc(s)}</span>`).join("")}
        <span class="by">${
          r.userId
            ? `<a href="user.html?id=${encodeURIComponent(r.userId)}" class="bookmark-author-link"><span class="avatar">${renderAvatarInner(r)}</span>${esc(r.user)}</a>`
            : `<span class="avatar">${renderAvatarInner(r)}</span>${esc(r.user)}`
        }</span>
      </div>
    </li>`;

  const showDetail = (r) => {
    selectedReview = r || null;
    if (!r) {
      field("company").textContent = "ยังไม่มีรีวิวที่บันทึกไว้";
      field("mode").textContent = "-";
      field("role").textContent = "-";
      field("pay").textContent = "-";
      field("culture").textContent = "- / 5";
      field("workload").textContent = "- / 5";
      field("mentor").textContent = "- / 5";
      field("pros").textContent = "-";
      field("cons").textContent = "-";
      field("user").textContent = "-";
      field("date").textContent = "-";
      field("skills").replaceChildren();
      return;
    }

    field("company").textContent = r.company;
    field("mode").textContent = r.mode;
    field("role").textContent = r.role;
    field("pay").textContent = r.pay;
    field("culture").textContent = `${r.culture} / 5`;
    field("workload").textContent = `${r.workload} / 5`;
    field("mentor").textContent = `${r.mentor} / 5`;
    field("pros").textContent = r.pros;
    field("cons").textContent = r.cons;

    const detailAvatar = detailCard?.querySelector("footer .avatar");
    if (detailAvatar) {
      detailAvatar.innerHTML = renderAvatarInner(r);
      detailAvatar.style.cursor = r.userId ? "pointer" : "";
      detailAvatar.onclick = r.userId
        ? () => { window.location.href = `user.html?id=${encodeURIComponent(r.userId)}`; }
        : null;
    }

    const userField = field("user");
    if (userField) {
      if (r.userId) {
        userField.innerHTML = `<a href="user.html?id=${encodeURIComponent(r.userId)}" class="bookmark-author-link">${esc(r.user)}</a>`;
      } else {
        userField.textContent = r.user;
      }
    }
    field("date").textContent = r.date;
    if (window.lucide) window.lucide.createIcons();

    const chips = r.skills.map((skill) => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = skill;
      return chip;
    });
    field("skills").replaceChildren(...chips);

    if (detailCard && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      detailCard.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 250, easing: "ease" });
    }
  };

  const renderList = () => {
    field("count").textContent = `· ${allReviews.length}`;

    if (allReviews.length === 0) {
      cols.classList.add("hidden");
      emptyState.classList.remove("hidden");
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    cols.classList.remove("hidden");
    emptyState.classList.add("hidden");

    if (reviews.length === 0) {
      list.classList.add("hidden");
      searchEmpty.classList.remove("hidden");
      selectedReview = null;
      return;
    }

    list.classList.remove("hidden");
    searchEmpty.classList.add("hidden");
    list.innerHTML = reviews.map(itemHTML).join("");
    if (window.lucide) window.lucide.createIcons();

    const first = list.querySelector(".item");
    if (first) {
      first.setAttribute("aria-current", "true");
      showDetail(reviews[0]);
    }
  };

  async function loadBookmarks() {
    try {
      const res = await fetch("/api/reviews/bookmarks");
      if (!res.ok) return;
      const data = await res.json();
      allReviews = Array.isArray(data) ? data.map(mapDoc) : [];
      reviews = [...allReviews];
      renderList();
    } catch (err) {
      console.error("Failed to load bookmarks:", err);
    }
  }

  list?.addEventListener("click", (e) => {
    const item = e.target.closest(".item");
    if (!item || item.dataset.index === undefined) return;
    list.querySelectorAll(".item").forEach((i) => i.removeAttribute("aria-current"));
    item.setAttribute("aria-current", "true");
    showDetail(reviews[Number(item.dataset.index)]);
  });

  document.querySelector(".btn-out")?.addEventListener("click", () => {
    if (!selectedReview) return;
    if (bookmarkModal) {
      pendingRemoveReview = selectedReview;
      bookmarkModal.classList.remove("hidden");
    } else {
      removeBookmark(selectedReview.id);
    }
  });

  cancelBtn?.addEventListener("click", () => {
    bookmarkModal?.classList.add("hidden");
    pendingRemoveReview = null;
  });

  async function removeBookmark(id) {
    try {
      const res = await fetch(`/api/reviews/${encodeURIComponent(id)}/bookmark`, { method: "POST" });
      if (res.ok) {
        bookmarkModal?.classList.add("hidden");
        pendingRemoveReview = null;
        await loadBookmarks();
      }
    } catch (err) {
      console.error(err);
    }
  }

  confirmBtn?.addEventListener("click", async () => {
    if (!pendingRemoveReview) return;
    await removeBookmark(pendingRemoveReview.id);
  });

  sortSelect?.addEventListener("change", () => {
    reviews.reverse();
    renderList();
  });

  document.querySelector(".detail .btn-dark")?.addEventListener("click", () => {
    if (selectedReview?.id) {
      window.location.href = `review-detail.html?id=${encodeURIComponent(selectedReview.id)}`;
    }
  });

  searchInput?.addEventListener("input", (e) => {
  const keyword = e.target.value.trim().toLowerCase();

  reviews = allReviews.filter((review) => {
    return (
      review.company.toLowerCase().includes(keyword) ||
      review.role.toLowerCase().includes(keyword) ||
      review.skills.some((skill) =>
        skill.toLowerCase().includes(keyword)
      )
    );
  });

  renderList();
});

  await loadBookmarks();
});
