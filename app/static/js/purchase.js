const ACCOUNT_API = '/api/v1/account'
const CART_API = '/api/v1/cart'
const ORDER_API = '/api/v1/order'
const PAYMENT_API = '/api/v1/payment'
const orderArea = document.querySelector(".order-area")


const VND = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
});

function extractCurrencyNumber(currencyString) {
    const numericValue = currencyString.replace(/[^\d,]/g, ''); // Keep digits and comma
    return parseFloat(numericValue.replace(',', '.')); // Convert to float, replace comma with dot
}

const showToast = function (message, isError) {
    const color = isError ? 'var(--red)' : "#6cbf6c"
    Toastify({
        text: message,
        duration: 3000,
        newWindow: true,
        close: true,
        gravity: "top", // `top` or `bottom`
        position: "center", // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover
        style: {
            background: color,
        }
    }).showToast()
}
const payment = async function (params) {
    try {
        const resPayment = await fetch(`${PAYMENT_API}/?orderId=${params}`, {
            method: 'POST', // HTTP PUT method
            headers: {
                'Content-Type': 'application/json' // Specify JSON content type
            },
        });
        if (!resPayment.ok) {
            throw new Error(`HTTP error! status: ${resPayment.status}`);
        }
        const result = await resPayment.json(); // Parse JSON response
        if (!resPayment.ok) {
            throw new Error(`HTTP error! status: ${resPayment.status}`);
        }
        window.location.replace(result['vnpay_url'])

    } catch (error) {
        showToast(error.message, true)
    }
}
const cancelOrder = async function (data) {
    try {
        const response = await fetch(`${ORDER_API}/orderCancellation`, {
            method: 'POST', // HTTP PUT method
            headers: {
                'Content-Type': 'application/json' // Specify JSON content type
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json(); // Parse JSON response
    } catch (error) {
        showToast(error.message, true)
    }
}
const fetchOrder = async function (prefix, params) {
    try {
        const response = await fetch(`${ACCOUNT_API}/${prefix}?${params}`, {
            method: 'GET', // HTTP PUT method
            headers: {
                'Content-Type': 'application/json' // Specify JSON content type
            },
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json(); // Parse JSON response

        if (result['status'] === 200)
            return result['orders']
    } catch (error) {
        showToast(error.message, true)
    }
}
const addCartItem = async function (books) {
    try {
        const response = await fetch(`${CART_API}/books`, {
            method: 'POST', // HTTP PUT method
            headers: {
                'Content-Type': 'application/json' // Specify JSON content type
            },
            body: JSON.stringify(books)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json(); // Parse JSON response
        if (result['status'] === 200)
            window.location.replace('http://127.0.0.1:5000/cart')

    } catch (error) {
        alert('Failed to add cart.');
    }
}

async function handleReBuy(book_id) {
    await addCartItem(book_id)
}

const renderOderArea = function (orders) {
    if (orders.length) {
        orderArea.innerHTML = orders.map(order => {
            const orderList = order['order_detail']
            const orderDetailHTML = orderList.map(od =>
                `
        <div class="purchase-item">
            <div class="item-infor d-flex align-items-center">
                <div class="item-infor-image">
                    <img class="w-100"
                         src="${od.book.images[0].image_url}">
                </div>
                <div class="item-infor-detail">
                    <p>${od.book.title}</p>
                    <p class="text-secondary"> Thể loại: SGK </p>
                    <p>x${od.quantity}</p>
                </div>
                <div class="item-infor-price text-center">
                    <span class="text-secondary text-decoration-line-through">${VND.format(od.book.price)}</span>
                    <span class="text-primary">${VND.format(od.book.price)}</span>
                </div>
            </div>
        </div>
        `
            ).join('')
            let buttonHtml
            if (order.status.name === 'Đã hoàn thành' || order.status.name === 'Đã hủy') {
                buttonHtml = `
                  <button onClick="handleReBuy(${JSON.stringify(order.order_detail.map(od => od.book.book_id))})"
                            class="btn btn-primary btn-large">
                        Mua lại
                    </button>
                `
            } else if (order.status.name === "Đã thanh toán" || order.status.name === "Đang giao hàng") {
                buttonHtml = `
                  <button disabled
                            class="btn btn-primary btn-large">
                        Mua lại
                    </button>
                `
            } else if (order.status.name === "Đang chờ thanh toán") {
                buttonHtml = `
                  <button onClick="handleRePayment(${order.order_id})"
                            class="btn btn-primary btn-large">
                        Mua lại
                    </button>
                `
            } else {
                buttonHtml = `
                  <button
                       class="btn btn-primary btn-cancellation btn-large">
                       Yêu cầu hủy
                   </button>
                    <div class="modal">
                                                        <div class="overlay"></div>
                                                        <div class="modal-body modal-reason item-bg-color">
                                                            <div class="header d-flex">
                                                                <p class="flex-fill text-center font-weight-bold">Chọn
                                                                    lí do hủy</p>
                                                                <span class="text-secondary cursor-pointer close-form">
                                                                    <i class="fa-solid fa-x"></i>
                                                                </span>
                                                            </div>
                                                            <div class="">
                                                                <ul class="reason-list list-unstyled">
                                                                    <li class="reason-item d-flex align-items-center">
                                                                        <div class="reason-item-tick ">
                                                                            <svg data-v-05e59da4="" width="12"
                                                                                 height="12" viewBox="0 0 12 12"
                                                                                 fill="none"
                                                                                 xmlns="http://www.w3.org/2000/svg">
                                                                                <path class="tick-outline"
                                                                                      data-v-05e59da4=""
                                                                                      d="M11 6C11 3.23858 8.76142 1 6 1C3.23858 1 1 3.23858 1 6C1 8.76142 3.23858 11 6 11C8.76142 11 11 8.76142 11 6Z"
                                                                                      fill="#ffff" stroke="#D70018"
                                                                                      stroke-width="1.5"></path>
                                                                                <path data-v-05e59da4=""
                                                                                      d="M3.75 5.75L4.70603 6.8426C5.11852 7.31402 5.85792 7.29447 6.24492 6.80192L8.25 4.25"
                                                                                      stroke="white"
                                                                                      stroke-linecap="round"
                                                                                      stroke-linejoin="round"></path>
                                                                            </svg>
                                                                        </div>
                                                                        <p class="m-0 reason-item-text font-weight-bold">Tui muốn mua sản phẩm khác</p>
                                                                    </li>
                                                                    <li class="reason-item d-flex align-items-center">
                                                                        <div class="reason-item-tick">
                                                                            <svg data-v-05e59da4="" width="12"
                                                                                 height="12" viewBox="0 0 12 12"
                                                                                 fill="none"
                                                                                 xmlns="http://www.w3.org/2000/svg">
                                                                                <path class="tick-outline"
                                                                                      data-v-05e59da4=""
                                                                                      d="M11 6C11 3.23858 8.76142 1 6 1C3.23858 1 1 3.23858 1 6C1 8.76142 3.23858 11 6 11C8.76142 11 11 8.76142 11 6Z"
                                                                                      fill="#ffff" stroke="#D70018"
                                                                                      stroke-width="1.5"></path>
                                                                                <path data-v-05e59da4=""
                                                                                      d="M3.75 5.75L4.70603 6.8426C5.11852 7.31402 5.85792 7.29447 6.24492 6.80192L8.25 4.25"
                                                                                      stroke="white"
                                                                                      stroke-linecap="round"
                                                                                      stroke-linejoin="round"></path>
                                                                            </svg>
                                                                        </div>
                                                                        <p class="m-0 reason-item-text font-weight-bold">Muốn thay đổi địa chỉ</p>

                                                                    </li>
                                                                    <li class="reason-item d-flex align-items-center">
                                                                        <div class="reason-item-tick ">
                                                                            <svg data-v-05e59da4="" width="12"
                                                                                 height="12" viewBox="0 0 12 12"
                                                                                 fill="none"
                                                                                 xmlns="http://www.w3.org/2000/svg">
                                                                                <path class="tick-outline"
                                                                                      data-v-05e59da4=""
                                                                                      d="M11 6C11 3.23858 8.76142 1 6 1C3.23858 1 1 3.23858 1 6C1 8.76142 3.23858 11 6 11C8.76142 11 11 8.76142 11 6Z"
                                                                                      fill="#ffff" stroke="#D70018"
                                                                                      stroke-width="1.5"></path>
                                                                                <path data-v-05e59da4=""
                                                                                      d="M3.75 5.75L4.70603 6.8426C5.11852 7.31402 5.85792 7.29447 6.24492 6.80192L8.25 4.25"
                                                                                      stroke="white"
                                                                                      stroke-linecap="round"
                                                                                      stroke-linejoin="round"></path>
                                                                            </svg>
                                                                        </div>
                                                                        <p class="m-0 reason-item-text font-weight-bold">Muốn thay sản phẩm đơn hàng</p>
                                                                    </li>
                                                                    <li id='other'
                                                                        class="reason-item d-flex align-items-center">
                                                                        <div class="reason-item-tick ">
                                                                            <svg data-v-05e59da4="" width="12"
                                                                                 height="12" viewBox="0 0 12 12"
                                                                                 fill="none"
                                                                                 xmlns="http://www.w3.org/2000/svg">
                                                                                <path class="tick-outline"
                                                                                      data-v-05e59da4=""
                                                                                      d="M11 6C11 3.23858 8.76142 1 6 1C3.23858 1 1 3.23858 1 6C1 8.76142 3.23858 11 6 11C8.76142 11 11 8.76142 11 6Z"
                                                                                      fill="#ffff" stroke="#D70018"
                                                                                      stroke-width="1.5"></path>
                                                                                <path data-v-05e59da4=""
                                                                                      d="M3.75 5.75L4.70603 6.8426C5.11852 7.31402 5.85792 7.29447 6.24492 6.80192L8.25 4.25"
                                                                                      stroke="white"
                                                                                      stroke-linecap="round"
                                                                                      stroke-linejoin="round"></path>
                                                                            </svg>
                                                                        </div>
                                                                        <p class="m-0 reason-item-text font-weight-bold">Khác</p>
                                                                        <div class="flex-fill">
                                                                            <input class="input-field"
                                                                                   placeholder="Nhập lý do">
                                                                        </div>
                                                                    </li>
                                                                </ul>
                                                            </div>
                                                            <div class="text-center d-flex align-items-center justify-content-end">
                                                                <p class="close-form m-0 mr-4 cursor-pointer">Trở
                                                                    lại</p>
                                                                <button class="btn btn-modal-cancellation btn-primary btn-large">
                                                                    Xác nhận
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                `

            }
            return ` <ul class="list-unstyled m-0">
                <li id="${order.order_id}" class="item-bg-color mt-3 mb-3 p-3">
                    <div class="purchase-header pb-3">
                        <p class="text-right m-0">
                            ${order.status.id === 4 ? `<span style="color: #26aa99">Giao hàng thành công</span>` : ''}
                            <span class="separator"> | </span>
                            <span class="text-primary">${order.status.name}</span></p>
                    </div>
                    <div class="purchase-list">
                       ${orderDetailHTML}
                    </div>
                    <div class="purchase-controll pb-2 text-right">
                        <p>Thành tiền: <span
                                class="text-primary">${VND.format(order.total_amount)}</span></p>
                        <div>
                            ${buttonHtml}
                        </div>
                    </div>
                </li>
        </ul>`
        }).join("")

    } else {
        orderArea.innerHTML = ` <li class="item-bg-color item-null mt-3 mb-3 p-3">
                                    <div class="content-null"></div>
                                    <div class="text">Chưa có đơn hàng</div>
                                </li>`
    }
    const orderList = orderArea.querySelectorAll('li')
    orderList.forEach(el => {
        renderEvent(el)
    })
}

async function handleOnClickFilter(e) {
    const orders = await fetchOrder("/purchase", `status=${e.target.id}`)
    const prev = headerItem.querySelector(".home_category_item.active")
    if (prev)
        prev.classList.remove('active')
    e.target.classList.add("active")
    renderOderArea(orders)
}

const headerItem = document.querySelector(".home_category_heading")
headerItem.querySelectorAll(".home_category_item").forEach(el => {
    el.addEventListener('click', (e) => handleOnClickFilter(e))
})

function openForm(el) {
    console.log(el.querySelector('.modal'))
    el.querySelector('.modal').style = 'display:flex'
}

function closeForm(el) {
    el.querySelector('.modal').style = 'display:none'
    toggleActive(el)
}

function renderEvent(el) {
    const closeModalButton = el.querySelectorAll(".close-form")
    closeModalButton.forEach(close => close.addEventListener('click', () => closeForm(el)))
    const buttonCancellation = el.querySelector('.btn-cancellation')
    if (buttonCancellation) {
        buttonCancellation.addEventListener('click', () => openForm(el))
        const reasonArea = el.querySelector('.reason-list')
        const reasonList = reasonArea.querySelectorAll('.reason-item')
        const buttonSendCancellation = el.querySelector('.btn-modal-cancellation')
        buttonSendCancellation.addEventListener('click',
            () => handleCancellationOrder(reasonArea, parseInt(el.id)).then(res => {
                if (res['status'] === 200) {
                    const bookIds = res['data']['order_detail'].map(od => od.book.book_id)
                    showToast('Hủy đơn hàng thành công', false)
                    el.querySelector('.order-status').textContent = 'Đã hủy'
                    el.querySelector('.group-button').innerHTML = `
                      <button onClick="handleReBuy(${JSON.stringify(bookIds)})"
                            class="btn btn-primary btn-large">
                        Mua lại
                    </button>
                `
                }
            }))
        reasonList.forEach(el => {
            el.addEventListener('click', () => {
                toggleActive(reasonArea)
                el.classList.add("reason-item-active")
                el.querySelector('.tick-outline').setAttribute('fill', '#D70018')
                if (el.id)
                    el.querySelector('.input-field').style = 'display:block'

            })
        })
    }
}

const orderList = orderArea.querySelectorAll('li')
orderList.forEach(el => {
    renderEvent(el)
})

const toggleActive = function (el) {
    let prev = el.querySelector('.reason-item.reason-item-active')
    if (prev) {
        if (prev.id) prev.parentElement.querySelector('.input-field').style = 'display:none'
        prev.classList.remove("reason-item-active")
        prev.querySelector('.tick-outline').setAttribute('fill', '#ffff')
    }
}

async function handleCancellationOrder(reasonArea, orderId) {
    try {
        const active = reasonArea.querySelector('.reason-item.reason-item-active')
        let reason
        if (!active)
            throw new Error("Vui lòng chọn lý do hủy đơn")
        else
            reason = active.querySelector('.reason-item-text').textContent

        if (active.id) {
            if (reasonArea.querySelector('.input-field').value.trim() === '')
                throw new Error("Vui lòng nhập lý do của bạn")
            else
                reason = reasonArea.querySelector('.input-field').value.trim()
        }
        const data = {
            'orderId': orderId,
            'reason': reason
        }
        return await cancelOrder(data)
    } catch (error) {
        showToast(error.message, true)
    }
}

async function handleRePayment(orderId) {
    await payment(orderId)
}