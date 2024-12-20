const bookGerne_API = '/api/v1/bookGerne'
const BOOK_API = '/api/v1/book/'

async function fetchGerne(id) {
    try {
        const res = await fetch(`${bookGerne_API}?gerneId=${id}`)
        if (!res.ok) throw Error("Failed getting book gerne")
        const data = await res.json()
        return data['data']
    } catch (error) {
        alert(error.message)
    }
}

function showSpinner() {
    document.querySelector('.spinner').style.display = 'block';
    document.querySelector('.overlay').style.display = 'block';
}

// HIDE SPINNER
function hideSpinner() {
    document.querySelector('.spinner').style.display = 'none';
    document.querySelector('.overlay').style.display = 'none';
}

async function fetchExtendAttribute(id) {
    try {
        const res = await fetch(`${bookGerne_API}/${id}/attributes`)
        if (!res.ok) throw Error("Failed getting book gerne")
        const data = await res.json()
        return data['data']
    } catch (error) {
        alert(error.message)
    }
}

const createBook = async function (data) {
    data.forEach((value, key) => {
        console.log(`${key}: ${value}`);
    });
    try {
        const res = await fetch(`${BOOK_API}`, {
            method: 'POST', // HTTP PUT method
            body: data
        });
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const result = await res.json(); // Parse JSON response

        return result
    } catch (error) {
        showToast(error.message, true)
    }
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


let selectedPath = "";
let activeColumn1 = null; // Track active item in column 1
let activeColumn2 = null; // Track active item in column 2
let activeColumn3 = null; // Track active item in column 3

let genres = [];
const genreList = document.getElementById("genreList");
const genreSearch = document.getElementById("genreSearch");
const newGenreContainer = document.getElementById("newGenreContainer");
const newGenreInput = document.getElementById("newGenre");
let fileImage = []
const publisherItem = document.querySelectorAll('.dropdown-publisher > .dropdown-item')
const formatItem = document.querySelectorAll('.dropdown-format > .dropdown-item')
const dropdownPublisher = document.querySelector('.dropdown-toggle-publisher')
const dropdownFormat = document.querySelector('.dropdown-toggle-format')
document.getElementById('release-date').addEventListener('input', function (e) {
    const input = e.target;
    const value = input.value;

    // Remove all non-numeric characters except '/'
    const sanitizedValue = value.replace(/[^0-9/]/g, '');

    // Automatically insert slashes for formatting
    if (sanitizedValue.length === 2 || sanitizedValue.length === 5) {
        input.value = sanitizedValue + '/';
    } else {
        input.value = sanitizedValue;
    }
    // Limit length to 10 characters (dd/mm/yyyy)
    if (sanitizedValue.length > 10) {
        input.value = sanitizedValue.slice(0, 10);
    }
});

document.getElementById('release-date').addEventListener('blur', function (e) {
    const input = e.target;
    const value = input.value;

    // Regular expression for dd/mm/yyyy format
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;

    if (!dateRegex.test(value)) {
        document.getElementById('errorMessage').style.display = 'block';
    } else {
        document.getElementById('errorMessage').innerText = ''

        // Optional: Additional validation for actual date
        const [_, day, month, year] = value.match(dateRegex);

        const date = new Date(`${year}-${month}-${day}`);
        if (
            date.getFullYear() !== parseInt(year) ||
            date.getMonth() + 1 !== parseInt(month) || // Month is zero-indexed in JavaScript
            date.getDate() !== parseInt(day)
        ) {
            document.getElementById('errorMessage').innerText = 'Invalid date!';
        }
    }
});
publisherItem.forEach(el => el.addEventListener('click', () => {
    dropdownPublisher.id = el.getAttribute('value')
    dropdownPublisher.innerHTML = ` <span class="ml-2">${el.textContent}</span>`
}))
formatItem.forEach(el => el.addEventListener('click', () => {
    dropdownFormat.id = el.getAttribute('value')
    dropdownFormat.innerHTML = ` <span class="ml-2">${el.textContent}</span>`
}))

function openModal() {
    document.getElementById("modalOverlay").classList.add("active");
}

function closeModal() {
    document.getElementById("modalOverlay").classList.remove("active");
    const col2 = document.getElementById("col2");
    const col3 = document.getElementById("col3");
    selectedPath = ''
    if (activeColumn1) {
        activeColumn1.classList.remove("active");
        activeColumn1 = null

    }
    if (activeColumn2) {
        activeColumn2.classList.remove("active");
        activeColumn2 = null

    }
    if (activeColumn3) {
        activeColumn3.classList.remove("active");
        activeColumn3 = null
    }
    col2.classList.add("hidden");
    col3.classList.add("hidden");
    updateSelectedDisplay()
}

// Ngăn chặn sự kiện click trên nút "Open" hoặc các nút khác
document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', (event) => {
        event.preventDefault(); // Ngăn hành vi mặc định, ví dụ: reload trang
    });
});

// Đảm bảo modal không tự tắt khi click bên trong nó
document.getElementById("modalOverlay").addEventListener("click", (event) => {
    if (event.target === document.getElementById("modalOverlay")) {
        closeModal(); // Chỉ đóng khi click bên ngoài modal
    }
});

async function toggleSubMenu(id, element) {
    const col2 = document.getElementById("col2");
    const col3 = document.getElementById("col3");

    // Reset column 3
    col3.innerHTML = '<p style="color: #aaa;">Chọn mục từ cột 2</p>';
    col3.classList.add("hidden");
    const subMenu = await fetchGerne(id)

    // Check if clicking on the same active item
    if (activeColumn1 === element) {
        col2.classList.add("hidden");
        activeColumn1.classList.remove("active");
        activeColumn1 = null;
        return;
    }

    // Highlight active item
    if (activeColumn1) activeColumn1.classList.remove("active");
    element.classList.add("active");
    activeColumn1 = element;

    // Load submenu for Column 2
    col2.innerHTML = "";
    col2.classList.remove("hidden");

    const currenGerne = subMenu['current_gerne'][0]['name'];
    subMenu['sub_gerne'].forEach(value => {
        const item = document.createElement("div");
        item.className = "menu-item";
        item.id = value['id']
        item.textContent = value['name'];
        item.onclick = () => toggleFinalMenu(value['id'], currenGerne, value['name'], item);
        col2.appendChild(item);
    })
    selectedPath = currenGerne;
    updateSelectedDisplay();
}

async function toggleFinalMenu(id, prev, subCategory, element) {
    const col3 = document.getElementById("col3");
    const category = await fetchGerne(id)
    // Check if clicking on the same active item
    if (activeColumn2 === element) {
        col3.classList.add("hidden");
        activeColumn2.classList.remove("active");
        selectedPath = selectedPath.split(' > ').slice(0, 1).join(" > ")
        updateSelectedDisplay();
        activeColumn2 = null;
        activeColumn3 = null
        return

    }
    // Highlight active item
    if (activeColumn2) activeColumn2.classList.remove("active");
    element.classList.add("active");
    activeColumn2 = element;

    // Load submenu for Column 3
    col3.innerHTML = "";
    col3.classList.remove("hidden");


    const finalMenu = category['sub_gerne']

    finalMenu.forEach(item => {
        const menuItem = document.createElement("div");
        menuItem.className = "menu-item";
        menuItem.textContent = item['name'];
        menuItem.id = item['id']
        menuItem.onclick = () => {
            selectFinalItem(prev, subCategory, item['name'], menuItem)
        };
        col3.appendChild(menuItem);
    });

    selectedPath = `${prev} > ${subCategory}`;
    updateSelectedDisplay();
}

function selectFinalItem(category, subCategory, item, menuItem) {
    if (activeColumn3 === menuItem) {
        activeColumn3.classList.remove("active")
        selectedPath = selectedPath.split(' > ').slice(0, 2).join(" > ")
        updateSelectedDisplay()
        activeColumn3 = null
        return;
    }
    if (activeColumn3)
        activeColumn3.classList.remove("active")

    menuItem.classList.add("active");
    activeColumn3 = menuItem;
    selectedPath = `${category} > ${subCategory} > ${item}`;
    updateSelectedDisplay();


}

function updateSelectedDisplay() {
    document.getElementById("selectedPath").textContent = selectedPath;
}

async function confirmSelection() {
    const col2 = document.getElementById("col2");
    const col3 = document.getElementById("col3");
    try {
        let gerneId
        if (col3.querySelector('.menu-item.active'))
            gerneId = col3.querySelector('.menu-item.active').id
        else if (col2.querySelector('.menu-item.active'))
            gerneId = col3.querySelector('.menu-item.active').id
        else
            throw new Error("Vui lòng chọn thể loại cụ thể")
        document.querySelector('input[name="input-gerne"]').value = selectedPath
        document.querySelector('input[name="input-gerne"]').id = gerneId
        genres = await fetchExtendAttribute(gerneId)
        if (genres.length) {
            document.querySelector('input[name ="dropdown-search"]').disabled = false
        }
    } catch (error) {
        showToast(error.message, true)
    }
    closeModal();
}

function filterMenuItems() {
    const searchInput = document.getElementById("searchInput").value.toLowerCase();
    const allMenuItems = document.querySelectorAll(".menu-item");
    allMenuItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(searchInput) ? "block" : "none";
    });
}

// Genre list
function handlerRemoveAttribute(event, id, name, el) {
    event.preventDefault()
    // {
    //      'attribute_id':id,
    //      'attribute_name':name
    // }
    const newGerene = {
        'attribute_id': id,
        'attribute_name': name
    }
    genres = [...genres, newGerene]
    genreList.querySelectorAll('.dropdown-item').forEach(el => {
        if (parseInt(el.id) === id)
            el.style = 'display:flex'
    })

    if (genres) {
        document.querySelector('input[name ="dropdown-search"]').disabled = false
        if (document.querySelector('.error-message')) {
            document.querySelector('.error-message').remove()
        }
    }
    el.remove()
}

function addExtendAttribute(id, name) {
    const groupExtendAttriubte = document.querySelector('.group-extend-atrtribute')
    const html = `
                 <div class="form-group">
                    <label class="attribute-name">${name}</label>
                    <div class="dropdown-container attribute-value">
                        <input type="text" id="${id}"
                               class="m-0 dropdown-search product-publisher" autocomplete="off">
                    </div>
                     <button class="btn ml-1 p-0 btn-delete">
                        <i class="fa-solid fa-x"></i>
                    </button>
                </div>
            `
    groupExtendAttriubte.insertAdjacentHTML('beforeend', html)
    const formGroup = groupExtendAttriubte.querySelectorAll('.form-group')
    formGroup[formGroup.length - 1].querySelector('.btn-delete').addEventListener('click',
        e => handlerRemoveAttribute(e, id, name, formGroup[formGroup.length - 1]))


    genreList.style.display = "none";
    genres = genres.filter(gerne => gerne.attribute_id !== id)

    genreList.querySelectorAll('.dropdown-item').forEach(el => {
        if (parseInt(el.id) === id)
            el.style = 'display:none'
    })
    if (!genres.length) {
        document.querySelector('input[name ="dropdown-search"]').disabled = true
        document.querySelector('input[name ="dropdown-search"]').insertAdjacentHTML('afterend', `
             <span class="error-message text-primary">Không còn thuộc tính để thêm</span>
        `)
    }
}

// Populate genre dropdown list
async function populateGenreList(filter = "") {

    genreList.innerHTML = ""; // Clear the list
    const filteredGenres = genres.filter(genre => genre['attribute_name'].toLowerCase().includes(filter.toLowerCase()));
    filteredGenres.forEach(genre => {
        const item = document.createElement("div");
        item.classList.add("dropdown-item");
        item.id = genre['attribute_id']
        item.textContent = genre['attribute_name'];
        item.addEventListener("click", () => {
            addExtendAttribute(genre['attribute_id'], genre['attribute_name'])
        });
        genreList.appendChild(item);
    });
    genreList.style.display = "block";
}

// Show dropdown list on click
genreSearch.addEventListener("focus", () => {
    populateGenreList(); // Show full list when focused
    genreList.style.display = "block"; // Show the dropdown list
});

// Event listener for searching within the genre list
genreSearch.addEventListener("input", () => {
    populateGenreList(genreSearch.value); // Filter list as user types
});

// Hide dropdown when clicking outside
document.addEventListener("click", (event) => {
    if (!event.target.closest(".dropdown-container")) {
        genreList.style.display = "none";
    }
});

function handleRemoveImage(e, name) {
    e.preventDefault()
    const container = document.querySelector('.image-list')
    fileImage.splice(parseInt(name.split('-')), 1)
    container.querySelector(`#${name}`).remove()
}

const uploadImage = document.getElementById('book-image')
uploadImage.addEventListener('change', () => {
    const container = document.querySelector('.image-list')
    const files = Array.from(uploadImage.files) // Get file names


    files.forEach((file, index) => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader(); // Create a FileReader
            reader.onload = e => {
                const html = `
                      <div id='image-${index + fileImage.length}' class="image-item position-relative">
                        <img class="w-100 h-100"
                             src="${e.target.result}">
                        <button onclick="handleRemoveImage(event,'image-${index + fileImage.length}')" class="btn text-primary btn-delete-image">
                            <i class="fa-solid fa-x"></i>
                        </button>
                      </div>
                `
                container.insertAdjacentHTML('beforeend', html); // Add the image to the preview container
            };

            reader.readAsDataURL(file); // Read the file as a data URL
        } else {
            const msg = document.createElement('p');
            msg.textContent = `${file.name} is not an image file.`;
        }
    });
    fileImage.push(...files)
})

function clearValue() {
    document.querySelector('input[name="title"]').value = '';
    document.querySelector('input[name="input-gerne"]').id = '';
    document.getElementById("product-description").value = '';
    document.querySelector('input[name="product-author"]').value = '';
    document.querySelector('input[name="product-num-page"]').value = '';
    document.querySelector('.dropdown-toggle-publisher').id = '';
    document.querySelector('.dropdown-toggle-format').id = '';
    document.querySelector('.dropdown-toggle-publisher').textContent = '';
    document.querySelector('.dropdown-toggle-format').textContent = '';
    document.querySelector('input[name="release-date"]').value = '';
    document.querySelector('input[name="product-price"]').value = '';
    document.querySelector('input[name="product-weight"]').value = '';
    document.querySelector('input[name="product-dimension-r"]').value = '';
    document.querySelector('input[name="product-dimension-d"]').value = '';
    document.querySelector('input[name="product-dimension-c"]').value = '';
    document.querySelector('.group-extend-atrtribute').innerHTML = ''
    fileImage = []
}

//Form submission handler
function handleCreateBook(e) {
    try {
        const title = document.querySelector('input[name ="title"]').value.trim()
        const gerneId = document.querySelector('input[name="input-gerne"]').id
        const description = document.getElementById("product-description").value?.trim()
        const author = document.querySelector('input[name ="product-author"]').value?.trim()
        const num_page = document.querySelector('input[name="product-num-page"]').value
        const publisher = document.querySelector('.dropdown-toggle-publisher').id
        const format = document.querySelector('.dropdown-toggle-format').id
        const releaseDate = document.querySelector('input[name="release-date"]').value
        const price = document.querySelector('input[name="product-price"]').value
        const weight = document.querySelector('input[name="product-weight"]').value
        const r = document.querySelector('input[name="product-dimension-r"]').value
        const d = document.querySelector('input[name="product-dimension-d"]').value
        const c = document.querySelector('input[name="product-dimension-c"]').value
        const extendAttriubte = document.querySelector('.group-extend-atrtribute').children
        let extendAttributes = []
        if (extendAttriubte.length > 1) {
            for (let i = 1; i < extendAttriubte.length; i++) {
                if (extendAttriubte[i].querySelector('input').value.trim() === '')
                    throw new Error(`Vui lòng nhập thông tin cho ${extendAttriubte[i].querySelector('.attribute-name').textContent}`)

                extendAttributes.push({
                    'attribute_id': parseInt(extendAttriubte[i].querySelector('input').id),
                    'value': extendAttriubte[i].querySelector('input').value.trim()
                })
            }

        }
        let flag = false
        if (!fileImage.length) {
            flag = true
            document.getElementById('error-image').classList.add('text-primary')
        } else {
            document.getElementById('error-image').classList.remove('text-primary')
        }
        if (title === '') {
            flag = true
            document.getElementById('error-title').classList.add('text-primary')
        } else {
            document.getElementById('error-title').classList.remove('text-primary')
        }
        if (!gerneId) {
            flag = true
            document.getElementById('error-gerne').classList.add('text-primary')
        } else {
            document.getElementById('error-gerne').classList.remove('text-primary')
        }
        if (description === '') {
            flag = true
            document.getElementById('error-description').classList.add('text-primary')
        } else {
            document.getElementById('error-dimessions').classList.remove('text-primary')
        }
        if (author === '') {
            flag = true
            document.getElementById('error-author').classList.add('text-primary')
        } else {
            document.getElementById('error-author').classList.remove('text-primary')
        }
        if (num_page === '') {
            flag = true
            document.getElementById('error-num-pages').classList.add('text-primary')
        } else {
            document.getElementById('error-num-pages').classList.remove('text-primary')
        }
        if (price === '') {
            flag = true
            document.getElementById('error-price').classList.add('text-primary')
        } else {
            document.getElementById('error-price').classList.remove('text-primary')
        }
        if (weight === '') {
            flag = true
            document.getElementById('error-weight').classList.add('text-primary')
        } else {
            document.getElementById('error-weight').classList.remove('text-primary')
        }
        if (r === '' || d === '' || c === '') {
            flag = true
            document.getElementById('error-dimessions').classList.add('text-primary')
        } else {
            document.getElementById('error-dimessions').classList.remove('text-primary')
        }
        if (flag) throw Error("Vui lòng nhập các trường cần thiết")

        const data = {
            'title': title,
            'book_gerne_id': gerneId,
            'author': author,
            'price': price,
            'num_page': num_page,
            'description': description,
            'format': format,
            'weight': weight,
            'publisher': publisher,
            'release_date': releaseDate,
            'dimension': r + 'x' + d + 'x' + c + ' cm',
            'book_images': fileImage,
            'extend_attributes': extendAttributes
        }
        const formData = new FormData()
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                // Handle 'book_images' if it's a list of files
                if (key === 'book_images' && Array.isArray(data[key])) {
                    data[key].forEach(file => {
                        formData.append('book_images[]', file); // Append each file as part of the 'book_images[]' array
                    });
                } else if (key === 'extend_attributes' && typeof data[key] === 'object') {
                    // If extend_attributes is an object, convert it to JSON
                    formData.append('extend_attributes', JSON.stringify(data[key]));
                } else {
                    // For all other fields, append as a string or number
                    formData.append(key, data[key]);
                }
            }
        }
        e.preventDefault()
        createBook(formData).then(res => {
            if (res['status'] === 200) {
                showToast("Tạo sách thành công ", false)
                clearValue()
                window.scrollTo({
                    top: 0,        // Scroll to the top
                    behavior: 'smooth' // Smooth scrolling
                });
            }
        })

    } catch (error) {
        showToast(error.message, true)
    }
}

const buttonSubmit = document.querySelector('.btn-create-book')
buttonSubmit.addEventListener('click', (e) => handleCreateBook(e))

// document.getElementById("bookForm").addEventListener("submit", function (event) {
//     event.preventDefault();
//
//     let selectedGenre = genreSearch.value;
//     if (selectedGenre === "" && newGenreInput.value.trim() !== "") {
//         selectedGenre = newGenreInput.value.trim();
//         genres.push(selectedGenre); // Add the new genre to the list
//         populateGenreList();
//     }
//
//     alert("Book added successfully!");
//     // Reset form fields if needed, or add form submission logic here
// });

