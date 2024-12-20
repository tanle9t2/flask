const ele = document.querySelector(".home_category_heading");
const homeProductContainer = document.querySelector('.home_product_container');
const BOOK_GERNE_API = '/api/v1/bookGerne'
const BOOK_API = '/api/v1/book'
let all_data;
const fetchBook = async function (gerneId) {
    try {
        const res = await fetch(`${BOOK_API}/?gerneId=${gerneId}&limit=10`)
        if (!res.ok) throw new Error("Something wrong!!!")
        return await res.json()
    } catch (error) {

    }
}
const VND = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
});

async function preLoadCategory() {
    try {
        const res = await fetch(`${BOOK_GERNE_API}/?gerneId=1`);
        if (!res.ok) throw new Error("Something wrong!!!")
        const data = await res.json();
        const {sub_gerne: subGerne} = data['data']
        const id = subGerne[0].id;
        subGerne.slice(0, 5).forEach(category => {
            renderCategoryHeading(category.name, category.id, id === category.id)
        })
        const book = await fetchBook(id)

        all_data = subGerne;
        homeProductContainer.innerHTML = '';
        book['data']['books'].forEach(data => {
            renderProduct(data);
        })
    } catch (error) {

    }
}

preLoadCategory();

ele.addEventListener("click", function (e) {
    const ele = e.target;
    const id = ele.id;
    if (!id) return;

    e.currentTarget.innerHTML = '';
    all_data.forEach(category => {
        renderCategoryHeading(category.name, category.id, id == category.id)
    })

    homeProductContainer.innerHTML = '';
    fetchBook(id).then(res => {
        if (res['status'] === 200) {
            res['data']['books'].forEach(data => {
                renderProduct(data);
            })
        }
    })
})

const renderCategoryHeading = function (name, id, isActive) {
    const html = `<div id="${id}" class="px-5 home_category_item ${isActive ? 'active' : ''}">${name}</div>`
    ele.insertAdjacentHTML('beforeend', html);
}

const renderProduct = function (product) {
    const html = `
            <a href="/search/detail?bookId=${product['book_id']}" class="card col-5th">      
                <img class="card-img-top"
                     src="${product['images'].length && product['images'][0]['image_url']}"
                     alt="Card image">
                <div class="card-body p-0">
                    <p class="card-text">${product['title']}</p>
                    <p class="text-primary font-weight-bold mb-1">${VND.format(product['price'])}</p>
                </div>
                <div class="rating">
                    <i class="fa-regular fa-star"></i>
                    <i class="fa-regular fa-star"></i>
                    <i class="fa-regular fa-star"></i>
                    <i class="fa-regular fa-star"></i>
                    <i class="fa-regular fa-star"></i>
                </div>
            </a>`;
    homeProductContainer.insertAdjacentHTML('beforeend', html);
}

