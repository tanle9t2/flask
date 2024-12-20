import math
import sys

from flask import request, jsonify, Blueprint
from app import app
from app.dao.BookGerneDAO import find_by_id
from app.dao.SearchDAO import search_book_es, get_suggest
from app.utils.helper import order_type

search_res_bp = Blueprint('search_rest', __name__)


@search_res_bp.route('/')
def search():
    all_query_params = dict(request.args)

    keyword = all_query_params.pop('keyword', None)
    price = all_query_params.pop('price', '0,999999999').split(',')
    min_price = int(price[0])
    max_price = int(price[1])
    order = all_query_params.pop('order', '_score')
    limit = int(all_query_params.pop('limit', app.config['ORDER_PAGE_SIZE']))
    page = int(all_query_params.pop('page', 1))
    gerne_id = int(all_query_params.pop('gerneId', 1))
    book_gerne = find_by_id(gerne_id)

    book = search_book_es(keyword=keyword, min_price=min_price, max_price=max_price, order=order_type[order]
                          , limit=limit
                          , page=page - 1
                          , lft=book_gerne.lft
                          , rgt=book_gerne.rgt
                          , extended_books=all_query_params)
    return jsonify({
        'message': 'success',
        'status': 200,
        'total': int(book['total']),
        'current_page': page,
        'pages': math.ceil(book['total'] / limit),
        'data': book['data'],
        'extended_books': book['extended_books']
    })


@search_res_bp.route('/suggest')
def suggest():
    keyword = request.args.get('keyword')
    book = get_suggest(keyword)

    return jsonify({
        'message': 'success',
        'status': 200,
        'data': book['data'],
    })
