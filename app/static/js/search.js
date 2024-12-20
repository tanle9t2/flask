//API
const bookGerne_API = '/api/v1/bookGerne'
const BOOK_API = '/api/v1/book'
const SEARCH_API = '/api/v1/search'

// DECLARE VARIABLE
var margin = 0
const CURRENT_URL = new URL(window.location);

//DECALE FUNCTION
const getCurrentParams = function () {
    return CURRENT_URL.toString().split("?")[1] || ""
}
const VND = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
});
const addParamURL = function (param, value) {
    CURRENT_URL.searchParams.set(param, value)
    window.history.pushState({}, '', CURRENT_URL);
}
const deleteParamURL = function (param) {
    CURRENT_URL.searchParams.delete(param);
    window.history.pushState({}, '', CURRENT_URL);
}

//FETCH DATA GERNE
async function fetchGerne(id) {
    try {
        showSpinner()
        const res = await fetch(`${bookGerne_API}?gerneId=${id}`)
        if (!res.ok) throw Error("Failed getting book gerne")
        const data = await res.json()

        return data
    } catch (error) {

    } finally {
        hideSpinner()
    }
}

//FETCH DATA BOOK
async function fetchBook(params) {
    try {
        showSpinner()
        const res = await fetch(`${SEARCH_API}/?${params}`)
        if (!res.ok) throw Error("Failed getting book")
        const data = await res.json()

        return data
    } catch (error) {

    } finally {
        hideSpinner()
    }
}

//DISPLAY SPINNER
function showSpinner() {
    document.querySelector('.spinner').style.display = 'block';
    document.querySelector('.overlay-spinner').style.display = 'block';
}

// HIDE SPINNER
function hideSpinner() {
    document.querySelector('.spinner').style.display = 'none';
    document.querySelector('.overlay-spinner').style.display = 'none';
}

function renderBookNull(bookElemnt, paginationElemnt) {
    bookElemnt.innerHTML = `
             <p class="label-warning">
                Không có sản phẩm phù hợp với tìm kiếm của bạn
             </p>
        `
    paginationElemnt.innerHTML = ""
}

async function render_book(params, isFilter = false) {

    const {data: books, current_page, pages, extended_books: filters} = await fetchBook(params)

    const bookElemnts = document.querySelector('.list-book')
    const paginationElemnt = document.querySelector('.pagination')
    if (!books.length) {
        renderBookNull(bookElemnts, paginationElemnt)

    } else {
        bookElemnts.innerHTML = books.map(b => `
        <a href="/search/detail?bookId=${b.book_id}" class="card col-md-3">
        
        <img class="card-img-top"
             src="${b.book_image.length ? b.book_image[0].image_url : null}"
             alt="Card image">
        <div class="card-body p-0">
            <p class="card-text">${b.title}</p>
            <p class="text-primary font-weight-bold mb-1">${VND.format(b.price)}</p>
          
        </div>
        <div class="rating">
            <i class="fa-regular fa-star"></i>
            <i class="fa-regular fa-star"></i>
            <i class="fa-regular fa-star"></i>
            <i class="fa-regular fa-star"></i>
            <i class="fa-regular fa-star"></i>
        </div>
    </a>
    `).join("")
        render_pagination(current_page, pages)
    }
    if (!isFilter)
        renderGroupFiler(filters)

}

const renderGroupFiler = function (filters) {
    const groupFilterExtend = document.querySelector('.group-filter-extend')
    groupFilterExtend.innerHTML = filters.map((filter, index) => {
        const prevValue = extendBookParams[`group-filter-${index}`]
        const valueHTML = filter.collect_values.buckets.map(value => `
             <li>
                <a class="checkbox ${prevValue === value.key ? "checkbox-checked" : "checkbox-unchecked"}"
                value="${value.key}"
                > ${value.key}
                 <span class="text-secondary">(${value.doc_count})</span></a>

            </li>
        `).join('')
        return `
         <div id="group-filter-${index}" value="${filter.attribute_name.buckets[0].key}"
             class="group-filter price pb-0 pt-3 border-top">
            <p class="font-weight-bold mb-0 pb-1">${filter.attribute_name.buckets[0].key}
                <span class="text-secondary">(${filter.attribute_name.buckets[0].doc_count})</span>
            </p>
            <ul class="text-decoration-none list-unstyled box-filter pl-2">
               ${valueHTML}
            </ul>
        </div>
    `
    }).join('')
    groupFilters = groupFilterExtend.querySelectorAll('.group-filter')

    groupFilters.forEach(gf => {
        const boxFilter = gf.querySelector('.box-filter')
        boxFilter.addEventListener('click', (e) => handleSelectedFileter(gf, e))
    })
}
const render_pagination = function (current_page, pages) {
    const el = document.querySelector('.pagination')
    const html = []

    async function handleOnclick(el, value) {
        el.addEventListener('click', () => {
            addParamURL('page', value)
            render_book(getCurrentParams())
        })
    }

    const prevButton = current_page === 1 ? null :
        `
        <li class="page-item">
        <a class="page-link prev-button" href="#" aria-label="Previous">
        <i class="fa-solid fa-arrow-left"></i>
        </a>
        </li>
        `

    html.push(prevButton)
    for (let i = 1; i < pages + 1; i++) {
        html.push(
            `
        <li class="page-item item-button">
        <a class="page-link ${i === current_page ? 'active' : ""}"  href="#" aria-label=${i}>
        ${i}
        </a>
        </li>
        `
        )

    }
    const nextButton = current_page === pages ? null :
        `
        <li class="page-item next-button">
        <a class="page-link" href="#" aria-label="Next">
        <i class="fa-solid fa-arrow-right"></i>
        </a>
        </li>
        `

    html.push(nextButton)
    el.innerHTML = html.join("")
    const paginationNumElemnts = document.querySelectorAll('.item-button')
    const nextButtonElemnt = document.querySelector('.next-button')
    const prevButtonElemnt = document.querySelector('.prev-button')


    paginationNumElemnts && paginationNumElemnts.forEach(
        item => handleOnclick(item, item.textContent.trim()))
    nextButtonElemnt && handleOnclick(nextButtonElemnt, current_page + 1)
    prevButtonElemnt && handleOnclick(prevButtonElemnt, current_page - 1)
}


const renderGerne = async function (currentGerne, subGerne) {
    renderParentGerne()
    renderCurrentGerne(currentGerne)
    renderSubGerne(subGerne)

}

const renderParentGerne = function () {
    const parent = document.querySelector(".parent-gerne")
    const current = document.querySelector(".current-gerne").lastElementChild

    async function handleParentOnclick(elements, id) {
        addParamURL('gerneId', id)
        const res = await fetchGerne(id)
        const {current_gerne: currentGerne, sub_gerne: subGerne} = res['data']
        let rmElement = []
        elements.forEach(e => {
            if (e.id >= id) {
                rmElement.push(e.parentNode)
                if (margin > 0) margin -= 10
            }
        })
        requestAnimationFrame(() => {
            rmElement.forEach(parent => {
                if (parent) {
                    parent.remove();  // Remove each parent element from the DOM
                }
            });
        });
        renderCurrentGerne(currentGerne, margin)
        renderSubGerne(subGerne, margin)
        render_book(getCurrentParams())
    }

    if (current) {
        parent.insertAdjacentHTML("beforeend",

            `<li style="margin-left: ${margin}px"><span id="${current.id ? current.id : 1}" class="parent-gerne-item">${current.textContent}</span></li>`
        )

        const elements = document.querySelectorAll('.parent-gerne-item')
        elements.forEach(el => {
            el.removeEventListener("click", handleParentOnclick)
            el.addEventListener('click', e => handleParentOnclick(elements, e.target.id))
        })
    }
}
const renderCurrentGerne = function (currentGerne) {
    const el = document.querySelector(".current-gerne")
    el.innerHTML =
        `
        <span style="margin-left: ${margin + 10}px" id="${currentGerne[0].id}" class="selected-filter">${currentGerne[0].name}</span>
        `

    el.children[0].addEventListener('click', e => {
        document.querySelector('.selected-filter').classList.remove("selected-filter")
        e.target.classList.add("selected-filter")
    })
}

const renderSubGerne = function (listBookGerne) {
    const el = document.querySelector(".children-gerne")

    async function handleOnClickSubItem(id) {
        addParamURL('gerneId', id)
        const res = await fetchGerne(id)
        const {current_gerne: currentGerne, sub_gerne: subGerne} = res['data']
        margin += 10
        if (subGerne.length) {
            await renderGerne(currentGerne, subGerne)
        } else {
            if (margin > 0) margin -= 10
            document.querySelector('.selected-filter').classList.remove("selected-filter")
            document.getElementById(id).classList.add("selected-filter")
        }
        await render_book(getCurrentParams())
    }

    el.innerHTML = listBookGerne.map(b =>
        `
        <li style="margin-left: ${margin + 20}px"><span class="sub-item" id="${b.id}">${b.name}</span></li>`
    )
        .join("")
    const elements = document.querySelectorAll('.sub-item')
    elements.forEach(e => e.addEventListener('click', () => handleOnClickSubItem(e.id)))
}
//INVOKE FUNCTION
const handleDeleteFilter = async function (e) {
    if (!(e.target.getAttribute('class') === "fa-solid fa-x")) return

    const parent = e.target.parentNode.parentNode
    const checkboxEl = document.querySelector(
        `#${parent.id} .checkbox-checked`
    )

    delete extendBookParams[parent.id]
    deleteParamURL(parent.id);
    deleteParamURL('page')
    document.querySelector(
        `.filter-list #${parent.id}`
    ).remove()
    checkboxEl.classList.remove('checkbox-checked')
    window.history.pushState({}, '', CURRENT_URL);
    render_book(getCurrentParams())

}


function handleSelectOrder(nameNode, param) {
    const els = document.querySelector(
        `.dropdown-menu-${nameNode}`
    )
    els.querySelectorAll('.dropdown-item').forEach(
        el => el.addEventListener('click', () => {
            const value = el.getAttribute('value')
            document.querySelector(
                `.dropdown-toggle-${nameNode}`
            ).textContent
                = el.textContent
            CURRENT_URL.searchParams.set(param, value)
            deleteParamURL('page')
            window.history.pushState({}, '', CURRENT_URL);
            render_book(getCurrentParams())
            window.scrollTo({
                top: 0,
                behavior: 'smooth' // Adds smooth scrolling
            });
        })
    )
}

const search = document.querySelector(".icon-search")

// const sub_item = document.querySelectorAll(".sub-item")
// sub_item.forEach(s => {
//     async function handleOnClick(id) {
//         const {current_gerne: currentGerne, sub_gerne: subGerne} = await fetchGerne(id)
//         await renderGerne(currentGerne, subGerne)
//     }
//
//     s.addEventListener("click", () => handleOnClick(s.id))
// })
async function test() {
    const res = await fetchGerne(1)
    const {current_gerne: currentGerne, sub_gerne: subGerne} = res['data']
    await renderGerne(currentGerne, subGerne)
}

test()
const deleteFilter = document.querySelectorAll('.filter-list')
deleteFilter && deleteFilter.forEach(item => item.addEventListener('click',
    (e) => handleDeleteFilter(e)))
handleSelectOrder('pagination', 'limit')
handleSelectOrder('order', 'order')
render_book(getCurrentParams())

const price = document.querySelector('#price.group-filter')
price.addEventListener('click', (e) => handleSelectedFileter(price, e))

function handleSelectedFileter(element, e) {
    if (e.target.tagName === 'SPAN') return
    const prev = element.querySelector('.checkbox-checked')
    const listFiler = document.querySelector('.filter-list')
    e.target.classList.add('checkbox-checked')
    window.history.pushState({}, '', CURRENT_URL);
    if (prev && prev !== e.target) {
        addParamURL(element.id, e.target.getAttribute('value'))
        deleteParamURL("page")
        listFiler.insertAdjacentHTML('beforeend',
            `<li id ="${element.id}" class="filter-item mr-3 mb-3 price-filter">
        <span >${element.getAttribute('value')}: ${e.target.textContent}</span>
        <span class="cursor-pointer delete-filter ml-1"><i class="fa-solid fa-x"></i></span>
        </li>`
        )
        prev.classList.remove('checkbox-checked')
        listFiler.querySelector(
            `#${element.id}`
        ).remove()
    } else if (prev === e.target) {
        deleteParamURL(element.id)
        deleteParamURL("page")
        prev.classList.remove('checkbox-checked')
        listFiler.querySelector(
            `#${element.id}`
        ).remove()
    } else {
        addParamURL(element.id, e.target.getAttribute('value'))
        listFiler.insertAdjacentHTML('beforeend',

            `<li id ="${element.id}" class="filter-item mr-3 mb-3 price-filter" value="${e.target.getAttribute('value')}">
        <span >${element.getAttribute('value')}: ${e.target.textContent}</span>
        <span class="cursor-pointer delete-filter ml-1"><i class="fa-solid fa-x"></i></span>
        </li>`
        )
    }

    window.history.pushState({}, '', CURRENT_URL);
    render_book(getCurrentParams(), true)
}
