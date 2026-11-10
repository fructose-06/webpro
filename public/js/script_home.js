document.addEventListener("DOMContentLoaded", async () => {
    if (!window.InternsightUI) return;

    try {
        const res = await fetch("/api/reviews");
        if (res.ok) {
            const dbReviews = await res.json();
            const mappedDbReviews = dbReviews.map(window.InternsightUI.mapDbReviewToCard);
            window.InternsightUI.renderReviewCards("cardsGrid", mappedDbReviews);
            return;
        }
    } catch (err) {
        console.error("Error loading reviews from API:", err);
    }

    window.InternsightUI.renderReviewCards("cardsGrid", []);
});
