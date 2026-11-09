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
      <form class="search-bar" id="globalSearchForm" action="filter.html" method="get" role="search">
        <span class="search-icon">
          <i data-lucide="search"></i>
        </span>
        <input class="search-input" id="globalSearchInput" name="q" type="text" placeholder="พิมพ์คำค้นหา เช่น ชื่อบริษัท, ตำแหน่งงาน">
        <button type="submit" class="search-btn">ค้นหา</button>
        <a href="filter.html" class="filter-btn" title="ตัวกรองค้นหา" aria-label="ตัวกรองค้นหา">
          <i data-lucide="filter"></i>
        </a>
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
        <a href="bookmark.html" class="nav-icon-btn bookmark-btn" title="รายการที่บันทึกไว้" aria-label="บุ๊กมาร์ก">
          <i data-lucide="bookmark"></i>
        </a>

        <a class="user-profile" id="userProfileBtn" href="login.html">
          <span class="user-avatar-badge">
            <i data-lucide="circle-user-round"></i>
          </span>
          <span class="user-name" id="currentUserName">เข้าสู่ระบบ</span>
          </a>
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
          <span>หน้าหลัก</span>
        </a>
        <a href="post-review.html" class="sidebar-item ${currentPage === "post-review.html" ? "active" : ""}">
          <i data-lucide="pen-square"></i>
          <span>เขียนรีวิวฝึกงาน</span>
        </a>
        <a href="filter.html" class="sidebar-item ${currentPage === "filter.html" ? "active" : ""}">
          <i data-lucide="filter"></i>
          <span>ค้นหา & ตัวกรอง</span>
        </a>
        <a href="bookmark.html" class="sidebar-item ${currentPage === "bookmark.html" ? "active" : ""}">
          <i data-lucide="bookmark"></i>
          <span>รายการที่บันทึกไว้</span>
        </a>
        <a href="user.html" class="sidebar-item ${currentPage === "user.html" ? "active" : ""}">
          <i data-lucide="user"></i>
          <span>โปรไฟล์ผู้ใช้</span>
        </a>
        <a href="#" class="sidebar-item">
          <i data-lucide="settings"></i>
          <span>ตั้งค่า</span>
        </a>
        <button type="button" class="sidebar-item" id="logoutBtn" style="display:none">ออกจากระบบ</button>
      </nav>
    </aside>
  `;

  placeholder.innerHTML = layoutHTML;

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

  const logout = document.getElementById("logoutBtn");
  async function loadProfile() {
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (response.status === 401) return;
      if (!response.ok) throw new Error(String(response.status));
      const profile = await response.json();
      document.getElementById("currentUserName").textContent = profile.userName || profile.studentCode;
      document.getElementById("userProfileBtn").href = "user.html";
      logout.style.display = "";
    } catch (error) {
      document.getElementById("currentUserName").textContent = "โหลดบัญชีไม่ได้";
      console.error({ event: "profile_load_failed", type: error.name });
    }
  }
  logout.addEventListener("click", async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error(String(response.status));
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
