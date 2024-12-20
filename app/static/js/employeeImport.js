
let currentCheckedBookState = {};
let currentItemState = {};

const url = new URL(window.location);
const CONFIG_API = "/api/v1/config"
const BOOK_API = "/api/v1/book"
let config;


const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short', // e.g., Thứ Sáu
    year: 'numeric',
    month: 'numeric', // e.g., Tháng 1
    day: 'numeric',
    // timeZoneName: 'short' // e.g., GMT
});

const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    // timeZoneName: 'short' // e.g., GMT
});

const modal = document.querySelector(".modal");
const modalExport = document.querySelector(".modal-export");
const modalBook = document.querySelector(".modal-book");
const overlay = document.querySelector(".overlay");

const openModalBookBtn = document.querySelector(".open-modal-book-btn");
const addBookBtn = document.querySelector(".add-book-btn");
const deleteBtn = document.querySelector(".delete-all-btn");
const exportBtn = document.querySelector(".export-btn");

const allCheckBox = document.querySelector(".all-check-box");
const statusType = document.querySelector(".status-type");
const importList = document.querySelector(".import-list");
const importContainer = document.querySelector(".import-container");
const bookList = document.querySelector(".book-list");

const searchDropdownMenu = document.querySelector(".search-dropdown-menu");
const searchInput = document.querySelector(".search-input");
//===============================================================API===============================================================

const fetchBook = async function(params) {
    try {
        const res = await fetch(`${BOOK_API}/manage/${params}`)
        if(!res.ok) throw new Error("Cannot fetch books");
        return await res.json();
    } catch(err) {
        throw err;
    }
}

const fetchBookById = async function(id) {
    try {
        const res = await fetch(`${BOOK_API}/${id}/manage`)
        if(!res.ok) throw new Error("Cannot fetch book");
        return await res.json();
    } catch(err) {
        throw err;
    }
}

const postFormImport = async function() {
    try {
        const res = await fetch(`${BOOK_API}/import`, {
            method: "POST",
            body: JSON.stringify(Object.values(currentItemState)),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if(!res.ok) throw new Error("Can't create import form");
        return await res.json();
    } catch(err) {
        throw err;
    }
}


//===============================================================FUNCTION===============================================================
const openModal = function () {
    modal.classList.add("d-flex");
    overlay.classList.add("d-flex");
    modal.classList.remove("d-none");
    overlay.classList.remove("d-none");
}

const closeModal = function () {
    modal.classList.remove("d-flex");
    overlay.classList.remove("d-flex");
    modal.classList.add("d-none");
    overlay.classList.add("d-none");

    modalBook.classList.add("d-none");
    modalBook.classList.remove("d-flex");

    modalExport.classList.add("d-none");
    modalExport.classList.remove("d-flex");
}

const openBookModal = function() {
    openModal();
    modalBook.classList.add("d-flex");
    modalBook.classList.remove("d-none");
}

const openExportModal = function() {
    openModal();
    modalExport.classList.add("d-flex");
    modalExport.classList.remove("d-none");
}

const removeAllCheckedBox = function() {
    currentCheckedBookState = {};
    bookList.querySelectorAll("input").forEach(input => input.checked = false);
    allCheckBox.checked = false;
}

const extractBookItemData = function (bookItem) {
    const bookId = +bookItem.querySelector(".book-item-id").textContent.trim();
    const title = bookItem.querySelector(".book-item-title").textContent.trim();
    const gerne = bookItem.querySelector(".book-item-gerne").textContent.trim();
    const author = bookItem.querySelector(".book-item-author").textContent.trim();
    const img = bookItem.querySelector(".book-item-img").getAttribute("src");
    const stockQuantity = +bookItem.querySelector(".book-item-quantity").textContent.trim();

    return {
        bookId,
        img,
        title,
        stockQuantity,
        gerne,
        author,
    };
};

const renewBookList = async function() {
    const data = await fetchBook(url.search);
    renderBookItems(data['books']);
    url.searchParams.delete("quantityStatus");
}
//===============================================================EVENT===============================================================


let currentSelectedSearchType;
searchDropdownMenu.addEventListener("click", function(e) {
    searchInput.placeholder = e.target.textContent;
    const id = +e.target.getAttribute("id");
    currentSelectedSearchType = id;
})

searchInput.addEventListener("keypress", async function(e) {
    if(e.key !== "Enter") return;

    try {
        let data;
        if(currentSelectedSearchType === 1) { //Fetch by title
            data = await fetchBook(`?keyword=${searchInput.value}`);
        }
        else { //Fetch by id
            if (searchInput.value.trim() === '' || searchInput.value.trim() === null) {
                data = await fetchBook(`?keyword=${searchInput.value}`);
            }
            else data = {'books': [await fetchBookById(+searchInput.value)]};
        }
        renderBookItems(data['books']);
    } catch(err) {
        throw(err.message);
    }
})

window.addEventListener("load", async function() {
    try {
        const res = await fetch(`${CONFIG_API}`);
        if(!res.ok) throw new Error("cannot fetch config");
        config = await res.json();
    } catch(err) {
        alert(err.message);
    }
})

exportBtn.addEventListener("click", async function() {
    if(Object.keys(currentItemState).length === 0) {
        // renderToast("Phải có ít nhất 1 sản phẩm", "center", "orange");
        return;
    }
    try {
        const formImport = await postFormImport();
        openExportModal();
        renderImportedForm(formImport);
        resetState();
        const {jsPDF} = window.jspdf;
        html2canvas(document.querySelector("#invoice"), {
            useCORS: true,
            allowTaint: false,
            scale: 2 // Improves image quality
        }).then(canvas => {
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            // Add image to PDF
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

            pdf.save(`form_import_${document.querySelector('[form-import-id]').getAttribute("form-import-id")}.pdf`);
        });

    } catch(err) {
        alert(err.message);
    } finally {
        await renewBookList();
    }
});

deleteBtn.addEventListener("click", () => {
    currentItemState = {};
    renderImportedItems();
});

overlay.addEventListener("click", () => {
    closeModal();
    removeAllCheckedBox();
});

openModalBookBtn.addEventListener("click", openBookModal);

bookList.addEventListener("click", function (e) {
    const bookItem = e.target.closest(".book-item");
    if (!bookItem) return;

    const checkedBox = bookItem.querySelector("input");
    checkedBox.checked = !checkedBox.checked;
    const bookItemData = extractBookItemData(bookItem);

    if (checkedBox.checked) {
        currentCheckedBookState[bookItemData['bookId']] = bookItemData;
    } else {
        delete currentCheckedBookState[bookItemData['bookId']];
    }
});

allCheckBox.addEventListener("click", function (e) {
    if (allCheckBox.checked) {
        document.querySelectorAll(".book-item").forEach(bookItem => {
            bookItem.querySelector("input").checked = true;
            const bookItemData = extractBookItemData(bookItem);
            currentCheckedBookState[bookItemData['bookId']] = bookItemData;
        });
    } else {
        document.querySelectorAll(".book-item").forEach(bookItem => {
            bookItem.querySelector("input").checked = false;
            const bookItemData = extractBookItemData(bookItem);
            delete currentCheckedBookState[bookItemData['bookId']];
        });
    }
});

addBookBtn.addEventListener("click", function() {
    Object.entries(currentCheckedBookState).forEach(item => {
        if(currentItemState[item[0]]) {
            currentItemState[item[0]]['quantity'] += 1;
        } else {
            currentItemState[item[0]] = item[1];
            currentItemState[item[0]]['stockQuantity'] = item[1]['stockQuantity'];
            currentItemState[item[0]]['quantity'] = config['min_restock_qty'];
        }
    });
    renderImportedItems();
    removeAllCheckedBox();
    closeModal();
});

statusType.addEventListener("click", async function(e)  {

    const filterItem = e.target.closest(".filter-type-item");
    if (!filterItem) return;

    const toggleId = +filterItem.getAttribute("id");
    let isToggle = false;

    statusType.querySelectorAll(".filter-type-item").forEach(item => {
        const itemId = +item.getAttribute("id");
        const input = item.querySelector("input")

        input.checked = itemId === toggleId ? !input.checked : false;
        isToggle ||= input.checked;
    })
    url.searchParams.delete("quantityStatus");

    if(isToggle)
        url.searchParams.set("quantityStatus", toggleId);
    try {
        const data = await fetchBook(url.search);
        renderBookItems(data['books']);
    } catch (err) {
        alert(err.message);
    }
});

importContainer.addEventListener("click", function(e) {
    const removeBtn = e.target.closest(".remove-import-item-btn");
    const incrementBtn = e.target.closest(".increment-qty-btn");
    const decrementBtn = e.target.closest(".decrement-qty-btn");
    const id = e.target.closest(".import-item")?.getAttribute("id");

    let isTriggered = false;

    if (removeBtn) {
        delete currentItemState[+id];
        isTriggered ||= true;
    }
    if (incrementBtn) {
        const input = incrementBtn.previousElementSibling;
        currentItemState[+id]['quantity'] = +input.value + 1;
        isTriggered ||= true;
    }
    if (decrementBtn) {
        const input = decrementBtn.nextElementSibling;
        currentItemState[+id]['quantity'] = input.value > config['min_restock_qty'] ? +input.value - 1 : +input.value;
        isTriggered ||= true;
    }
    isTriggered && renderImportedItems();
})

importContainer.addEventListener("change", function(e) {
    const input = e.target;
    if (input.value < config['min_restock_qty'] || input.value === '') input.value = config['min_restock_qty'];
    currentItemState[+input.getAttribute("input-id")]['quantity'] = +input.value;
    renderImportedItems()
})


const resetState = function () {
    currentItemState = {};
    renderImportedItems();
}

const renderImportedItems = function() {
    importList.innerHTML = '';
    const html = Object.entries(currentItemState).map(item => {
        return `
        <tr class="import-item" id="${item[1]['bookId']}">
            <th scope="row">
                <div class="media align-items-center">
                    <div class="media-body text-center">
                        <span class="name mb-0 text-sm text-center w-100">${item[1]['bookId']}</span>
                    </div>
                </div>
            </th>
            <td scope="row" class="justify-content-center">
                <div class="media align-items-center text-center" style="width:50px">
                    <img src="${item[1]['img']}"
                         alt="" class="h-100 img-fluid book-item-img">
                </div>
            </td>
            <td class="budget text-center">
                <div class="media align-items-center">
                    <div class="media-body text-left text-truncate" style="width: 100px !important;">
                        <span class="order-item-name mb-0 text-sm text-center w-100">${item[1]['title']}</span>
                    </div>
                </div>
            </td>
            <td>
                <span class="badge badge-dot mr-4 text-center w-100">
                <span class="status text-center">${item[1]['gerne']}</span>
                </span>
            </td>
            <td>
                <div class="d-flex align-items-center w-100 justify-content-center">
                    <span class="completion mr-2">${item[1]['author']}</span>
                </div>
            </td>
            <td>
                <div class="d-flex justify-content-center">
                    <div class="d-flex justify-content-between align-content-center w-100">
                        <span class="cursor-pointer decrement-qty-btn">-</span>
                        <input input-id="${item[1]['bookId']}" inputmode="numeric"
                               oninput="this.value = this.value.replace(/\\\\D+/g, '')"
                               class="text-center" value="${item[1]['quantity']}">
                        <span class="cursor-pointer increment-qty-btn">+</span>
                    </div>
                </div>
            </td>
            <td>
                <div class="product-qty-status text-xs ${item[1]['stockQuantity'] < config['min_restock_level'] ? 'product-qty-status-shortage' : '' } text-center py-1 cursor-pointer">
                        ${item[1]['stockQuantity'] < config['min_restock_level'] ? 'Cần nhập thêm' : 'Đủ số lượng' }
                </div>
            </td>
            <td class="text-right remove-import-item-btn">
                <div class="dropdown">
                    <a class="btn btn-sm btn-icon-only text-light cursor-pointer" role="button">
                        <i class="fa fa-window-close" aria-hidden="true"></i>
                    </a>
                </div>
            </td>
        </tr>`}).join("");
    importList.insertAdjacentHTML("beforeend", html);
}

const renderBookItems = function(books) {
    bookList.innerHTML = '';
    const html = books.map(book => `
        <tr class="cursor-pointer book-item" id="${book['book_id']}">
            <th scope="row">
                <div class="media align-items-center">
                    <input type="checkbox" ${currentCheckedBookState[book['book_id']] != null ? 'checked' : ''}>
                </div>
            </th>
            <td scope="row">
                <div class="media align-items-center">
                    <div class="book-item-id" id="1">${book['book_id']}</div>
                </div>
            </td>
            <td scope="row" class="justify-content-center">
                <div class="media align-items-center text-center" style="width:50px">
                    <img src="${book.images?.[0]?.image_url}" 
                         alt="" class="h-100 img-fluid book-item-img">
                </div>
            </td>
            <td>
                <div class="media-body text-truncate" style="width:200px">
                    <span class="name mb-0 text-xs w-100 book-item-title">${book['title']}</span>
                </div>
            </td>
            <td>
                <div class="media-body">
                    <span class="name mb-0 text-xs book-item-barcode">${book['barcode']}</span>
                </div>
            </td>
            <td class="budget book-item-gerne">
                ${book['gerne']['name']}
            </td>
            <td>
                <span class="badge badge-dot mr-4">
                <i class="bg-warning"></i>
                <span class="status book-item-quantity">${book['quantity']}</span>
                </span>
            </td>
            <td>
                <div class="media-body text-truncate book-item-author" style="width:200px">
                    <span class="name mb-0 text-xs w-100 book-item-title">${book['author']}</span>
                </div>
            </td>
            <td>
                <div class="avatar-group book-item-price">
                    ${book['price']}
                </div>
            </td>
            <td>
                <div class="product-qty-status text-xs ${book['quantity'] < config['min_restock_level'] ? 'product-qty-status-shortage' : ''}  text-center py-1 cursor-pointer">
                    ${book['quantity'] >= config['min_restock_level'] ? "Đủ số lượng" : "Cần nhập thêm"} 
                </div>
            </td>
        </tr>`).join("");
    bookList.insertAdjacentHTML("beforeend", html);
}

const renderImportedForm = function(form) {
    const html = `
    <div id="invoice" class="mt-4 w-100" form-import-id="${form['form_import_id']}">
        <div class="card">
            <div class="card-header text-center">
                <img class="image-fluid w-25"
                     src="https://cdn0.fahasa.com/skin/frontend/ma_vanese/fahasa/images/fahasa-logo.png" alt="">
            </div>
            <div class="card-header invoice-header text-center">
                <p class="mb-0 font-weight-600">Mã phiếu: ${form['form_import_id']} &nbsp; | &nbsp; Ngày nhập: ${dateFormatter.format(new Date(form['created_at']))} &nbsp; |
                    &nbsp; Hotline:
                    19008386 &nbsp;</p>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-12">
                        <h1 class="text-center pb-3 display-3 text-black">PHIẾU NHẬP SÁCH</h1>
                    </div>
                    <div class="col-md-6">
                        <p>
                            <strong class="font-weight-600">Tên nhân viên:</strong>${form['employee']['name']}<br>
                            <strong class="font-weight-600">Ngày giờ nhập:</strong> ${timeFormatter.format(new Date(form['created_at']))} ${dateFormatter.format(new Date(form['created_at']))}
                        </p>
                    </div>
                    <div class="col-md-6 text-right"></div>
                    <div class="table-responsive">
                        <table class="table table-bordered">
                            <thead>
                            <tr class="text-center">
                                <th>ID</th>
                                <th>Tên</th>
                                <th>Thể loại</th>
                                <th>Tác giả</th>
                                <th>Số lượng</th>
                            </tr>
                            </thead>
                            <tbody>
                            ${form['detail'].map(book => `
                            <tr class="text-center">
                                <td>${book['book_detail']['book_id']}</td>
                                <td class="wrap-text text-left">${book['book_detail']['title']}</td>
                                <td>${book['book_detail']['gerne']['name']}</td>
                                <td>${book['book_detail']['author']}</td>
                                <td>${book['quantity']}</td>
                            </tr>`).join('')}
                            <tr class="text-right">
                                <td colspan="4"><strong>Tổng số lượng:</strong></td>
                                <td class="text-center">${form['total_quantity']}</td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="col-12 pt-5">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="d-flex flex-column align-items-center" style="padding-left: 2%">
                                    <strong class="pb-5">Người lập phiếu</strong>
                                    <div class="pt-5">${form['employee']['name']}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
    modalExport.innerHTML = '';
    modalExport.insertAdjacentHTML("beforeend", html);
}