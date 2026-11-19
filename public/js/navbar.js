/**
 * Shared Layout Script: Renders consistent Top Navbar, Search Bar, and Left Sidebar
 * across all pages (home.html, filter-page.html, post-review.html, bookmark.html, user.html).
 */
document.addEventListener("DOMContentLoaded", () => {
  const placeholder = document.getElementById("app-navbar");
  if (!placeholder) return;

  // Check if current page wants to hide the center search bar (optional via data-hide-search="true")
  const hideSearch = placeholder.dataset.hideSearch === "true";

  // Determine current page filename for active sidebar menu state
  const currentPage = window.location.pathname.split("/").pop() || "home.html";

  const layoutHTML = `
    <header class="app-navbar">
      <div class="nav-left">
        <button type="button" class="menu-btn" id="openMenuBtn" aria-label="เปิดเมนู">
          <i data-lucide="menu"></i>
        </button>
        <a href="home.html" class="brand-link">
          <span class="brand-icon">
            <i data-lucide="search"></i>
          </span>
          <span>Internsight</span>
        </a>
      </div>

      ${
        !hideSearch
          ? `
      <form class="search-bar" id="globalSearchForm" action="home.html" method="get" role="search">
        <span class="search-icon">
          <i data-lucide="search"></i>
        </span>
        <input class="search-input" id="globalSearchInput" name="q" type="text" placeholder="พิมพ์คำค้นหา เช่น ชื่อบริษัท, ตำแหน่งงาน" autocomplete="off">
        <button type="submit" class="search-btn">ค้นหา</button>
        <a href="filter.html" class="filter-btn" title="ตัวกรองค้นหา" aria-label="ตัวกรองค้นหา">
          <i data-lucide="filter"></i>
        </a>
        <div class="search-history-dropdown" id="searchHistoryDropdown" hidden></div>
      </form>
      `
          : ""
      }

      <div class="nav-actions">
        ${
          hideSearch
            ? `
        <a href="filter.html" class="nav-icon-btn" title="ค้นหาและตัวกรอง" aria-label="ค้นหาตัวกรอง">
          <i data-lucide="filter"></i>
        </a>
        `
            : ""
        }
        <a href="bookmark.html" class="nav-icon-btn bookmark-btn" title="Bookmarked Reviews" aria-label="Bookmarked Reviews">
          <i data-lucide="bookmark"></i>
        </a>
        <div class="user-profile-wrap">
          <button type="button" class="user-profile" id="userProfileBtn" aria-expanded="false" aria-controls="profileDropdown">
            <span class="user-avatar-badge">
              <i data-lucide="circle-user-round"></i>
            </span>
            <span class="user-name" id="currentUserName">Account</span>
            <i data-lucide="chevron-down" class="chevron-icon"></i>
          </button>
          <div class="profile-dropdown" id="profileDropdown">
            <a href="user.html"><i data-lucide="user"></i>Profile</a>
            <a href="setting.html"><i data-lucide="settings"></i>Account Settings</a>
            <a href="#" class="logout" id="logoutBtn"><i data-lucide="log-out"></i>Log Out</a>
          </div>
        </div>
      </div>
    </header>

    <div class="sidebar-overlay" id="sidebarOverlay"></div>

    <aside class="sidebar" id="sidebar" aria-label="เมนูหลัก">
      <div class="sidebar-header">
        <a href="home.html" class="sidebar-logo">
          <span class="brand-icon">
            <i data-lucide="search"></i>
          </span>
          <span class="logo-text">Internsight</span>
        </a>
        <button type="button" class="close-btn" id="closeMenuBtn" aria-label="ปิดเมนู">
          <i data-lucide="x"></i>
        </button>
      </div>

      <nav class="sidebar-nav">
        <a href="home.html" class="sidebar-item ${currentPage === "home.html" ? "active" : ""}">
          <i data-lucide="home"></i>
          <span>Home</span>
        </a>
        <a href="post-review.html" class="sidebar-item ${currentPage === "post-review.html" ? "active" : ""}">
          <i data-lucide="pen-square"></i>
          <span>Write a Review</span>
        </a>
        <a href="filter.html" class="sidebar-item ${currentPage === "filter.html" ? "active" : ""}">
          <i data-lucide="filter"></i>
          <span>Filter Reviews</span>
        </a>
        <a href="bookmark.html" class="sidebar-item ${currentPage === "bookmark.html" ? "active" : ""}">
          <i data-lucide="bookmark"></i>
          <span>Bookmarked Reviews</span>
        </a>
      </nav>
    </aside>
    <div class="logout-modal-overlay" id="logoutModal">
      <div class="logout-modal">
        <h3>Log Out</h3>
        <p>Are you sure you want to log out?</p>
        <div class="modal-actions">
          <button type="button" id="cancelLogout">Cancel</button>
          <button type="button" id="confirmLogout" class="btn-logout">Log Out</button>
        </div>
      </div>
    </div>
  `;

  placeholder.innerHTML = layoutHTML;

  // คงคำค้นหาเดิมไว้ใน Search Bar ด้านบน และจัดการประวัติการค้นหา (Search History)
  const SEARCH_HISTORY_KEY = "internsight_search_history";
  const MAX_SEARCH_HISTORY = 6;
  const initialQuery = new URLSearchParams(window.location.search).get("q");
  const globalSearchForm = document.getElementById("globalSearchForm");
  const globalSearchInput = document.getElementById("globalSearchInput");
  const searchHistoryDropdown = document.getElementById("searchHistoryDropdown");

  function getSearchHistory() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveSearchHistory(term) {
    const clean = String(term || "").trim();
    if (!clean) return;
    const list = getSearchHistory().filter((item) => item.toLowerCase() !== clean.toLowerCase());
    list.unshift(clean);
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(list.slice(0, MAX_SEARCH_HISTORY)));
    } catch {
      // ignore storage errors
    }
  }

  function renderSearchHistory() {
    if (!searchHistoryDropdown || !globalSearchInput) return;
    const query = globalSearchInput.value.trim().toLowerCase();
    const history = getSearchHistory().filter((item) => !query || item.toLowerCase().includes(query));

    if (history.length === 0) {
      searchHistoryDropdown.hidden = true;
      searchHistoryDropdown.innerHTML = "";
      return;
    }

    searchHistoryDropdown.innerHTML = "";
    const header = document.createElement("div");
    header.className = "search-history-header";
    header.innerHTML = `<span>ประวัติการค้นหา</span><button type="button" class="search-history-clear">ล้างทั้งหมด</button>`;
    header.querySelector(".search-history-clear")?.addEventListener("mousedown", (e) => {
      e.preventDefault();
      localStorage.removeItem(SEARCH_HISTORY_KEY);
      searchHistoryDropdown.hidden = true;
    });
    searchHistoryDropdown.appendChild(header);

    history.forEach((term) => {
      const row = document.createElement("div");
      row.className = "search-history-item";

      const termSpan = document.createElement("span");
      termSpan.className = "search-history-term";
      termSpan.innerHTML = `<i data-lucide="history"></i><span></span>`;
      termSpan.querySelector("span").textContent = term;

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "search-history-remove";
      removeBtn.setAttribute("aria-label", `ลบประวัติ ${term}`);
      removeBtn.textContent = "×";
      removeBtn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const next = getSearchHistory().filter((item) => item !== term);
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
        renderSearchHistory();
      });

      row.append(termSpan, removeBtn);
      row.addEventListener("mousedown", (e) => {
        e.preventDefault();
        globalSearchInput.value = term;
        searchHistoryDropdown.hidden = true;
        globalSearchForm?.requestSubmit();
      });
      searchHistoryDropdown.appendChild(row);
    });

    searchHistoryDropdown.hidden = false;
    if (window.lucide) window.lucide.createIcons();
  }

  if (globalSearchInput) {
    if (initialQuery) {
      globalSearchInput.value = initialQuery;
      saveSearchHistory(initialQuery);
    }
    globalSearchInput.addEventListener("focus", renderSearchHistory);
    globalSearchInput.addEventListener("input", renderSearchHistory);
    globalSearchInput.addEventListener("blur", () => {
      setTimeout(() => {
        if (searchHistoryDropdown) searchHistoryDropdown.hidden = true;
      }, 120);
    });
  }

  globalSearchForm?.addEventListener("submit", () => {
    saveSearchHistory(globalSearchInput?.value);
    if (searchHistoryDropdown) searchHistoryDropdown.hidden = true;
  });

  // Render Lucide Icons inside navbar & sidebar
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Sidebar Open / Close Logic
  const openMenuBtn = document.getElementById("openMenuBtn");
  const closeMenuBtn = document.getElementById("closeMenuBtn");
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");

  function openSidebar() {
    sidebar?.classList.add("active");
    sidebarOverlay?.classList.add("active");
  }

  function closeSidebar() {
    sidebar?.classList.remove("active");
    sidebarOverlay?.classList.remove("active");
  }

  openMenuBtn?.addEventListener("click", openSidebar);
  closeMenuBtn?.addEventListener("click", closeSidebar);
  sidebarOverlay?.addEventListener("click", closeSidebar);

  async function loadProfile() {
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (response.status === 401) return location.replace("login.html");
      if (!response.ok) throw new Error(String(response.status));
      const profile = await response.json();
      document.getElementById("currentUserName").textContent = profile.userName || profile.studentCode;
    } catch (error) {
      document.getElementById("currentUserName").textContent = "โหลดบัญชีไม่ได้";
      console.error({ event: "profile_load_failed", type: error.name });
    }
  }

  //Drop-down Open/close
  const profileBtn = document.getElementById("userProfileBtn");
  const dropdown = document.getElementById("profileDropdown");
  const logoutBtn = document.getElementById("logoutBtn");
  const logoutModal = document.getElementById("logoutModal");
  const cancelLogout = document.getElementById("cancelLogout");
  const confirmLogout = document.getElementById("confirmLogout");

  profileBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    profileBtn.setAttribute("aria-expanded", String(dropdown.classList.toggle("show")));
  });
  document.addEventListener("click", () => {
    dropdown.classList.remove("show");
    profileBtn.setAttribute("aria-expanded", "false");
  });
  logoutBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    dropdown.classList.remove("show");
    profileBtn.setAttribute("aria-expanded", "false");
    logoutModal?.classList.add("show");
  });
  cancelLogout?.addEventListener("click", () => {
    logoutModal?.classList.remove("show");
  });
  logoutModal?.addEventListener("click", (e) => {
    if (e.target === logoutModal) {
      logoutModal.classList.remove("show");
    }
  });
  confirmLogout.addEventListener("click", async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok && response.status !== 401) throw new Error(String(response.status));
      location.replace("login.html");
    } catch {
      alert("ออกจากระบบไม่ได้ กรุณาลองอีกครั้ง");
    }
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) location.reload();
  });
  loadProfile();
});
