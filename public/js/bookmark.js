lucide.createIcons();

const reviews = [];
let selectedReview = null;

const list = document.querySelector('.list');
const detailCard = document.querySelector('.detail');
const field = (name) => document.querySelector(`[data-field="${name}"]`);
const sortSelect = document.querySelector(".sel");

const bookmarkModal = document.querySelector(".bookmark-modal");
const confirmBtn = document.querySelector(".bookmark-confirm-btn");
const cancelBtn = document.querySelector(".bookmark-cancel-btn");
let pendingRemoveReview = null;

async function loadBookmarks() {
    try {
        const res = await fetch("/api/reviews/bookmarks");
        const data = await res.json();
        reviews.splice(0, reviews.length, ...data.map((review) => ({
          company: review.company_name,
          role: review.job_name,
          mode: review.work_mode,
          pay: review.daily_pay,
          skills: review.skills || [],
          rating: ((
                  Number(review.rating_culture || 0) +
                  Number(review.rating_workload || 0) +
                  Number(review.rating_mentor || 0)
              ) / 3
          ).toFixed(1),
          culture: review.rating_culture,
          workload: review.rating_workload,
          mentor: review.rating_mentor,
          pros: review.pros,
          cons: review.cons,
          user: review.author_name,
          date: new Date(review.created_at).toLocaleDateString("th-TH"),
          reviewId: review.review_id,
          bookmarkedAt: review.bookmarked_by?.[0]?.created_at || review.created_at
        })));

        field('count').textContent = `· ${reviews.length}`;
        renderReviews();
    } catch (err) {
        console.error(err);
    }
}

const esc = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const itemHTML = (r, index) => `
  <li class="item" data-index="${index}">
    <div class="r1">
      <h3>${esc(r.company)}</h3>
      <span class="rate"><i data-lucide="star"></i>${r.rating} / 5</span>
      <small>${esc(r.date)}</small>
      <i data-lucide="bookmark" class="solid"></i>
    </div>
    <div class="r2"><i data-lucide="briefcase-business"></i>${esc(r.role)}</div>
    <div class="r3">
      <i data-lucide="code-xml"></i>
      ${r.skills.map((s) => `<span class="chip">${esc(s)}</span>`).join('')}
      <span class="by"><span class="avatar"><i data-lucide="user-round"></i></span>${esc(r.user)}</span>
    </div>
  </li>`;

const showDetail = (r) => {
  selectedReview = r;

  field('company').textContent = r.company;
  field('mode').textContent = r.mode;
  field('role').textContent = r.role;
  field('pay').textContent = r.pay;
  field('culture').textContent = `${r.culture} / 5`;
  field('workload').textContent = `${r.workload} / 5`;
  field('mentor').textContent = `${r.mentor} / 5`;
  field('pros').textContent = r.pros;
  field('cons').textContent = r.cons;
  field('user').textContent = r.user;
  field('date').textContent = r.date;

  const chips = r.skills.map((skill) => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = skill;
    return chip;
  });
  field('skills').replaceChildren(...chips);

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    detailCard.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 250, easing: 'ease' });
  }
};

function renderReviews() {
    list.innerHTML = reviews.map(itemHTML).join('');
    lucide.createIcons();
    if (reviews.length > 0) {
      showDetail(reviews[0]);
      const firstItem = list.querySelector('.item');
      if (firstItem) {
          firstItem.setAttribute('aria-current', 'true');
      }
    }
}

list.addEventListener('click', (e) => {
  const item = e.target.closest('.item');
  if (!item) return;

  list.querySelectorAll('.item').forEach((i) => i.removeAttribute('aria-current'));
  item.setAttribute('aria-current', 'true');
  showDetail(reviews[item.dataset.index]);
});

document.querySelector(".btn-out")?.addEventListener("click", () => {
    if (!selectedReview) return;
    pendingRemoveReview = selectedReview;
    bookmarkModal.classList.remove("hidden");
});
cancelBtn?.addEventListener("click", () => {
    bookmarkModal.classList.add("hidden");
    pendingRemoveReview = null;
});
confirmBtn?.addEventListener("click", async () => {
    if (!pendingRemoveReview) return;
    try {
      const res = await fetch(`/api/reviews/${pendingRemoveReview.reviewId}/bookmark`,{ method: "POST" });

      if (res.ok) {
        bookmarkModal.classList.add("hidden");
        pendingRemoveReview = null;
        await loadBookmarks();
      }
    } catch (err) {
        console.error(err);
    }
});

sortSelect?.addEventListener("change", () => {
  reviews.reverse();
  renderReviews();
});

loadBookmarks();