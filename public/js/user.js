const list = document.querySelector("#myReviews");
const statusText = document.querySelector("#reviewStatus");
const order = document.querySelector("#reviewOrder");

const dialog = document.querySelector("#deleteReview");
const confirmDelete = document.querySelector("#confirmDelete");
const cancelDelete = document.querySelector("#cancelDelete");
const message = document.querySelector("#deleteMessage");
cancelDelete.onclick = () => dialog.close();
dialog.oncancel = event => {
  if (confirmDelete.disabled) event.preventDefault();
};
confirmDelete.onclick = async () => {
  confirmDelete.disabled = cancelDelete.disabled = true;
  try {
    const response = await fetch("/api/me/reviews/" + encodeURIComponent(dialog.dataset.id), { method: "DELETE" });
    if (!response.ok) throw new Error(String(response.status));
    dialog.close();
    location.reload();
  } catch (error) {
    message.textContent = "ลบรีวิวไม่สำเร็จ กรุณาลองอีกครั้ง";
  } finally {
    confirmDelete.disabled = cancelDelete.disabled = false;
    confirmDelete.focus();
  }
};

function addOwnerActions(card, review) {
  const actions = card.querySelector(".card-actions");
  const edit = document.createElement("button");
  edit.type = "button";
  edit.className = "action-btn owner-edit";
  edit.textContent = "แก้ไขรีวิว";
  edit.onclick = () => location.assign("post-review.html?edit=" + encodeURIComponent(review._id));
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "action-btn owner-delete";
  remove.textContent = "ลบ";
  remove.onclick = () => {
    dialog.dataset.id = review._id;
    message.textContent = "ต้องการลบรีวิวของ " + (review.company_name || "คุณ") + " หรือไม่? เมื่อลบแล้วจะกู้คืนไม่ได้";
    dialog.showModal();
  };
  actions.append(edit, remove);
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
    order.disabled = reviews.length < 2;
    await window.InternsightUI.loadCurrentUser();
    function render() {
      const sorted = order.value === "oldest" ? [...reviews].reverse() : reviews;
      if (sorted.length) {
        const ui = window.InternsightUI;
        ui.renderReviewCards(list.id, sorted.map(ui.mapDbReviewToCard));
        list.querySelectorAll(".review-card").forEach((card, index) => addOwnerActions(card, sorted[index]));
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
