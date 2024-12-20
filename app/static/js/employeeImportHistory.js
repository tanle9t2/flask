

const modalExport = document.querySelector(".modal-export")
const pagination = document.querySelector(".pagination");

const renderPagination = function (total_page, current_page) {
    const prev = `
        <li class="page-item ${current_page == 1 ? "disabled" : ""}" page=${current_page - 1}>
            <div class="page-link" tabindex="-1">
                <i class="fas fa-angle-left "></i>
                <span class="sr-only">Previous</span>
            </div>
        </li>`;
    const content = [...Array(total_page).keys()].map(page => {
        return `
            <li class="page-item ${page + 1 == current_page ? "active" : ""}" page=${page + 1}>
                <div class="page-link" >${page + 1}</div>
            </li>`;
    }).join('');
    const next = `
        <li class="page-item ${current_page == total_page ? "disabled" : ""}" page=${current_page + 1}>
            <div class="page-link" >
                <i class="fas fa-angle-right"></i>
                <span class="sr-only">Next</span>
            </div>
        </li>`;
    pagination.innerHTML = '';
    pagination.insertAdjacentHTML('beforeend', prev)
    pagination.insertAdjacentHTML('beforeend', content)
    pagination.insertAdjacentHTML('beforeend', next)
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