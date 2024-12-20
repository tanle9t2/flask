import pdb
from datetime import datetime
from email.policy import default
from re import findall

from flask import Blueprint, request, render_template
from flask_login import current_user

from app import app
from app.dao.BookDAO import find_all, paginate_book, find_by_gerne, find_by_id, count_book_sell
from app.dao.BookGerneDAO import get_depth_gerne
from app.dao.CartDao import find_by_cart_id
from app.dao.SearchDAO import search_book, search_book_es
from app.utils.helper import order_type

home_bp = Blueprint('search', __name__)


@home_bp.route('/')
def search_main():
    all_query_params = dict(request.args)
    print('test', current_user.get_id())
    keyword = all_query_params.pop('keyword', None)
    price = all_query_params.pop('price', '0,999999999').split(',')
    min_price = int(price[0])
    max_price = int(price[1])
    order = all_query_params.pop('order', '_score')
    limit = int(all_query_params.pop('limit', app.config['ORDER_PAGE_SIZE']))
    page = int(all_query_params.pop('page', 1))
    gerne_id = int(all_query_params.pop('gerneId', 1))
    pdb
    book_gerne = get_depth_gerne(gerne_id)

    book = search_book_es(keyword=keyword, min_price=min_price, max_price=max_price, order=order_type[order]
                          , limit=limit
                          , page=page - 1
                          , lft=book_gerne['current_gerne'][0]['lft']
                          , rgt=book_gerne['current_gerne'][0]['rgt']
                          , extended_books=all_query_params)
    return render_template("search.html"
                           , current_gerne=book_gerne["current_gerne"]
                           , sub_gerne=book_gerne["sub_gerne"]
                           , keyword=keyword
                           , minPrice=min_price
                           , maxPrice=max_price
                           , order=order
                           , limit=limit
                           , extended_books=book["extended_books"]
                           , params=all_query_params
                           , pagination=book)


@home_bp.route('/detail')
def get_detail():
    book_id = request.args.get('bookId', type=int)
    book = find_by_id(book_id)
    books = search_book(gerne_id=book.book_gerne_id, limit=12)['books']
    sold_book = count_book_sell(book_id)
    detail_book = {
        "Mã sản phẩm": book.book_id,
        "Tác giả": book.author,
        "Trọng lượng (gr)": book.weight,
        "Kích thước bao bì": book.dimension,
        "Số trang": book.num_page,
        "Hình thức": book.format,
    }
    print('test', book.price)

    comments = book.comments
    comments = sorted(comments, key=lambda x: x.created_at, reverse=True)

    for ex in book.extended_books:
        detail_book[ex.attribute.attribute_name] = ex.value
    avg_star = [0, 0, 0, 0, 0]
    avg_rating = 0
    if len(comments):
        for comment in comments:
            avg_rating += comment.star_count
            avg_star[comment.star_count - 1] += 1
        avg_rating = avg_rating / len(comments)

    return render_template("book-detail.html", book=book
                           , sold_book=sold_book
                           , detail_book=detail_book
                           , books=books
                           , comments=comments
                           , avg_rating=avg_rating
                           , avg_star=avg_star)
