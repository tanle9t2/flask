from app.model.FormImport import FormImport
from app.model.FormImportDetail import FormImportDetail
from app import app, db
from app.dao.BookDAO import increase_book_quantity
from datetime import datetime
import math

def get_form_imports(**kwargs):

    form_imports = FormImport.query

    import_id = kwargs.get('import_id')
    page = kwargs.get('page', 1)
    start_date = kwargs.get('start_date')
    end_date = kwargs.get('end_date')

    if import_id:
        form_imports = form_imports.get(import_id)

    if start_date:
        start_date = datetime.strptime(start_date, "%Y-%m-%d")
        form_imports = form_imports.filter(FormImport.created_at >= start_date)

    if end_date:
        end_date = datetime.strptime(end_date, "%Y-%m-%d")
        form_imports = form_imports.filter(FormImport.created_at <= end_date)


    page_size = app.config['IMPORT_PAGE_SIZE']
    start = (page - 1) * page_size
    end = start + page_size
    total_page = math.ceil(form_imports.count() / page_size)
    form_imports = form_imports.slice(start, end)

    return {
        'form_imports': form_imports.all(),
        'total_page': total_page,
        'current_page': page
    }


def create_form_import(form_import_items):
    form_import = FormImport(created_at=datetime.utcnow(), employee_id=2)
    db.session.add(form_import)
    db.session.flush()

    for form_import_item in form_import_items:
        book_id = form_import_item['bookId']
        quantity = form_import_item['quantity']
        form_import_detail = FormImportDetail(book_id=book_id, form_import_id=form_import.form_import_id,
                                              quantity=quantity)
        increase_book_quantity(book_id, quantity)
        form_import.form_import_detail.append(form_import_detail)

    db.session.commit()
    return form_import.to_dict()
