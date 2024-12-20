const gerneList = document.getElementById("gerneList");
const gerneSearch = document.getElementById("gerneSearch");
const newGerneContainer = document.getElementById("newGerneContainer");
const newGerneInput = document.getElementById("newGerne");

// Fetch genres from backend and populate dropdown list
async function fetchGernes() {
    try {
        const response = await fetch('/admin/api/gernes'); // Gọi API backend
        if (!response.ok) throw new Error('Failed to fetch gernes');

        const gernes = await response.json(); // Parse JSON từ API
        populateGerneList(gernes); // Nạp dữ liệu vào dropdown
    } catch (error) {
        console.error('Error fetching gernes:', error);
    }
}

// Populate gerne dropdown list
function populateGerneList(gernes, filter = "") {
    gerneList.innerHTML = ""; // Clear the list
    const filteredGernes = gernes.filter(gerne => gerne.name.toLowerCase().includes(filter.toLowerCase()));
    filteredGernes.forEach(gerne => {
        const item = document.createElement("div");
        item.classList.add("dropdown-item");
        item.textContent = gerne.name; // Hiển thị tên thể loại
        item.addEventListener("click", () => {
            gerneSearch.value = gerne.name;
            gerneList.style.display = "none";

            // Redirect to statistic page with gerne_id
            window.location.href = `/admin/book-manager?gerne_id=${gerne.id}`;
        });
        gerneList.appendChild(item);
    });
}

// Show dropdown list on click
gerneSearch.addEventListener("focus", () => {
    fetchGernes(); // Fetch và hiển thị danh sách đầy đủ
    gerneList.style.display = "block"; // Hiển thị dropdown
});

// Event listener cho tìm kiếm
gerneSearch.addEventListener("input", async () => {
    const response = await fetch('/admin/api/gernes'); // Fetch lại gernes
    const gernes = await response.json();
    populateGerneList(gernes, gerneSearch.value); // Filter theo input
});

// Ẩn dropdown khi click ra ngoài
document.addEventListener("click", (event) => {
    if (!event.target.closest(".dropdown-container")) {
        gerneList.style.display = "none";
    }
});

// Form submission handler
document.getElementById("bookForm").addEventListener("submit", function(event) {
    event.preventDefault();

    let selectedGerne = gerneSearch.value;
    if (selectedGerne === "" && newGerneInput.value.trim() !== "") {
        selectedGerne = newGerneInput.value.trim();
        // Optionally, gửi thể loại mới lên server qua API POST (nếu cần)
        console.log("New Gerne Added:", selectedGerne);
    }

    alert("Book added successfully!");
    // Thêm logic xử lý form tại đây
});


