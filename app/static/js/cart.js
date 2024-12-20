const CART_API = '/api/v1/cart'
const CHECKOUT_API = '/cart/checkout'
const groupControll = document.querySelectorAll('.cart-item')
const toggleAllButton = document.getElementById("toggleAll")
const checkboxs = document.querySelectorAll('.checkbox')

const buttonPayment = document.querySelector(".btn-payment")
let totalCheckbox = checkboxs.length
let cnt = 0
let toggle = false


toggleAllButton && toggleAllButton.addEventListener("click", () => {
    if (!toggle) {
        checkboxs.forEach(el => {
            if (!el.checked) {
                el.checked = true
                el.dispatchEvent(new Event('change'));
            }
        })
    } else
        checkboxs.forEach(el => {
            if (el.checked) {
                el.checked = false
                el.dispatchEvent(new Event('change'));
            }
        })
    toggle = !toggle
})
const VND = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
});

function extractCurrencyNumber(currencyString) {
    const numericValue = currencyString.replace(/[^\d,]/g, ''); // Keep digits and comma
    return parseFloat(numericValue.replace(',', '.')); // Convert to float, replace comma with dot
}

function showSpinner() {
    document.querySelector('.spinner').style.display = 'block';
    document.querySelector('.overlay-spinner').style.display = 'block';
}

// HIDE SPINNER
function hideSpinner() {
    document.querySelector('.spinner').style.display = 'none';
    document.querySelector('.overlay-spinner').style.display = 'none';
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

const renderCheckAll = function () {
    toggleAllButton.checked = cnt === totalCheckbox;
}
const renderButtonPayment = function () {
    buttonPayment.disabled = cnt === 0
}
const moveCartItemToCheckOut = async function (data) {
    try {
        const response = await fetch(CHECKOUT_API, {
            method: 'POST', // HTTP PUT method
            headers: {
                'Content-Type': 'application/json' // Specify JSON content type
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Parse JSON response
        return await response.json()
    } catch (error) {
        showToast(error.message, true)
    }
}

async function handleOnClickPayment() {
    let cartItemChecked = []
    groupControll.forEach(el => {
            if (el.querySelector('.checkbox:checked')) {
                const data = {
                    "bookId": el.getAttribute('id'),
                    "quantity": el.querySelector('.cart-item-quantity').textContent,
                    'price': extractCurrencyNumber(el.querySelector('.cart-item-price ').textContent),
                    'img': el.querySelector('.cart-item-image').getAttribute('src'),
                    'title': el.querySelector('.cart-item-detail-title').textContent
                }
                cartItemChecked.push(data)
            }
        }
    )
    await moveCartItemToCheckOut(cartItemChecked)
    window.location.href = 'http://127.0.0.1:5000/cart/checkout'
}

buttonPayment && buttonPayment.addEventListener("click", () => handleOnClickPayment())
const deleteCartItem = async function (id) {
    try {
        const response = await fetch(`${CART_API}/${id}`, {
            method: 'DELETE', // HTTP PUT method
            headers: {
                'Content-Type': 'application/json' // Specify JSON content type
            },
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json(); // Parse JSON response
    } catch (error) {
        showToast(error.message, true)
    }
}
const updateCart = async function (data) {
    try {
        showSpinner()
        const response = await fetch(CART_API, {
            method: 'PUT', // HTTP PUT method
            headers: {
                'Content-Type': 'application/json' // Specify JSON content type
            },
            body: JSON.stringify(data) // Convert data to JSON string
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Parse JSON response
        return await response.json()
    } catch (error) {
        showToast(error.message, true)
    } finally {
        hideSpinner()
    }

}
groupControll.forEach(el => {
    const buttonDescrease = el.querySelector(".cart-item-descrease")
    const buttonIncrease = el.querySelector(".cart-item-increase")
    const quantityEl = el.querySelector(".cart-item-quantity")
    const totalprice = el.querySelector(".cart-item-price")
    const deletButton = el.querySelector(".fa-solid.fa-trash-can")
    const checkButon = el.querySelector(".checkbox")
    const totalPrice = document.querySelector(".total-price")

    checkButon.addEventListener('change', () => {
            const numTotalPrice = extractCurrencyNumber(totalPrice.textContent)
            const itemPrice = extractCurrencyNumber(quantityEl.textContent) *
                parseInt(buttonIncrease.getAttribute('value'))
            if (checkButon.checked) {
                totalPrice.innerHTML = VND.format(numTotalPrice + itemPrice)
                cnt++
            } else {
                totalPrice.innerHTML = VND.format(numTotalPrice - itemPrice)
                cnt--
            }
            renderCheckAll()
            renderButtonPayment()
        }
    )

    deletButton.addEventListener('click', () => {
        deleteCartItem(el.id).then(r => {
            if (r['status'] === 200) {
                el.remove()
                renderTotalCartItem(r['currentItem'], el.id)
                showToast("Xóa sản phẩm thành công", false)
            }
        })

    })
    buttonIncrease.addEventListener('click', () => {
        const data = {
            "cartItems":
                {
                    "bookId": el.id,
                    "quantity": parseInt(quantityEl.textContent) + 1
                }

        }
        updateCart(data).then(res => {
                if (res['status'] === 200) {
                    quantityEl.innerHTML = res['data'].quantity
                    totalprice.innerHTML = VND.format(res['data'].quantity * res['data'].book.price)
                    if (checkButon.checked) {
                        const numTotalPrice = extractCurrencyNumber(totalPrice.textContent)
                        const itemPrice = parseInt(buttonIncrease.getAttribute('value'))
                        totalPrice.innerHTML = VND.format(numTotalPrice + itemPrice)
                    }
                    showToast("Tăng sản phẩm thành công", false)
                } else if (res['status'] === 507) {
                    if (el.querySelector('.cart-item-detail > .item-msg-error')) return
                    el.querySelector('.cart-item-detail').insertAdjacentHTML('beforeend', `
                        <p class="item-msg-error font-weight-bold text-primary">* ${res['message']}</p>
                    `)
                }
            }
        )
    })
    buttonDescrease.addEventListener('click', () => {
        if (quantityEl.textContent === "1") {
            showToast("Số lượng không được nhỏ hơn 1", true)
            return
        }
        const data = {
            "cartItems":
                {
                    "bookId": el.id,
                    "quantity": parseInt(quantityEl.textContent) - 1
                }

        }
        updateCart(data).then(res => {
                if (res['status'] === 200) {
                    el.querySelector('.cart-item-detail > .item-msg-error')?.remove()
                    quantityEl.innerHTML = res['data'].quantity
                    totalprice.innerHTML = VND.format(res['data'].quantity * res['data'].book.price)
                    if (checkButon.checked) {
                        const numTotalPrice = extractCurrencyNumber(totalPrice.textContent)
                        const itemPrice = parseInt(buttonIncrease.getAttribute('value'))
                        totalPrice.innerHTML = VND.format(numTotalPrice + itemPrice)
                    }
                    showToast("Giảm sản phẩm thành công", false)
                }
            }
        )
    })
})
const renderTotalCartItem = function (quantity, deleteItemId) {
    const cartHeader = document.querySelector('.cart-header-total')
    const totalCheckBox = document.querySelector('.cart-total')
    const labelTotal = document.querySelector('.label-total')
    const subCartList = document.querySelector('.sub-cart').children
    const rowBody = document.querySelector('.row-body')

    cartHeader.innerHTML = `${quantity} sản phẩm`
    totalCheckBox.innerHTML = `Chọn tất cả ${quantity}`
    if (quantity !== 0) {
        labelTotal.innerHTML = quantity
        for (let i = 0; i < subCartList.length; i++) {
            if (subCartList[i].id === deleteItemId) {
                console.log('ok')
                subCartList[i].remove()
                return
            }
        }
    } else {
        console.log('ok')
        labelTotal.style = 'display:none'
        document.querySelector('.sub-cart').remove()
        rowBody.querySelector('.content').remove()
        rowBody.insertAdjacentHTML('beforeend', `
             <div class="h-50vh col-md-12 item-bg-color rounded d-flex flex-column align-items-center justify-content-center">
                <img src="https://cdn0.fahasa.com/skin//frontend/ma_vanese/fahasa/images/checkout_cart/ico_emptycart.svg"
                     class="center">
                <p>Chưa có sản phẩm nào</p>
                <a href="/search/" class="btn btn-large btn-primary text-white">Mua sắm ngay</a>
            </div>
        `)
        document.querySelector('.menu-cart-item').innerHTML = `
             <div class="menu-cart-item-header">
                <p class="p-3 m-0">
                    <span><i class="fa-solid fa-cart-shopping"></i></span>
                    <span>Giỏ hàng <span class="sub-total">(0)</span></span>
                </p>
            </div>
            <div class="text-center mt-5 mb-5">
                <div class="cart-item-null"></div>
                <p>Chưa có sản phẩm nào</p>
            </div>
        `
    }
}
