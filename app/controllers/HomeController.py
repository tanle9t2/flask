from flask import Blueprint
from flask import render_template, request
import json

from app.dao.BookDAO import find_by_gerne
from app.dao.BookGerneDAO import get_depth_gerne
from app.dao.SearchDAO import search_book
from app.utils.admin import profile
from datetime import datetime
from flask_login import current_user
from app.model.User import User
from flask import jsonify
from app import db

index_bp = Blueprint('index', __name__)


@index_bp.route("/")
def index():
    book_gerne = get_depth_gerne(1)

    sub_gerne = book_gerne['sub_gerne'][0:4]

    advertised_category_image = [
        'https://cdn0.fahasa.com/media/wysiwyg/Thang-11-2024/catehomepage_vanhoc.jpg',
        'https://cdn0.fahasa.com/media/wysiwyg/Thang-11-2024/catehomepage_manga.jpg',
        'https://cdn0.fahasa.com/media/wysiwyg/Thang-11-2024/catehomepage_ngoaingu.jpg',
        'https://cdn0.fahasa.com/media/wysiwyg/Thang-11-2024/catehomepage_kynang.jpg'
    ]
    idx = 0
    for category in sub_gerne:
        book = search_book(gerne_id=category['id'], limit=3)
        category['advertised_image'] = advertised_category_image[idx]
        category['books'] = [book.images[0].image_url if len(book.images) else None for book in book['books']]
        idx += 1

    new_release = search_book(order='created_at', direction='desc', limit=8)['books']
    bestselling_books = search_book(order='created_at', direction='desc', limit=5)['books']

    return render_template("home.html",
                           bestselling_books=bestselling_books,
                           new_release=new_release,
                           category_section=sub_gerne)


@index_bp.route('/update-profile', methods=['POST'])
def update_profile():
    data = request.get_json()

    try:
        user = User.query.filter_by(user_id=current_user.user_id).first()

        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        user.first_name = data.get('first_name', user.first_name)
        user.last_name = data.get('last_name', user.last_name)
        user.email = data.get('email', user.email)
        user.phone_number = data.get('phone_number', user.phone_number)
        user.sex = data.get('sex', user.sex)
        user.date_of_birth = data.get('date_of_birth', user.date_of_birth)
        user.avt_url = data.get('avt_url', user.avt_url)

        db.session.commit()

        return jsonify({"success": True, "updated": data}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
