import app.utils.admin
from app.dao.PublisherDAO import find_all
from app.model.User import UserRole
from flask import render_template, redirect, url_for, request
from flask_login import current_user
from flask import Blueprint
from app.utils.admin import book_gerne_statistic
from flask import jsonify
from app.utils.admin import total_revenue_per_gerne, book_statistic_frequency, account_management, book_management, \
    stats_revenue_by_month, bookgerne_management, profile
from datetime import datetime
import math
from app import app, db
from app.model.BookGerne import BookGerne
from app.model.User import User
from app.model.Book import Book
from app.model.Account import Account
from app.model.Publisher import Publisher
from app.utils.helper import FORMAT_BOOK_TEXT

admin_bp = Blueprint('admin', __name__)


def admin_required(f):
    def wrap(*args, **kwargs):
        if not current_user.is_authenticated:
            return redirect(url_for('account.admin_login'))
        if current_user.user_role != UserRole.ADMIN:
            return redirect(url_for('account.admin_login'))
        return f(*args, **kwargs)

    wrap.__name__ = f.__name__
    return wrap


@admin_bp.route("/")
@admin_required
def admin_home():
    return render_template("admin-home.html")


@admin_bp.route("/add-products")
def add_products_process():
    publishers = find_all()
    return render_template("employee-add-products.html", publishers=publishers, formats=FORMAT_BOOK_TEXT)


@admin_bp.route("/book-manager")
@admin_required
def admin_book_manager():
    gerne_id = request.args.get('gerne_id', type=int)

    if gerne_id == 1:
        stats = book_management()
    else:
        stats = book_management(gerne_id)

    page = int(request.args.get('page', 1))
    page_size = app.config['BOOK_PAGE_SIZE']
    total = len(stats)

    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated_stats = stats[start_idx:end_idx]

    # Render template
    return render_template(
        "admin-book-manager.html",
        stats=paginated_stats, full_stats=stats,
        books={
            'current_page': page,
            'total_page': math.ceil(total / page_size),
            'pages': range(1, math.ceil(total / page_size) + 1),
        }
    )


@admin_bp.route("/statistic-revenue")
@admin_required
def admin_statistic_revenue():
    kw = request.args.get('kw')
    selected_month = request.args.get('selected_month')
    year = request.args.get('year', datetime.now().year)

    stats = book_gerne_statistic(kw=kw, selected_month=selected_month)
    stats_month = stats_revenue_by_month(year=year)

    page = int(request.args.get('page', 1))
    page_size = app.config['STATISTIC_REVEN_PAGE_SIZE']
    total = len(stats)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated_stats = stats[start_idx:end_idx]

    total_revenue = total_revenue_per_gerne(kw=kw, selected_month=selected_month)

    return render_template(
        "admin-statistic-revenue.html",
        stats=paginated_stats,
        full_stats=stats,
        stats_month=stats_month,
        full_stats_month=stats_month,
        total_revenue=total_revenue,
        books={
            'current_page': page,
            'total_page': math.ceil(total / page_size),
            'pages': range(1, math.ceil(total / page_size) + 1)
        }
    )


@admin_bp.route("/statistic-frequency")
@admin_required
def admin_statistic_frequency():
    gerne_id = request.args.get('gerne_id', type=int)

    if gerne_id == 1:
        stats = book_statistic_frequency()
    else:
        stats = book_statistic_frequency(gerne_id)

    page = int(request.args.get('page', 1))
    page_size = app.config['STATISTIC_FRE_PAGE_SIZE']
    total = len(stats)

    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated_stats = stats[start_idx:end_idx]

    # Render template
    return render_template(
        "admin-statistic-frequency.html",
        stats=paginated_stats, full_stats=stats,
        books={
            'current_page': page,
            'total_page': math.ceil(total / page_size),
            'pages': range(1, math.ceil(total / page_size) + 1),
        }
    )


@admin_bp.route("/account-manager")
@admin_required
def admin_account_manager():
    user_role = request.args.get('user_role', type=int)
    stats = account_management(user_role)

    page = int(request.args.get('page', 1))
    page_size = app.config['STATISTIC_FRE_PAGE_SIZE']
    total = len(stats)

    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated_stats = stats[start_idx:end_idx]

    return render_template(
        "admin-account-manager.html",
        stats=paginated_stats,
        books={
            'current_page': page,
            'total_page': math.ceil(total / page_size),
            'pages': range(1, math.ceil(total / page_size) + 1),
        }
    )


@admin_bp.route("/bookgerne-manager")
@admin_required
def admin_bookgerne_manager():
    kw = request.args.get('kw')
    stats = bookgerne_management(kw=kw)

    page = int(request.args.get('page', 1))
    page_size = app.config['BOOK_PAGE_SIZE']
    total = len(stats)

    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated_stats = stats[start_idx:end_idx]
    return render_template("admin-bookgerne-manager.html",
                           kw=kw,
                           stats=paginated_stats,
                           books={
                               'current_page': page,
                               'total_page': math.ceil(total / page_size),
                               'pages': range(1, math.ceil(total / page_size) + 1),
                           })


@admin_bp.route("/profile")
@admin_required
def admin_profile():
    profile_data = profile()
    current_year = datetime.now().year
    return render_template("admin-profile.html", profile=profile_data, current_year=current_year)


@admin_bp.route("/statistic")
@admin_required
def admin_statistic():
    return render_template("admin-statistic.html")


@admin_bp.route("/api/gernes", methods=["GET"])
@admin_required
def get_gernes():
    gernes = db.session.query(BookGerne.book_gerne_id, BookGerne.name).all()
    return jsonify([{"id": gerne.book_gerne_id, "name": gerne.name} for gerne in gernes])


@admin_bp.route("/api/user_roles", methods=["GET"])
@admin_required
def get_user_roles():
    try:
        user_roles = db.session.query(User.user_role).distinct().all()

        # Chuyển đổi từ số sang tên chuỗi Enum
        result = [{"user_role": UserRole(role[0]).name} for role in user_roles]
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_bp.route('/update-book/<int:book_id>', methods=['POST'])
@admin_required
def update_book(book_id):
    try:
        updated_data = request.get_json()

        book = Book.query.get(book_id)
        if not book:
            return jsonify({'success': False, 'message': 'Book not found'}), 404

        book.title = updated_data.get('title', book.title)
        book.author = updated_data.get('author', book.author)

        genre_id = updated_data.get('genre_id')  # Lấy genre_id từ request
        if genre_id:
            genre = BookGerne.query.get(genre_id)  # Tìm thể loại theo ID
            if genre:
                book.book_gerne_id = genre.book_gerne_id  # Cập nhật ID của thể loại
            else:
                return jsonify({'success': False, 'message': f"Genre with ID '{genre_id}' not found"}), 400

        barcode = updated_data.get('barcode')
        if barcode:
            existing_book = Book.query.filter_by(barcode=barcode).first()
            if existing_book and existing_book.book_id != book.book_id:
                return jsonify({'success': False, 'message': f"Barcode '{barcode}' already exists"}), 400
            book.barcode = barcode

        publisher_name = updated_data.get('publisher')
        if publisher_name:
            publisher = Publisher.query.filter_by(publisher_name=publisher_name).first()
            if publisher:
                book.publisher_id = publisher.publisher_id
            else:
                return jsonify({'success': False, 'message': f"Publisher '{publisher_name}' not found"}), 400

        book.price = updated_data.get('price', book.price)
        book.num_page = updated_data.get('num_page', book.num_page)
        book.weight = updated_data.get('weight', book.weight)
        book.format = updated_data.get('format', book.format)
        book.dimension = updated_data.get('dimension', book.dimension)

        db.session.commit()

        return jsonify({'success': True, 'updated': updated_data})

    except Exception as e:
        app.logger.error(f"Error updating book: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/delete-book/<int:book_id>', methods=['POST'])
def delete_book(book_id):
    try:
        book = Book.query.get(book_id)
        if not book:
            return jsonify({"success": False, "message": "Book not found"}), 404

        db.session.delete(book)
        db.session.commit()

        return jsonify({"success": True})

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500


@admin_bp.route('/add-bookgerne', methods=['POST'])
@admin_required
def add_bookgerne():
    try:
        data = request.get_json()  # Lấy dữ liệu JSON
        print(f"Received data: {data}")

        name = data.get('name')
        lft = data.get('lft')
        rgt = data.get('rgt')

        if not name or lft is None or rgt is None:
            return jsonify({'success': False, 'message': 'Thiếu dữ liệu'}), 400

        # Tạo mới thể loại và thêm vào cơ sở dữ liệu
        new_bookgerne = BookGerne(name=name, lft=lft, rgt=rgt)
        db.session.add(new_bookgerne)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Thể loại mới đã được thêm'})

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Lỗi khi thêm thể loại: {str(e)}")
        print(f"Lỗi khi thêm thể loại: {str(e)}")  # Debug lỗi
        return jsonify({'success': False, 'message': 'Lỗi server', 'error': str(e)}), 500


@admin_bp.route('/update-bookgerne/<int:book_gerne_id>', methods=['POST'])
@admin_required
def update_bookgerne(book_gerne_id):
    try:
        updated_data = request.get_json()

        bookgerne = BookGerne.query.get(book_gerne_id)
        if not bookgerne:
            return jsonify({'success': False, 'message': 'Book genre not found'}), 404

        bookgerne.name = updated_data.get('name', bookgerne.name)
        bookgerne.lft = updated_data.get('lft', bookgerne.lft)
        bookgerne.rgt = updated_data.get('rgt', bookgerne.rgt)

        db.session.commit()

        return jsonify({'success': True, 'updated': {
            'book_gerne_id': book_gerne_id,
            'name': bookgerne.name,
            'lft': bookgerne.lft,
            'rgt': bookgerne.rgt
        }})

    except Exception as e:
        app.logger.error(f"Error updating book genre with ID {book_gerne_id}: {str(e)}")
        return jsonify({'success': False, 'message': 'Internal Server Error'}), 500


@admin_bp.route('/delete-bookgerne/<int:book_gerne_id>', methods=['POST'])
@admin_required
def delete_bookgerne(book_gerne_id):
    try:
        bookgerne = BookGerne.query.get(book_gerne_id)
        if not bookgerne:
            return jsonify({"success": False, "message": "Book genre not found"}), 404

        db.session.delete(bookgerne)
        db.session.commit()

        return jsonify({"success": True})

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error deleting book genre: {str(e)}")
        return jsonify({"success": False, "message": "Internal server error", "error": str(e)}), 500


@admin_bp.route('/update-profile', methods=['POST'])
@admin_required
def update_profile():
    data = request.get_json()

    try:
        # Lấy thông tin người dùng từ current_user
        user = User.query.filter_by(user_id=current_user.user_id).first()

        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        # Cập nhật thông tin người dùng từ dữ liệu client gửi lên
        user.first_name = data.get('first_name', user.first_name)
        user.last_name = data.get('last_name', user.last_name)
        user.email = data.get('email', user.email)
        user.phone_number = data.get('phone_number', user.phone_number)
        user.sex = data.get('sex', user.sex)
        user.date_of_birth = data.get('date_of_birth', user.date_of_birth)
        user.avt_url = data.get('avt_url', user.avt_url)

        # Lưu các thay đổi vào cơ sở dữ liệu
        db.session.commit()

        return jsonify({"success": True, "updated": data}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
