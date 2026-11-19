document.addEventListener("DOMContentLoaded", async () => {
    if (!window.InternsightUI) return;
    await window.InternsightUI.loadCurrentUser();

    let allDbReviews = [];
    const indicatorEl = document.querySelector(".page-indicator span:last-child");

    function renderHomeByQuery(queryText) {
        const q = String(queryText || "").trim();
        const lower = q.toLowerCase();

        const filtered = !lower
            ? allDbReviews
            : allDbReviews.filter((doc) => {
                  return (
                      String(doc.company_name || "").toLowerCase().includes(lower) ||
                      String(doc.job_name || "").toLowerCase().includes(lower) ||
                      String(doc.industry_type || "").toLowerCase().includes(lower) ||
                      String(doc.work_mode || "").toLowerCase().includes(lower) ||
                      (Array.isArray(doc.skills) && doc.skills.some((s) => String(s).toLowerCase().includes(lower)))
                  );
              });

        if (indicatorEl) {
            if (q) {
                indicatorEl.innerHTML = `ผลการค้นหา "<strong></strong>" (${filtered.length} รายการ) <a href="home.html" style="margin-left:8px; font-size:13px; color:#555; text-decoration:underline;">ดูทั้งหมด</a>`;
                indicatorEl.querySelector("strong").textContent = q;
            } else {
                indicatorEl.textContent = "หน้าหลัก";
            }
        }

        if (q && filtered.length === 0) {
            const grid = document.getElementById("cardsGrid");
            if (grid) {
                grid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; color: #555;">
                        <p style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">ไม่พบรีวิวที่เกี่ยวข้องกับคำค้นหา</p>
                        <p style="font-size: 14px; margin-bottom: 16px;">ลองค้นหาด้วยชื่อบริษัท ตำแหน่งงาน หรือทักษะอื่น</p>
                        <a href="home.html" style="display:inline-block; padding:8px 20px; border-radius:999px; background:#16171a; color:#fff; text-decoration:none; font-size:14px;">ดูรีวิวทั้งหมด</a>
                    </div>
                `;
            }
            return;
        }

        const mappedDbReviews = filtered.map(window.InternsightUI.mapDbReviewToCard);
        window.InternsightUI.renderReviewCards("cardsGrid", mappedDbReviews);
    }

    // ถ้าอยู่หน้า home.html แล้วค้นหาผ่าน Search Bar ด้านบน ให้กรองทันทีโดยไม่ต้องโหลดหน้าใหม่
    const globalSearchForm = document.getElementById("globalSearchForm");
    const globalSearchInput = document.getElementById("globalSearchInput");
    globalSearchForm?.addEventListener("submit", (e) => {
        e.preventDefault();
        const nextQ = globalSearchInput?.value.trim() || "";
        const nextUrl = nextQ ? `home.html?q=${encodeURIComponent(nextQ)}` : "home.html";
        window.history.replaceState(null, "", nextUrl);
        renderHomeByQuery(nextQ);
    });

    try {
        const res = await fetch("/api/reviews");
        if (res.ok) {
            allDbReviews = await res.json();
            const initialQ = new URLSearchParams(window.location.search).get("q") || "";
            renderHomeByQuery(initialQ);
            return;
        }
    } catch (err) {
        console.error("Error loading reviews from API:", err);
    }

    window.InternsightUI.renderReviewCards("cardsGrid", []);
});
