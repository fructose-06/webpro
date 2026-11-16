const list = document.querySelector("#myReviews");
const statusText = document.querySelector("#reviewStatus");
const order = document.querySelector("#reviewOrder");

/** @typedef {{_id: string, review_id?: number, company_name?: string, job_name?: string, work_mode?: string, daily_pay?: string, description?: string, is_anonymous: boolean, created_at?: string}} ProfileReview */

/** @param {ProfileReview} review */
function reviewCard(review) {
  const card = document.createElement("article");
  card.className = "card";
  const heading = document.createElement("h3");
  const link = document.createElement("a");
  link.href = "review-detail.html?id=" + encodeURIComponent(review.review_id || review._id);
  link.textContent = review.company_name || "ไม่ระบุบริษัท";
  heading.append(link);
  const role = document.createElement("p");
  role.textContent = [review.job_name, review.work_mode].filter(Boolean).join(" · ");
  const summary = document.createElement("p");
  summary.textContent = review.description || "";
  const meta = document.createElement("small");
  const date = new Date(review.created_at);
  meta.textContent = [
    Number.isFinite(date.getTime()) ? date.toLocaleDateString("th-TH") : "",
    review.is_anonymous ? "โพสต์แบบไม่ระบุชื่อ" : ""
  ].filter(Boolean).join(" · ");
  card.append(heading, role, summary, meta);
  return card;
}

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
      list.replaceChildren(...sorted.map(reviewCard));
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
