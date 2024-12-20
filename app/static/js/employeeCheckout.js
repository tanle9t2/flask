const vndCurrencyFormat = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
});

function extractCurrencyNumber(currencyString) {
    const numericValue = currencyString.replace(/[^\d,]/g, ''); // Keep digits and comma
    return parseFloat(numericValue.replace(',', '.')); // Convert to float, replace comma with dot
}

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

//============================================DOM============================================

const modal = document.querySelector(".modal");
const modalBody = document.querySelector(".modal-body");
const overlay = document.querySelector(".overlay")

const orderContainer = document.querySelector(".order-container");
const productContainer = document.querySelector(".product-container");

const deleteAllBtn = document.querySelector(".delete-all-btn");
const checkoutBtn = document.querySelector(".checkout-btn");

const barcodeScanner = document.querySelector("#reader");
const qrBtn = document.querySelector(".qr-code-btn");

const searchPhoneNumBtn = document.querySelector(".search-phone-number-btn");
const addPhoneNumBtn = document.querySelector(".add-phone-number-btn");
const searchBtn = document.querySelector(".btn-search");
const resetBtn = document.querySelector(".btn-reset");

const inputGroupSearchPhoneNumber = document.querySelector(".input-group-search-phone-number");
const inputGroupAddPhoneNumber = document.querySelector(".input-group-add-phone-number");
const inputSearch = document.querySelector(".input-search");

const phoneNumberDropDown = document.querySelector(".phone-number-dropdown");
const customerNameContainer = document.querySelector(".customer-name-container");

let currentOrderItemsState = {};
let currentAddressesState= {};
let currentCustomerInfoState = {};
let currentPhoneNumberSearchTimeoutID;

//============================================Barcode Scanner============================================
let html5QrcodeScanner = new Html5QrcodeScanner(
    "reader", {
        fps: 10,
        qrbox: {width: 300, height: 200},
    },
    false
);
html5QrcodeScanner.render(onScanSuccess, onScanFailure);

async function onScanSuccess(decodedText, decodedResult) {

    html5QrcodeScanner.pause(1);
    setTimeout(() => {
        html5QrcodeScanner.resume();
        modal.classList.remove("d-flex")
        overlay.classList.remove("d-flex");
    }, 1000);

    try {
        const data = await fetchBookByBarcode(decodedText);
        if (currentOrderItemsState[data['book_id']]) {
            currentOrderItemsState[data['book_id']]['quantity'] = +currentOrderItemsState[data['book_id']]['quantity'] + 1;
        } else {
            currentOrderItemsState[data['book_id']] = data;
            currentOrderItemsState[data['book_id']]['quantity'] = 1;
        }
        renderOrderItem(Object.entries(currentOrderItemsState).map(item => item[1]));
    } catch(err) {
        renderToast(err.message, "center", "orange");
    }
}

function onScanFailure(error) {}

//============================================API============================================

async function fetchPhoneNumber(phoneNumber) {
    try {
        const res = await fetch(`/api/v1/user/phone_number/${phoneNumber}`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!res.ok) throw new Error("Không có số điện thoại tương ứng");
        return await res.json();
    } catch(err) {
        throw err;
    }
}

async function fetchBooks() {
    const res = await fetch(`/api/v1/book`, {
        method: "GET",
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if(!res.ok) throw new Error("Sách không tồn tại");
    return await res.json();
}

async function fetchBookById(bookId) {
    const res = await fetch(`/api/v1/book/${bookId}/manage`, {
        method: "GET",
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if(!res.ok) throw new Error("Sách không tồn tại");
    return await res.json();
}

async function fetchBookByBarcode(barcode) {
    const res = await fetch(`/api/v1/book/barcode/${barcode}`, {
        method: "GET",
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if(!res.ok) throw new Error("Barcode không tồn tại")
    return await res.json();
}

async function postOfflineOrder() {

    const data = {
        'customerInfo': currentCustomerInfoState,
        'orderList': Object.values(currentOrderItemsState)
    };
    console.log(data);
    const res = await fetch(`/api/v1/order/add`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (!res.ok) throw new Error("Lỗi");
    return await res.json();
}

//============================================FUNCTION============================================

const openModal = function() {
    modal.classList.add("d-flex");
    overlay.classList.add("d-flex");
}

const closeModal = function() {
    modal.classList.remove("d-flex");
    overlay.classList.remove("d-flex");
    barcodeScanner.classList.remove("d-none");

    Array.from(modalBody.children).forEach(child => {
        if(child !== barcodeScanner) modalBody.removeChild(child);
    })
}

const resetState = function () {
    currentOrderItemsState = {};
    renderOrderItem(Object.entries(currentOrderItemsState).map(item => item[1]));
}

//============================================EVENT============================================

qrBtn.addEventListener("click", openModal);

overlay.addEventListener("click", closeModal);

deleteAllBtn.addEventListener("click", resetState);

phoneNumberDropDown.addEventListener("mousedown", function(e) {
    const target = e.target.closest("li");
    if(!target) return;
    const id = +target.getAttribute("id");
    renderCustomerName(currentAddressesState[id]);

    //retain the selected id
    currentCustomerInfoState = currentAddressesState[id];
});

customerNameContainer.addEventListener("click", function(e) {
    const deleteCustomerBtn = e.target.closest(".btn");
    if(!deleteCustomerBtn) return;
    resetCustomerInfoState();
});


const resetCustomerInfoState = function() {
    customerNameContainer.innerHTML = '';
    currentCustomerInfoState = {};
    inputGroupAddPhoneNumber.querySelector("input").value = '';
    inputGroupSearchPhoneNumber.querySelector("input").value = '';
};

searchPhoneNumBtn.addEventListener("click", function() {
    inputGroupSearchPhoneNumber.classList.add("d-flex");
    inputGroupSearchPhoneNumber.classList.remove("d-none");
    inputGroupAddPhoneNumber.classList.remove("d-flex");
    inputGroupAddPhoneNumber.classList.add("d-none");
    resetCustomerInfoState();
});

addPhoneNumBtn.addEventListener("click", function() {
    inputGroupSearchPhoneNumber.classList.add("d-none");
    inputGroupSearchPhoneNumber.classList.remove("d-flex");
    inputGroupAddPhoneNumber.classList.remove("d-none");
    inputGroupAddPhoneNumber.classList.add("d-flex");
    resetCustomerInfoState();
});

searchBtn.addEventListener("click", async function() {
    try {
        const bookId = inputSearch.value;
        const book = await fetchBookById(bookId);
        renderBookItem([book]);
    } catch(err) {
        alert(err.message);
    }
});

resetBtn.addEventListener("click", async function() {
    try {
         const books = await fetchBooks();
         console.log(books);
         renderBookItem(books['data']['books']);

         inputSearch.value = '';
    } catch(err) {
        alert(err.message);
    }
});

inputGroupSearchPhoneNumber.addEventListener("focusout", function(e) {
    phoneNumberDropDown.classList.add("d-none");
});

inputGroupSearchPhoneNumber.addEventListener("focusin", function(e) {
    phoneNumberDropDown.classList.remove("d-none");
});

inputGroupAddPhoneNumber.addEventListener("input", (e) => {
    currentCustomerInfoState = {
        'id': null,
        'phone_number': e.target.value
    }
});

inputGroupSearchPhoneNumber.addEventListener("input", async function(e) {
    clearTimeout(currentPhoneNumberSearchTimeoutID)
    currentPhoneNumberSearchTimeoutID = setTimeout(async function() {
        try {
            const data = await fetchPhoneNumber(e.target.value);
            renderPhoneNumberList(data);
        } catch(err) {
            console.log(err.message);
        }

    }, 100);
});

checkoutBtn.addEventListener("click", async function () {

    if(Object.keys(currentOrderItemsState).length === 0) {
        renderToast("Phải có ít nhất 1 sản phẩm", "center", "orange");
        return;
    }
    try {
        const order = await postOfflineOrder();
        renderToast("Đã xuất hóa đơn", "right", "#6cbf6c")
        openModal();
        resetState();
        barcodeScanner.classList.add("d-none");

        renderInvoice(order);
        renderToast("Đang tải xuống...", "right", "orange");

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
            pdf.save(`invoice_${document.querySelector('[order-id]').getAttribute("order-id")}.pdf`);

            renderToast("Đã tải xuống", "right")
        });
    } catch (err) {
        renderToast(err.message, "center", "orange");
    }
});

productContainer.addEventListener("click", function (e) {
    const productItem = e.target.closest(".product-item");
    if (!productItem) return;
    const id = productItem.getAttribute("id");

    if (currentOrderItemsState[id]) {
        const input = orderContainer.querySelector(`[input-id="${id}"]`);
        currentOrderItemsState[id]['quantity'] = +input.value + 1;
    } else {
        currentOrderItemsState[id] = {
            'book_id': id,
            'price': productItem.querySelector(".product-price").textContent.split(".")[0].trim(),
            'discount': productItem.querySelector(".discount").textContent,
            'title': productItem.querySelector(".product-name").textContent,
            'quantity': 1
        };
    }
    renderOrderItem(Object.entries(currentOrderItemsState).map(item => item[1]));
});

orderContainer.addEventListener("click", function (e) {
    const removeBtn = e.target.closest(".remove-order-item-btn");
    const incrementBtn = e.target.closest(".increment-qty-btn");
    const decrementBtn = e.target.closest(".decrement-qty-btn");
    const id = e.target.closest(".order-item")?.getAttribute("id");
    let isTriggered = false;

    if (removeBtn) {
        delete currentOrderItemsState[+id];
        isTriggered ||= true;
    }
    if (incrementBtn) {
        const input = incrementBtn.previousElementSibling;
        currentOrderItemsState[+id]['quantity'] = +input.value + 1;
        isTriggered ||= true;
    }
    if (decrementBtn) {
        const input = decrementBtn.nextElementSibling;
        currentOrderItemsState[+id]['quantity'] = input.value > 1 ? +input.value - 1 : input.value;
        isTriggered ||= true;
    }
    isTriggered && renderOrderItem(Object.entries(currentOrderItemsState).map(item => item[1]));
});

orderContainer.addEventListener("change", function (e) {
    const input = e.target;
    if (input.value == 0 || input.value == '') input.value = 1;

    currentOrderItemsState[+input.getAttribute("input-id")]['quantity'] = +input.value;
    renderOrderItem(Object.entries(currentOrderItemsState).map(item => item[1]))
})

//============================================RENDER============================================
const renderToast = function(text, position="center", background="#6cbf6c") {
    Toastify({
        text: text,
        duration: 3000,
        newWindow: true,
        close: true,
        gravity: "top", // `top` or `bottom`
        position: position, // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover
        style: {
            background: background,
        }
    }).showToast();
}

const renderBookItem = function(books) {
    const html = books.map(book => `
    <a class="product-item card col-3 cursor-pointer" id="${book['book_id']}">
        <span class="discount text-white">10%</span>
        <img class="card-img-top"
             src="${book['images'][0]['image_url']}"
             alt="Card image">
        <div class="card-body p-0">
            <p class="card-text product-name">${ book['title'] }</p>
            <p class="text-primary font-weight-bold mb-1 product-price">${vndCurrencyFormat.format(book['price'])}</p>
            <p class="text-secondary text-decoration-line-through mb-1">${vndCurrencyFormat.format(1000)}</p>
        </div>
    </a>`).join('');

    productContainer.innerHTML = '';
    console.log(productContainer);
    productContainer.insertAdjacentHTML("beforeend", html);
}

const renderOrderItem = function (books) {
    const orderList = orderContainer.querySelector(".order-list");
    orderList.innerHTML = '';
    const html = books.map(book => `
        <tr class="order-item" id="${book.book_id}">
            <th scope="row">
                <div class="media align-items-center">
                    <div class="media-body text-left text-truncate book-item">
                        <span class="name mb-0 text-sm text-center w-100">${book.title}</span>
                    </div>
                </div>
            </th>
            <td class="budget text-center">
                ${vndCurrencyFormat.format(book.price)}
            </td>
            <td>
                <span class="badge badge-dot mr-4 text-center w-100">
                <span class="status text-center">${book.discount}</span>
                </span>
            </td>
            <td>
                <div class="d-flex justify-content-center">
                    <div class="d-flex justify-content-between align-content-center w-100">
                        <span class="cursor-pointer decrement-qty-btn">-</span>
                        <input input-id="${book.book_id}" inputmode="numeric"
                               oninput="this.value = this.value.replace(/\\D+/g, '')"
                               class="text-center" value="${book.quantity}">
                        <span class="cursor-pointer increment-qty-btn">+</span>
                    </div>
                </div>
            </td>
            <td>
                <div class="d-flex align-items-center w-100 justify-content-center">
                    <span class="completion mr-2">${vndCurrencyFormat.format(+book.price * +book.quantity)}</span>
                </div>
            </td>
            <td class="text-right remove-order-item-btn">
                <div class="dropdown">
                    <a class="btn btn-sm btn-icon-only text-light cursor-pointer"  role="button">
                        <i class="fa fa-window-close" aria-hidden="true"></i>
                    </a>
                </div>
            </td>
        </tr>`).join('');
    document.querySelector(".total-amount").textContent = vndCurrencyFormat.format(books.reduce((acc, obj) => acc + +obj['price'] * +obj['quantity'], 0));
    document.querySelector(".total-qty").textContent = books.reduce((acc, book) => acc + +book.quantity, 0);
    orderList.insertAdjacentHTML('beforeend', html);
}

const renderInvoice = function (order) {
    const html = `
    <div id="invoice" class="mt-4 w-100" order-id="${order['order_id']}">
        <div class="card">
            <div class="card-header text-center">
                <img class="image-fluid w-25"
                     src="https://cdn0.fahasa.com/skin/frontend/ma_vanese/fahasa/images/fahasa-logo.png" alt="">
            </div>
            <div class="card-header invoice-header text-center">
                <p class="mb-0 font-weight-bold">Mã đơn: ${order['order_id']} &nbsp; | &nbsp; Ngày
                    đặt: ${dateFormatter.format(new Date(order['created_at']))}
                    &nbsp; | &nbsp; Hotline: 19008386
                    &nbsp; | &nbsp; Loại
                    đơn: ${order['order_type']['name']}</p>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-12">
                        <h1 class="text-center pb-3 display-3 text-black">THÔNG TIN HÓA ĐƠN</h1>
                    </div>
                    <div class="col-md-6">
                        <p>
                            <strong class="font-weight-600">Họ và Tên:</strong> ${order['address']['fullname']} <br>
                            <strong class="font-weight-600">Địa chỉ:</strong> ${order['address']['address']} ${order['address']['province']}<br>
                            <strong class="font-weight-600">Số điện thoại:</strong> ${order['address']['phone_number']} <br>
                        </p>
                    </div>
                    <div class="col-md-6 text-right">
                        <p>
                            ${order['order_type']['id'] === 1 ? `<strong class="font-weight-600"> Phương thức vận chuyển:</strong> ${order['order_type']['detail']['shipping_method']['name']}` : ''}
                            <strong class="font-weight-600">Phương thức thanh toán: </strong> ${order['payment']['payment_method']['name']} <br>
                            <strong class="font-weight-600">Trạng thái</strong> ${ order['status']['name'] } <br>
                            <strong class="font-weight-600">Thanh toán lúc: </strong>${dateFormatter.format(new Date(order['payment']['payment_detail']['created_at']))}
                        </p>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-bordered">
                            <thead>
                            <tr class="text-center font-weight-700 text-black">
                                <th class="">Barcode</th>
                                <th class="">Tên sách</th>
                                <th class="">Giá</th>
                                <th class="">Giảm giá</th>
                                <th class="">Số lượng</th>
                                <th class="">Tổng tiền</th>
                            </tr>
                            </thead>
                            <tbody>
                            ${order['order_detail'].map(orderItem => `
                                <tr class="text-center">
                                    <td>${orderItem['book']['barcode']}</td>
                                    <td class="text-wrap text-left">
                                        <span class="w-100">${orderItem['book']['title']}</span>
                                    </td>
                                    <td>${vndCurrencyFormat.format(orderItem['price'])}</td>
                                    <td>0</td>
                                    <td>${orderItem['quantity']}</td>
                                    <td>${vndCurrencyFormat.format(+orderItem['price'] * +orderItem['quantity'])}</td>
                                </tr>`).join('')}
                            <tr class="text-right">
                            ${order['order_type']['id'] === 1 ? `
                                <td colspan="5"><strong>Phí ship:</strong></td>
                                <td class="text-center"> ${vndCurrencyFormat.format(order['order_type']['detail']['shipping_fee'])} </td>` : ''}
                            </tr>
                            <tr class="text-right">
                                <td colspan="5"><strong>Tổng tiền:</strong></td>
                                <td class="text-center">${vndCurrencyFormat.format(order['total_amount'])}</td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="row col-12 pt-3 justify-content-between">
                        <div class="col-md-6">
                        </div>
                        <div class="col-md-6">
                            <p class="text-right">
                                ${order['order_type']['id'] === 2 ? `
                                <strong>Nhân viên thanh toán:</strong> ${order['order_type']['detail']['employee_name']}` : ''}
                                <br>
                                <strong>Ngày in hóa đơn:</strong> ${dateFormatter.format(new Date())} - ${timeFormatter.format(new Date())}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
    modalBody.insertAdjacentHTML("beforeend", html);
}

const renderPhoneNumberList = function(info) {
    const html = info.map(infoItem => {
        currentAddressesState[infoItem['id']] = infoItem;
        return `<li id="${infoItem['id']}">${infoItem['phone_number']}</li>`;
    }).join("");
    phoneNumberDropDown.innerHTML = '';
    phoneNumberDropDown.insertAdjacentHTML("beforeend", html);
}

const renderCustomerName = function(currentAddress) {
    const html = `
        <span id="${currentAddress['id']}" class="customer-name">Tên khách hàng: ${currentAddress['name']}, Số điện thoại: ${currentAddress['phone_number']}</span>
        <a class="btn btn-sm btn-icon-only text-light cursor-pointer" role="button">
            <i class="fa fa-window-close" aria-hidden="true"></i>
        </a>`;
    customerNameContainer.innerHTML = '';
    customerNameContainer.insertAdjacentHTML("beforeend", html);
}

