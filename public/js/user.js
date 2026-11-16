const list = document.querySelector("#myReviews");
const statusText = document.querySelector("#reviewStatus");
const order = document.querySelector("#reviewOrder");

async function loadProfile() {
  order.disabled = true;
  try {
    const [identity, result] = await Promise.all([
      fetch("/api/auth/me", { cache: "no-store" }),
      fetch("/api/me/reviews", { cache: "no-store" })
    ]);
    if (identity.status === 401 || result.status === 401) {
      location.replace("login.html");
      return;
    }
    if (!identity.ok || !result.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
    const profile = await identity.json();
    const { reviews } = await result.json();
    document.querySelector("#profileName").textContent = profile.userName || profile.studentCode;
    document.querySelector("#reviewCount").textContent = "(" + reviews.length + " รีวิว)";
    statusText.textContent = reviews.length ? "" : "ยังไม่มีรีวิว";
    document.querySelector("#firstReview").hidden = reviews.length > 0;
    order.disabled = reviews.length < 2;
    function render() {
      const sorted = order.value === "oldest" ? [...reviews].reverse() : reviews;
      if (sorted.length) {
        const ui = window.InternsightUI;
        ui.renderReviewCards(list.id, sorted.map(ui.mapDbReviewToCard));
      } else {
        list.replaceChildren();
      }
    }
    order.addEventListener("change", render);
    render();
  } catch (error) {
    console.error({ event: "profile_load_failed", type: error.name });
    statusText.textContent = "โหลดข้อมูลโปรไฟล์ไม่ได้ กรุณารีเฟรชเพื่อลองอีกครั้ง";
  }
}
window.lucide?.createIcons();
loadProfile();
