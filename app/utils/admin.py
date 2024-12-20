from app import db, app
from app.model.BookGerne import BookGerne
from app.model.Book import Book
from app.model.Order import Order
from app.model.Order import OrderDetail
from app.model.User import User
from app.model.Account import Account
from app.model.Publisher import Publisher
from sqlalchemy import or_, func, case
from datetime import datetime, timedelta, date
from sqlalchemy.sql import extract
from flask_login import current_user


def book_gerne_statistic(kw=None, selected_month=None):
    g = db.session.query(
        BookGerne.book_gerne_id,
        BookGerne.name,
        func.coalesce(func.sum(Book.price * OrderDetail.quantity), 0).label('total_revenue')
    ).join(
        Book, BookGerne.book_gerne_id == Book.book_gerne_id, isouter=True
    ).join(
        OrderDetail, Book.book_id == OrderDetail.book_id, isouter=True
    ).join(
        Order, OrderDetail.order_id == Order.order_id, isouter=True
    ).filter(
        or_(Order.status == 'completed', Order.status.is_(None))  # Bao gồm những đơn đã hoàn tất hoặc không có đơn
    )

    if kw:
        g = g.filter(BookGerne.name.contains(kw))

    if selected_month:
        # Nếu selected_month là chuỗi (định dạng "YYYY-MM"), chuyển nó thành datetime
        if isinstance(selected_month, str):
            selected_month = datetime.strptime(selected_month, "%Y-%m").date()

        # Xác định ngày đầu tiên và ngày cuối cùng của tháng
        first_day_of_month = date(selected_month.year, selected_month.month, 1)
        # Lấy ngày đầu tháng tiếp theo, sau đó trừ đi một ngày để có ngày cuối tháng hiện tại
        if selected_month.month == 12:
            last_day_of_month = date(selected_month.year, 12, 31)  # Tháng 12, ngày cuối cùng là 31
        else:
            next_month = date(selected_month.year, selected_month.month + 1, 1)
            last_day_of_month = next_month - timedelta(days=1)

        # Thêm điều kiện lọc cho ngày trong tháng đã chọn
        g = g.filter(Order.created_at >= first_day_of_month)
        g = g.filter(Order.created_at <= last_day_of_month)

    g = g.group_by(BookGerne.book_gerne_id, BookGerne.name).order_by(BookGerne.book_gerne_id)

    return g.all()


from sqlalchemy.sql import func, extract
from datetime import datetime


def stats_revenue_by_month(year=None):
    """
    Thống kê doanh thu theo tháng của năm. Bao gồm cả các tháng không có doanh thu.

    :param year: Năm cần thống kê doanh thu (mặc định là None, sẽ lấy năm hiện tại).
    :return: Danh sách tuple gồm (tháng, tổng doanh thu), sắp xếp từ tháng 1 đến 12.
    """
    if year is None:
        year = datetime.now().year

    # Truy vấn doanh thu thực tế từ cơ sở dữ liệu
    result = db.session.query(
        extract('month', Order.created_at).label('month'),
        func.coalesce(func.sum(Book.price * OrderDetail.quantity), 0).label('total_revenue')
    ).join(
        OrderDetail, OrderDetail.order_id == Order.order_id, isouter=True
    ).join(
        Book, Book.book_id == OrderDetail.book_id, isouter=True
    ).filter(
        Order.status == 'completed'
    ).filter(
        extract('year', Order.created_at) == year
    ).group_by(
        extract('month', Order.created_at)
    ).all()

    # Chuyển kết quả thành dictionary để dễ tra cứu
    revenue_by_month = {int(month): revenue for month, revenue in result}

    # Tạo danh sách đầy đủ từ tháng 1 đến 12
    full_result = [
        (month, revenue_by_month.get(month, 0))  # Nếu không có dữ liệu cho tháng, trả về 0
        for month in range(1, 13)
    ]

    return full_result





def total_revenue_per_gerne(kw=None, selected_month=None):
    result = db.session.query(
        BookGerne.name.label('gerne_name'),
        func.coalesce(func.sum(Book.price * OrderDetail.quantity), 0).label('total_revenue')
    ).join(
        Book, BookGerne.book_gerne_id == Book.book_gerne_id, isouter=True
    ).join(
        OrderDetail, Book.book_id == OrderDetail.book_id, isouter=True
    ).join(
        Order, OrderDetail.order_id == Order.order_id, isouter=True
    ).filter(
        Order.status == 'completed'
    )

    if kw:
        result = result.filter(BookGerne.name.contains(kw))

    if selected_month:
        if isinstance(selected_month, str):
            selected_month = datetime.strptime(selected_month, "%Y-%m").date()

        first_day_of_month = date(selected_month.year, selected_month.month, 1)

        if selected_month.month == 12:
            last_day_of_month = date(selected_month.year, 12, 31)
        else:
            next_month = date(selected_month.year, selected_month.month + 1, 1)
            last_day_of_month = next_month - timedelta(days=1)

        result = result.filter(Order.created_at >= first_day_of_month)
        result = result.filter(Order.created_at <= last_day_of_month)

    result = result.group_by(BookGerne.name)

    total_revenue = sum(
        item.total_revenue if item.total_revenue is not None else 0 for item in result
    )

    return total_revenue


# def book_gerne_statistic(kw=None, from_date=None, to_date=None):
#     g = db.session.query(
#         BookGerne.book_gerne_id,
#         BookGerne.name,
#         func.coalesce(func.sum(Book.price * OrderDetail.quantity), 0).label('total_revenue')
#     ).join(
#         Book, BookGerne.book_gerne_id == Book.book_gerne_id, isouter=True
#     ).join(
#         OrderDetail, Book.book_id == OrderDetail.book_id, isouter=True
#     ).join(
#         Order, OrderDetail.order_id == Order.order_id, isouter=True
#     ).filter(
#         or_(Order.status == 'completed', Order.status.is_(None))
#     ).group_by(
#         BookGerne.book_gerne_id, BookGerne.name
#     ).order_by(
#         BookGerne.book_gerne_id
#     )
#
#     # Lọc theo từ khóa (kw)
#     if kw:
#         g = g.filter(BookGerne.name.contains(kw))
#
#     # Lọc theo khoảng thời gian (from_date, to_date)
#     if from_date:
#         # Nếu from_date là chuỗi, chuyển đổi thành datetime.date
#         if isinstance(from_date, str):
#             from_date = datetime.strptime(from_date, "%Y-%m-%d").date()
#         g = g.filter(Order.created_at >= from_date)
#
#     if to_date:
#         # Nếu to_date là chuỗi, chuyển đổi thành datetime.date
#         if isinstance(to_date, str):
#             to_date = datetime.strptime(to_date, "%Y-%m-%d").date()
#
#         # Thêm thời gian tối đa (23:59:59) để bao gồm toàn bộ ngày
#         to_date = datetime.combine(to_date, datetime.max.time())
#         g = g.filter(Order.created_at <= to_date)
#
#     return g.all()


# def total_revenue_per_gerne(kw=None, from_date=None, to_date=None):
#     result = db.session.query(
#         BookGerne.name.label('gerne_name'),
#         func.sum(Book.price * OrderDetail.quantity).label('total_revenue')
#     ).join(
#         Book, BookGerne.book_gerne_id == Book.book_gerne_id, isouter=True
#     ).join(
#         OrderDetail, Book.book_id == OrderDetail.book_id, isouter=True
#     ).join(
#         Order, OrderDetail.order_id == Order.order_id, isouter=True
#     ).filter(
#         Order.status == 'completed'  # Chỉ tính doanh thu từ các đơn hàng đã hoàn tất
#     )
#
#     # Lọc theo từ khóa nếu có
#     if kw:
#         result = result.filter(BookGerne.name.contains(kw))
#
#     # Lọc theo khoảng thời gian nếu có
#     if from_date:
#         # Nếu from_date là chuỗi, chuyển nó thành datetime.date
#         if isinstance(from_date, str):
#             from_date = datetime.strptime(from_date, "%Y-%m-%d").date()
#         result = result.filter(Order.created_at >= from_date)
#
#     if to_date:
#         # Nếu to_date là chuỗi, chuyển nó thành datetime.date
#         if isinstance(to_date, str):
#             to_date = datetime.strptime(to_date, "%Y-%m-%d").date()
#         # Đảm bảo tính toàn bộ ngày (bao gồm giờ cuối cùng của ngày)
#         to_date = datetime.combine(to_date, datetime.max.time())
#         result = result.filter(Order.created_at <= to_date)
#
#     # Nhóm theo thể loại và tính tổng doanh thu
#     result = result.group_by(BookGerne.name)
#
#     # Tính tổng doanh thu từ kết quả truy vấn
#     total_revenue = sum(
#         item.total_revenue if item.total_revenue is not None else 0 for item in result
#     )
#
#     return total_revenue

# def book_gerne_statistic(kw=None, from_date=None, to_date=None):
#     g = db.session.query(
#         BookGerne.book_gerne_id,
#         BookGerne.name,
#         func.sum(Book.price * CartItem.quantity).label('total_revenue')
#     ).join(Book, BookGerne.book_gerne_id == Book.book_gerne_id, isouter=True
#            ).join(CartItem, Book.book_id == CartItem.book_id, isouter=True
#                   ).group_by(BookGerne.book_gerne_id, BookGerne.name
#                              ).order_by(BookGerne.book_gerne_id, func.sum(Book.price * CartItem.quantity).desc()
#                                         )
#
#     if kw:
#         g = g.filter(BookGerne.name.contains(kw))
#     return g.all()

# return db.session.query(BookGerne.book_gerne_id, BookGerne.name, func.count(Book.book_id)) \
#     .join(Book, BookGerne.book_gerne_id.__eq__(Book.book_gerne_id), isouter=True) \
#     .group_by(BookGerne.book_gerne_id, BookGerne.name).all()


# def total_revenue_per_gerne():
#     result = db.session.query(
#         BookGerne.name.label('gerne_name'),
#         func.sum(Book.price * CartItem.quantity).label('total_revenue')
#     ).join(Book, BookGerne.book_gerne_id == Book.book_gerne_id, isouter=True) \
#         .join(CartItem, Book.book_id == CartItem.book_id, isouter=True) \
#         .group_by(BookGerne.name)
#
#     total_revenue = sum(item.total_revenue if item.total_revenue is not None else 0 for item in result)
#
#     return total_revenue


# with app.app_context():
#     stats = book_gerne_statistic()
#     print(stats)


# def get_books_by_gerne(gerne_id=None):
#     return db.session.query(Book.book_id, Book.title, Book.quantity) \
#         .filter(Book.book_gerne_id == gerne_id).all()

def get_books_by_gerne(gerne_id=None):
    query = db.session.query(
        Book.book_id,
        Book.title,
        BookGerne.name.label("gerne_name"),
        Book.quantity.label("total_quantity"),
        func.coalesce(func.sum(OrderDetail.quantity), 0).label("ordered_quantity"),
        (Book.quantity - func.coalesce(func.sum(OrderDetail.quantity), 0)).label("remaining_quantity")
    ).outerjoin(BookGerne, BookGerne.book_gerne_id == Book.book_gerne_id) \
        .outerjoin(OrderDetail, OrderDetail.book_id == Book.book_id) \
        .group_by(Book.book_id, Book.title, BookGerne.name, Book.quantity)

    if gerne_id is not None:
        query = query.filter(Book.book_gerne_id == gerne_id)

    return query.all()





# def book_statistic_frequency():
#     return db.session.query(
#         Book.book_id,
#         Book.title,
#         BookGerne.name.label("gerne_name"),
#         Book.quantity.label("total_quantity"),
#         func.coalesce(func.sum(OrderDetail.quantity), 0).label("ordered_quantity"),
#         (Book.quantity - func.coalesce(func.sum(OrderDetail.quantity), 0)).label("remaining_quantity")
#     ) \
#         .outerjoin(BookGerne, BookGerne.book_gerne_id == Book.book_gerne_id) \
#         .outerjoin(OrderDetail, OrderDetail.book_id == Book.book_id) \
#         .group_by(Book.book_id, Book.title, BookGerne.name, Book.quantity) \
#         .all()

def book_statistic_frequency(gerne_id=None):
    query = db.session.query(
        Book.book_id,
        Book.title,
        BookGerne.name.label("gerne_name"),
        Book.quantity.label("total_quantity"),
        func.coalesce(func.sum(OrderDetail.quantity), 0).label("ordered_quantity"),
        (Book.quantity - func.coalesce(func.sum(OrderDetail.quantity), 0)).label("remaining_quantity")
    ).outerjoin(BookGerne, BookGerne.book_gerne_id == Book.book_gerne_id) \
        .outerjoin(OrderDetail, OrderDetail.book_id == Book.book_id) \
        .group_by(Book.book_id, Book.title, BookGerne.name, Book.quantity)

    if gerne_id is not None:
        query = query.filter(Book.book_gerne_id == gerne_id)

    return query.all()




def account_management(user_role=None):
    query = (db.session.query(
        User.user_id,
        User.first_name,
        User.last_name,
        Account.username,
        User.email,
        User.user_role).join(Account, Account.user_id == User.user_id).group_by(User.user_id, User.first_name,
                                                                                User.last_name))

    if user_role is not None:
        query = query.filter(User.user_role == user_role)

    return query.all()



def book_management(gerne_id=None):
    query = db.session.query(
        Book.book_id,
        Book.title,
        BookGerne.name.label("gerne_name"),
        Book.author,
        Publisher.publisher_name.label("publisher_name"),
        Book.price,
        Book.barcode,
        Book.num_page,
        Book.weight,
        Book.format,
        Book.dimension,
    ).outerjoin(BookGerne, BookGerne.book_gerne_id == Book.book_gerne_id) \
        .outerjoin(Publisher, Publisher.publisher_id == Book.publisher_id) \
        .group_by(Book.book_id, Book.title, BookGerne.name)

    if gerne_id is not None:
        query = query.filter(Book.book_gerne_id == gerne_id)

    return query.all()





def bookgerne_management(kw=None):
    query = db.session.query(
        BookGerne.book_gerne_id,
        BookGerne.name,
        BookGerne.lft,
        BookGerne.rgt
    ).group_by(BookGerne.book_gerne_id, BookGerne.name)

    if kw:
        query = query.filter(BookGerne.name.contains(kw))

    return query.all()


def profile():
    # Kiểm tra xem current_user có tồn tại không
    if not current_user.is_authenticated:
        return None  # Trả về None nếu không có người dùng hiện tại (chưa đăng nhập)

    query = db.session.query(
        Account.user_id,
        Account.username,
        User.first_name,
        User.last_name,
        User.email,
        User.phone_number,
        User.avt_url,
        case(
            (User.sex == 1, True), else_=False
        ).label('is_male'),
        case(
            (User.sex == 0, True), else_=False
        ).label('is_female'),
        extract('day', User.date_of_birth).label('day'),
        extract('month', User.date_of_birth).label('month'),
        extract('year', User.date_of_birth).label('year')
    ).join(Account, Account.user_id == User.user_id
    ).filter(User.user_id == current_user.user_id)

    # Trả về kết quả của truy vấn hoặc None nếu không tìm thấy kết quả
    return query.first()  # Trả về một hàng kết quả hoặc None nếu không có dữ liệu