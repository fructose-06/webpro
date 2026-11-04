/**
 * Shared UI Components & Mock Data
 * Provides reusable `window.InternsightUI.createReviewCard(item)` and `window.InternsightUI.renderReviewCards(containerId, list)`
 * so that Review Cards on home.html, filter-page.html, and future pages look 100% identical.
 */
(function () {
  const defaultMockReviews = [
    {
      company: "บริษัท เทคอินโนเวชั่น จำกัด",
      mode: "On-site",
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
      mode: "Hybrid",
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
      mode: "Hybrid",
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
      mode: "Hybrid",
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
      mode: "On-site",
      jobTitle: "Mobile Developer (Flutter)",
      salary: "450 THB/Day",
      skills: ["Dart", "Flutter", "REST API"],
      interviewCount: "3 Interview Questions",
      rating: 4.7,
      author: "User - 555",
      date: "12 ต.ค. 2026",
      likes: 31,
      comments: 6
    },
    {
      company: "KBTG",
      mode: "Hybrid",
      jobTitle: "Full-stack Developer",
      salary: "500 THB/Day",
      skills: ["React", "Node.js", "Docker"],
      interviewCount: "3 Interview Questions",
      rating: 4.9,
      author: "User - 312",
      date: "10 ต.ค. 2026",
      likes: 45,
      comments: 11
    }
  ];

  function createReviewCard(item) {
    const filledCount = Math.round(item.rating || 5);
    const starsHTML = Array.from({ length: 5 }, (_, idx) => {
      const filledClass = idx < filledCount ? "filled" : "";
      return `<i data-lucide="star" class="star-icon ${filledClass}"></i>`;
    }).join("");

    return `
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
            ${(item.skills || []).map((s) => `<span class="skill-pill">${s}</span>`).join("")}
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

        <div class="card-footer">
          <div class="author-info">
            <span class="author-avatar-wrap">
              <i data-lucide="user"></i>
            </span>
            <div class="author-details">
              <span class="author-name">${item.author}</span>
              <span class="review-date">${item.date}</span>
            </div>
          </div>
          <div class="card-actions">
            <button type="button" class="action-btn" aria-label="ถูกใจ">
              <i data-lucide="thumbs-up"></i>
              <span>${item.likes}</span>
            </button>
            <button type="button" class="action-btn" aria-label="ความคิดเห็น">
              <i data-lucide="message-square"></i>
              <span>${item.comments}</span>
            </button>
            <button type="button" class="action-btn" aria-label="บันทึก">
              <i data-lucide="bookmark"></i>
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function renderReviewCards(containerId = "cardsGrid", reviewsList = defaultMockReviews) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = reviewsList.map(createReviewCard).join("");
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  window.InternsightUI = {
    defaultMockReviews,
    createReviewCard,
    renderReviewCards
  };
})();

