lucide.createIcons();

//element
const pageNumbers = document.getElementById("pageNumbers");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const cardGrid = document.getElementById("cardGrid");

//mock
const reviews = [
    {
        company: "Google",
        workMode: "Hybrid",
        role: "Software Engineer Intern",
        salary: "800 THB/Day",

        skills: [
            "JavaScript",
            "React",
            "Node.js",
            "MongoDB",
            "Docker"
        ],

        contains: [
            "5 Interview Questions",
            "Pros",
            "Work Environment",
            "Tips"
        ],

        rating: 4.5,
        author: "User - 101",
        date: "27 Oct 2026",
        likes: 18,
        comments: 6
    },
    {
        company: "KBTG",
        workMode: "Hybrid",
        role: "Frontend Developer",
        salary: "700 THB/Day",

        skills: [
            "HTML",
            "CSS",
            "JavaScript",
            "React"
        ],

        contains: [
            "Interview Questions",
            "Pros",
            "Cons"
        ],

        rating: 4.2,
        author: "User - 102",
        date: "25 Oct 2026",
        likes: 14,
        comments: 4
    },
    {
        company: "SCB",
        workMode: "On-site",
        role: "Backend Developer",
        salary: "650 THB/Day",

        skills: [
            "Node.js",
            "Express",
            "SQL",
            "Redis",
            "Docker"
        ],

        contains: [
            "Interview Questions",
            "Pros",
            "Salary",
            "Culture"
        ],

        rating: 3.9,
        author: "User - 103",
        date: "24 Oct 2026",
        likes: 7,
        comments: 1
    },
    {
        company: "AIS",
        workMode: "Hybrid",
        role: "Data Analyst",
        salary: "550 THB/Day",

        skills: [
            "Python",
            "SQL",
            "Power BI",
            "Excel"
        ],

        contains: [
            "Pros",
            "Work Environment",
            "Tips"
        ],

        rating: 4.7,
        author: "User - 104",
        date: "23 Oct 2026",
        likes: 22,
        comments: 8
    },
    {
        company: "PTT",
        workMode: "On-site",
        role: "UX/UI Designer",
        salary: "500 THB/Day",

        skills: [
            "Figma",
            "Wireframe",
            "Prototype",
            "Design System"
        ],

        contains: [
            "Interview Questions",
            "Pros"
        ],

        rating: 4.3,
        author: "User - 105",
        date: "21 Oct 2026",
        likes: 10,
        comments: 5
    },
    {
        company: "Shopee",
        workMode: "Remote",
        role: "Frontend Developer",
        salary: "750 THB/Day",

        skills: [
            "Vue",
            "JavaScript",
            "TypeScript",
            "CSS",
            "Git"
        ],

        contains: [
            "Interview Questions",
            "Pros",
            "Cons",
            "Project Details"
        ],

        rating: 4.8,
        author: "User - 106",
        date: "20 Oct 2026",
        likes: 34,
        comments: 12
    },
    {
        company: "Lazada",
        workMode: "Hybrid",
        role: "Mobile Developer",
        salary: "800 THB/Day",

        skills: [
            "Flutter",
            "Dart",
            "Firebase",
            "REST API"
        ],

        contains: [
            "Pros",
            "Work Environment",
            "Tips"
        ],

        rating: 4.6,
        author: "User - 107",
        date: "18 Oct 2026",
        likes: 17,
        comments: 3
    },
    {
        company: "Agoda",
        workMode: "Hybrid",
        role: "Software Engineer",
        salary: "900 THB/Day",

        skills: [
            "Java",
            "Spring",
            "AWS",
            "Docker",
            "MySQL",
            "Git"
        ],

        contains: [
            "Interview Questions",
            "Pros",
            "System Design",
            "Salary",
            "Tips"
        ],

        rating: 5,
        author: "User - 108",
        date: "15 Oct 2026",
        likes: 42,
        comments: 15
    },
    {
        company: "Line",
        workMode: "Hybrid",
        role: "Full Stack Developer",
        salary: "850 THB/Day",

        skills: [
            "React",
            "Node.js",
            "MongoDB",
            "AWS"
        ],

        contains: [
            "Interview Questions",
            "Pros",
            "Tech Stack"
        ],

        rating: 4.8,
        author: "User - 109",
        date: "14 Oct 2026",
        likes: 31,
        comments: 9
    },
    {
        company: "Microsoft",
        workMode: "Remote",
        role: "Software Engineer Intern",
        salary: "1000 THB/Day",

        skills: [
            "C#",
            ".NET",
            "Azure",
            "GitHub",
            "SQL"
        ],

        contains: [
            "Interview Questions",
            "Pros",
            "Salary",
            "Work Environment",
            "Tips"
        ],

        rating: 5,
        author: "User - 110",
        date: "12 Oct 2026",
        likes: 55,
        comments: 18
    },
    {
        company: "IBM",
        workMode: "Hybrid",
        role: "Backend Developer",
        salary: "650 THB/Day",

        skills: [
            "Java",
            "Spring",
            "SQL",
            "Docker"
        ],

        contains: [
            "Pros",
            "Cons",
            "Work Environment"
        ],

        rating: 4.1,
        author: "User - 111",
        date: "10 Oct 2026",
        likes: 11,
        comments: 2
    },
    {
        company: "Grab",
        workMode: "Hybrid",
        role: "Data Engineer",
        salary: "850 THB/Day",

        skills: [
            "Python",
            "Spark",
            "Airflow",
            "AWS",
            "SQL"
        ],

        contains: [
            "Interview Questions",
            "Pros",
            "Data Pipeline",
            "Salary"
        ],

        rating: 4.7,
        author: "User - 112",
        date: "08 Oct 2026",
        likes: 27,
        comments: 7
    },
    {
        company: "Grab",
        workMode: "Hybrid",
        role: "Data Engineer",
        salary: "850 THB/Day",

        skills: [
            "Python",
            "Spark",
            "Airflow",
            "AWS",
            "SQL"
        ],

        contains: [
            "Interview Questions",
            "Pros",
            "Data Pipeline",
            "Salary"
        ],

        rating: 4.7,
        author: "User - 112",
        date: "08 Oct 2026",
        likes: 27,
        comments: 7
    },
    {
        company: "Grab",
        workMode: "Hybrid",
        role: "Data Engineer",
        salary: "850 THB/Day",

        skills: [
            "Python",
            "Spark",
            "Airflow",
            "AWS",
            "SQL"
        ],

        contains: [
            "Interview Questions",
            "Pros",
            "Data Pipeline",
            "Salary"
        ],

        rating: 4.7,
        author: "User - 112",
        date: "08 Oct 2026",
        likes: 27,
        comments: 7
    }
];

let currentPage = 1;

const cardsPerPage = 6;
const totalPages = Math.ceil(reviews.length / cardsPerPage);

//page number
function renderPages(){
    pageNumbers.innerHTML = "";

    for(let page = 1; page <= totalPages; page++){

        const pageLink = document.createElement("button");

        pageLink.textContent = page;

        if(page === currentPage){
            pageLink.setAttribute("aria-current", "page");
        }
        pageLink.addEventListener("click", () => {
            currentPage = page;
            render();
        });
        pageNumbers.appendChild(pageLink);
    }
}
renderPages();

//card
function renderCards(){
    const start = (currentPage - 1) * cardsPerPage;
    const end = start + cardsPerPage;
    const pageData = reviews.slice(start, end);

    cardGrid.innerHTML = "";

    pageData.forEach(review => {

        let starsHtml = "";
        for(let i = 1; i <= 5; i++){
            if(i <= Math.floor(review.rating)){
                starsHtml += '<i data-lucide="star" class="filled-star"></i>';
            }else{
                starsHtml += '<i data-lucide="star" class="empty-star"></i>';
            }
        }

        const card = document.createElement("article");
        card.className = "card";

        card.innerHTML = `
            <div class="top">
                <h3>${review.company}</h3>
                <span class="mode">${review.workMode}</span>
            </div>

            <div class="line role">
                <i data-lucide="briefcase-business"></i>
                ${review.role}
            </div>

            <div class="line pay">
                <i data-lucide="circle-dollar-sign"></i>
                ${review.salary}
            </div>

            <div class="line">
                <i data-lucide="code-xml"></i>
                <div class="chips js-fit"></div>
            </div>

            <div class="line contains js-fit">
                <span>Contains</span>
            </div>

            <div class="stars">
                ${starsHtml}
                <span>${review.rating}</span>
            </div>

            <div class="who">
                <span class="avatar">
                    <i data-lucide="user-round"></i>
                </span>

                <div>
                    <b>${review.author}</b>
                    <small>${review.date}</small>
                </div>
            </div>

            <div class="acts">
                <button>
                    <i data-lucide="thumbs-up"></i>
                    ${review.likes}
                </button>

                <button>
                    <i data-lucide="message-square"></i>
                    ${review.comments}
                </button>

                <button aria-label="บันทึก">
                    <i data-lucide="bookmark"></i>
                </button>
            </div>
        `;

        const fitBoxes = card.querySelectorAll(".js-fit");
        fitBoxes[0]._items = review.skills;
        fitBoxes[1]._items = review.contains;

        cardGrid.appendChild(card);
    });

    lucide.createIcons();
    fitAll();
}
renderCards();

function render(){
    renderPages();
    updateButtons();
    renderCards();
}
nextBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if(currentPage < totalPages){
        currentPage++;
    }
    render()
});
prevBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if(currentPage > 1){
        currentPage--;
    }
    render()
});

function updateButtons() {
    if(currentPage === 1){
        prevBtn.setAttribute("aria-disabled", "true");
    } else {
        prevBtn.removeAttribute("aria-disabled");
    }

    if(currentPage === totalPages){
        nextBtn.setAttribute("aria-disabled", "true");
    } else {
        nextBtn.removeAttribute("aria-disabled");
    }
}
updateButtons();

function fitChips(box) {
    const items = box._items || [];
    box.querySelectorAll(".chip").forEach(c => c.remove());

    const chips = items.map(text => {
        const s = document.createElement("span");
        s.className = "chip";
        s.textContent = text;
        box.appendChild(s);
        return s;
    });
    const more = document.createElement("button");
    more.type = "button";
    more.className = "chip more";
    box.appendChild(more);

    for (let n = items.length; n >= 0; n--) {
        chips.forEach((c, i) => c.style.display = i < n ? "" : "none");
        const remain = items.length - n;
        more.style.display = remain > 0 ? "" : "none";
        more.textContent = "+" + remain;
        more._hidden = items.slice(n);
        if (box.scrollWidth <= box.clientWidth) break;
    }
    more.onclick = (e) => {
    e.stopPropagation(); 
    showPop(more, more._hidden);
};
}
function fitAll() {
    document.querySelectorAll(".js-fit").forEach(fitChips);
}
document.fonts.ready.then(fitAll);
window.addEventListener("resize", fitAll);

//โชว์ของใน+
const pop = document.createElement("div");
pop.className = "more-pop";
pop.hidden = true;
document.body.appendChild(pop);

function showPop(btn, hiddenItems) {
    pop.innerHTML = hiddenItems.map(t => `<span class="chip">${t}</span>`).join("");
    pop.hidden = false;
    const r = btn.getBoundingClientRect();
    pop.style.top = (r.bottom + window.scrollY + 6) + "px";
    const left = r.left + window.scrollX;
    pop.style.left = Math.max(12, Math.min(left, window.innerWidth - pop.offsetWidth - 12)) + "px";
}

document.addEventListener("click", () => pop.hidden = true);
window.addEventListener("scroll", () => pop.hidden = true);