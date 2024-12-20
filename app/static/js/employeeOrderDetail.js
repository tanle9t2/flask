
const printInvoiceBtn = document.querySelector(".btn-invoice");
const modal = document.querySelector(".modal");
const overlay = document.querySelector(".overlay");

const toggleModal = function() {
    modal.classList.toggle("d-flex");
    overlay.classList.toggle("d-flex");
}
overlay.addEventListener("click", toggleModal);
printInvoiceBtn.addEventListener("click", toggleModal)

modal.addEventListener("click", function(e) {
    const pdfDownloadBtn = e.target.closest(".btn-download-pdf");
    if (!pdfDownloadBtn) return;

    const {jsPDF} = window.jspdf;

    Toastify({
        text: "Đang tải xuống...",
        duration: 3000,
        newWindow: true,
        close: true,
        gravity: "top", // `top` or `bottom`
        position: "right", // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover
        style: {
            background: "orange",
        }
    }).showToast();

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
        Toastify({
            text: "Đã tải thành công !",
            duration: 3000,
            newWindow: true,
            close: true,
            gravity: "top", // `top` or `bottom`
            position: "right", // `left`, `center` or `right`
            stopOnFocus: true, // Prevents dismissing of toast on hover
            style: {
                background: "#6cbf6c",
            }
        }).showToast();
    });
});
