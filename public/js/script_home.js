document.addEventListener("DOMContentLoaded", () => {
    // เรียกใช้ฟังก์ชันกลางจาก components.js เพื่อสร้างการ์ดรีวิวมาตรฐานเดียวกันทุกหน้า
    if (window.InternsightUI) {
        window.InternsightUI.renderReviewCards("cardsGrid");
    }
});
