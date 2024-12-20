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
            window.location.href = `/admin/statistic-frequency?gerne_id=${gerne.id}`;
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





//
//// Lấy các phần tử DOM cần thiết
//const genreList = document.getElementById("genreList");
//const genreSearch = document.getElementById("genreSearch");
//const newGenreContainer = document.getElementById("newGenreContainer");
//const newGenreInput = document.getElementById("newGenre");
//const genreDropdown = document.getElementById("genreDropdown"); // Dropdown chứa thể loại
//const tableBody = document.querySelector(".list"); // Body của bảng
//const bookForm = document.getElementById("bookForm"); // Form thêm sách
//
//// Hàm fetch thể loại từ API backend
//async function fetchGenres() {
//    try {
//        const response = await fetch('/admin/api/genres'); // Gọi API lấy danh sách thể loại
//        if (!response.ok) throw new Error('Failed to fetch genres');
//
//        const genres = await response.json(); // Parse JSON từ API
//        populateGenreList(genres); // Nạp dữ liệu vào dropdown
//    } catch (error) {
//        console.error('Error fetching genres:', error);
//    }
//}
//
//// Hàm populate danh sách thể loại vào dropdown
//function populateGenreList(genres, filter = "") {
//    genreList.innerHTML = ""; // Clear danh sách
//    const filteredGenres = genres.filter(genre => genre.name.toLowerCase().includes(filter.toLowerCase()));
//    if (filteredGenres.length === 0) {
//        genreList.innerHTML = `<div class="dropdown-item text-center">Không tìm thấy thể loại</div>`;
//        return;
//    }
//
//    filteredGenres.forEach(genre => {
//        const item = document.createElement("div");
//        item.classList.add("dropdown-item");
//        item.textContent = genre.name; // Hiển thị tên thể loại
//        item.addEventListener("click", () => {
//            genreSearch.value = genre.name; // Gán giá trị đã chọn vào ô input
//            genreList.style.display = "none"; // Ẩn danh sách
//            newGenreContainer.style.display = "none"; // Ẩn input thêm mới
//        });
//        genreList.appendChild(item);
//    });
//}
//
//// Hiển thị dropdown khi focus vào ô tìm kiếm
//genreSearch.addEventListener("focus", () => {
//    fetchGenres(); // Lấy danh sách thể loại đầy đủ
//    genreList.style.display = "block"; // Hiển thị dropdown
//});
//
//// Tìm kiếm thể loại khi nhập input
//let debounceTimeout;
//genreSearch.addEventListener("input", () => {
//    clearTimeout(debounceTimeout);
//    debounceTimeout = setTimeout(async () => {
//        try {
//            const response = await fetch('/admin/api/genres'); // Gọi API lấy danh sách thể loại
//            const genres = await response.json();
//            populateGenreList(genres, genreSearch.value); // Lọc danh sách theo input
//        } catch (error) {
//            console.error('Error fetching filtered genres:', error);
//        }
//    }, 300); // Chờ 300ms trước khi thực hiện tìm kiếm
//});
//
//// Ẩn dropdown khi click ra ngoài
//document.addEventListener("click", (event) => {
//    if (!event.target.closest(".dropdown-container")) {
//        genreList.style.display = "none"; // Ẩn dropdown
//    }
//});
//
//// Form submission: xử lý khi người dùng submit form
//bookForm.addEventListener("submit", async function (event) {
//    event.preventDefault(); // Ngăn chặn reload trang
//
//    let selectedGenre = genreSearch.value; // Thể loại đã chọn
//    if (selectedGenre === "" && newGenreInput.value.trim() !== "") {
//        // Nếu người dùng nhập thể loại mới
//        selectedGenre = newGenreInput.value.trim();
//
//        // Gửi thể loại mới lên server qua API POST
//        try {
//            const response = await fetch('/admin/api/genres', {
//                method: 'POST',
//                headers: { 'Content-Type': 'application/json' },
//                body: JSON.stringify({ name: selectedGenre }),
//            });
//            if (!response.ok) throw new Error('Failed to add new genre');
//            alert("Thể loại mới đã được thêm thành công!");
//        } catch (error) {
//            console.error("Error adding new genre:", error);
//        }
//    }
//
//    // Xử lý thêm sách ở đây
//    alert("Sách đã được thêm thành công!");
//    // Thêm logic gửi dữ liệu sách lên backend (nếu cần)
//});
//
//// Lấy dữ liệu thống kê hoặc danh sách sách từ API
//async function fetchGenreData(genreId) {
//    try {
//        const response = await fetch(`/admin/api/genre-stats?genre_id=${genreId}`);
//        if (!response.ok) throw new Error("Failed to fetch data");
//        const data = await response.json();
//        updateTable(data, genreId); // Cập nhật bảng với dữ liệu từ API
//    } catch (error) {
//        console.error("Error fetching genre data:", error);
//    }
//}
//
//// Hàm cập nhật bảng dữ liệu
//function updateTable(data, genreId) {
//    tableBody.innerHTML = ""; // Xóa dữ liệu cũ
//    if (data.length === 0) {
//        tableBody.innerHTML = `<tr><td colspan="3" class="text-center">Không có dữ liệu</td></tr>`;
//        return;
//    }
//
//    if (genreId === 1) {
//        // Nếu là thống kê
//        data.forEach(row => {
//            tableBody.innerHTML += `
//                <tr>
//                    <td style="border: 1px solid #adb5bd;" class="text-center">${row.id}</td>
//                    <td style="border: 1px solid #adb5bd;" class="text-center">${row.name}</td>
//                    <td style="border: 1px solid #adb5bd;" class="text-center">${row.count}</td>
//                </tr>
//            `;
//        });
//    } else {
//        // Nếu là danh sách sách
//        data.forEach(row => {
//            tableBody.innerHTML += `
//                <tr>
//                    <td style="border: 1px solid #adb5bd;" class="text-center">${row.id}</td>
//                    <td style="border: 1px solid #adb5bd;" class="text-center">${row.title}</td>
//                    <td style="border: 1px solid #adb5bd;" class="text-center">${row.quantity}</td>
//                </tr>
//            `;
//        });
//    }
//}
//
//// Gắn sự kiện change cho dropdown
//genreDropdown.addEventListener("change", (event) => {
//    const genreId = parseInt(event.target.value); // Lấy giá trị thể loại
//    fetchGenreData(genreId); // Gọi API lấy dữ liệu
//});
