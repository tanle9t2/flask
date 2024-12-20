import json
from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify
from sqlalchemy.sql.functions import random

from app import app
from app.dao.FormImportDAO import get_form_imports, create_form_import
from app.dao.BookDAO import find_by_id, find_by_barcode, create_book, count_book_sell
from app.dao.CartDao import find_by_user_id
from app.dao.SearchDAO import search_book

book_rest_bp = Blueprint('book_rest', __name__)


@book_rest_bp.route('/test')
def get_books():
    return find_by_id(54).to_dict()


@book_rest_bp.route('/<book_id>/sold')
def get_sold(book_id):
    return jsonify({
        'message': 'success',
        'status': 200,
        'soldBook': count_book_sell(book_id)
    })


@book_rest_bp.route('/', methods=['POST'])
def create_books():
    title = request.form.get('title')
    book_gerne_id = request.form.get('book_gerne_id')
    author = request.form.get('author')
    price = request.form.get('price')
    num_page = request.form.get('num_page')
    description = request.form.get('description')
    format = request.form.get('format')
    weight = request.form.get('weight')
    dimension = request.form.get('dimension')
    publisher = request.form.get('publisher')
    release_date = request.form.get('release_date')

    # Handle book_images (file upload)
    book_images = request.files.getlist('book_images[]')

    # Handle extend_attributes (JSON string)
    extend_attributes = json.loads(request.form.get('extend_attributes'))

    data = {
        "title": title,
        "book_gerne_id": int(book_gerne_id),
        "author": author,
        "price": float(price),
        "num_page": int(num_page),
        "description": description,
        "format": int(format) + 1,
        'publisher': int(publisher),
        "release_date": datetime.strptime(release_date, '%d/%m/%Y'),
        "weight": float(weight),
        "dimension": dimension,
        "book_images": book_images,
        "extend_attributes": extend_attributes
    }
    create_book(data)

    return jsonify({
        'message': 'success',
        'status': 200

    })


@book_rest_bp.route('/', methods=['GET'])
def book():
    keyword = request.args.get('keyword')
    min_price = request.args.get('minPrice', type=float, default=None)
    max_price = request.args.get('maxPrice', type=float)
    order = request.args.get('order', default=None)
    limit = request.args.get('limit', type=int, default=app.config['PAGE_SIZE'])
    gerne_id = request.args.get('gerneId', type=int, default=1)
    page = request.args.get('page', 1, type=int)

    data = search_book(keyword=keyword, min_price=min_price, max_price=max_price, order=order, gerne_id=gerne_id,
                       limit=limit, page=page)
    book_dto = []
    for book in data['books']:
        book_dto.append(book.to_dict())
    data['books'] = book_dto

    return jsonify({
        'message': 'success',
        'status': 200,
        'data': data
    })


@book_rest_bp.route('/manage', methods=['GET'])
def get_manage_books():
    keyword = request.args.get('keyword')
    min_price = request.args.get('minPrice', type=float, default=None)
    max_price = request.args.get('maxPrice', type=float)
    order = request.args.get('order')
    limit = request.args.get('limit', type=int, default=app.config['PAGE_SIZE'])
    quantity_status = request.args.get("quantityStatus", type=int)
    gerne_id = request.args.get('gerneId', type=int)
    page = request.args.get('page', 1, type=int)

    data = search_book(keyword, min_price, max_price, order, gerne_id, limit, page, quantity_status)
    book_dto = []

    for book in data['books']:
        book_dto.append(book.to_dict_manage())
    data['books'] = book_dto

    return data


@book_rest_bp.route('/<book_id>/manage', methods=['GET'])
def get_manage_book(book_id):
    book = find_by_id(book_id)
    if book is None:
        return {}
    return book.to_dict_manage()


@book_rest_bp.route('/barcode/<barcode>', methods=['GET'])
def get_by_barcode(barcode):
    barcode = find_by_barcode(barcode).first().to_dict()
    if not barcode:
        return False
    return barcode


# -------------------------------import book-------------------------------
@book_rest_bp.route('/import', methods=['POST'])
def create_import():
    data = request.json
    return create_form_import(data)


@book_rest_bp.route('/import', methods=['GET'])
def test_import():
    import_id = request.args.get('importId')
    page = request.args.get('page', 1, type=int)
    start_date = request.args.get('startDate', 1, type=int)
    end_date = request.args.get('endDate', 1, type=int)
    form_imports = get_form_imports(import_id=import_id, page=page, start_date=start_date, end_date=end_date)
    return [formImport.to_dict() for formImport in form_imports]


@book_rest_bp.route('/import/test', methods=['GET'])
def testt_import():
    start_date = request.args.get('startDate')
    end_date = request.args.get('endDate')
    form_imports = get_form_imports(start_date=start_date, end_date=end_date)
    return form_imports
