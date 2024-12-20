import app.model.User
from app.exception.NotFoundError import NotFoundError
from app.model.Address import Address
from app.model.User import User
from app.model.Account import Account
import hashlib
from app import db
import cloudinary.uploader
from app.model.User import UserRole
import json
from sqlalchemy import or_, select

from sqlalchemy import or_
from sqlalchemy.orm import joinedload


def auth_user(username, password, role=UserRole.USER):
    password = hashlib.md5(password.strip().encode('utf-8')).hexdigest()

    # Truy vấn từ Account và sử dụng quan hệ để lấy User
    account = Account.query.options(joinedload(Account.user)).filter(
        Account.username == username.strip(),
        Account.password == password,
        or_(
            Account.user.has(user_role=role),
            Account.user.has(user_role=UserRole.ADMIN)
        )
    ).first()

    # Trả về User nếu Account tồn tại
    return account.user if account else None


# def auth_user(username, password, role=UserRole.USER):
#     password = str(hashlib.md5(password.strip().encode('utf-8')).hexdigest())
#
#     return User.query.filter(User.username.__eq__(username.strip()),
#                              User.password.__eq__(password),
#                              User.user_role.__eq__(role)).first()

def add_offline_user(first_name, last_name, email, avt_url=None, sex=None, phone_number=None, date_of_birth=None,
                     isActive=None, last_access=None):
    u = User(first_name=first_name, last_name=last_name, email=email,
             avt_url='https://png.pngtree.com/png-vector/20191101/ourmid/pngtree-cartoon-color-simple-male-avatar-png-image_1934459.jpg',
             sex=sex, phone_number=phone_number, date_of_birth=date_of_birth, isActive=isActive,
             last_access=last_access)
    if not avt_url:
        avt_url = 'https://png.pngtree.com/png-vector/20191101/ourmid/pngtree-cartoon-color-simple-male-avatar-png-image_1934459.jpg'
    if avt_url:
        res = cloudinary.uploader.upload(avt_url)
        u.avt_url = res.get('secure_url')
    db.session.add(u)
    db.session.commit()


def add_user(first_name, last_name, username, password, email, avt_url=None, sex=None, phone_number=None,
             date_of_birth=None, isActive=None, last_access=None):
    password = hashlib.md5(password.strip().encode('utf-8')).hexdigest()

    # Tạo bản ghi User
    u = User(
        first_name=first_name,
        last_name=last_name,
        email=email,
        avt_url=avt_url or 'https://png.pngtree.com/png-vector/20191101/ourmid/pngtree-cartoon-color-simple-male-avatar-png-image_1934459.jpg',
        sex=sex,
        phone_number=phone_number,
        date_of_birth=date_of_birth,
        isActive=isActive,
        last_access=last_access
    )
    db.session.add(u)
    db.session.flush()  # Flush để có user_id

    # Tạo bản ghi Account
    account = Account(
        username=username,
        password=password,
        user_id=u.user_id
    )
    db.session.add(account)
    db.session.commit()


def find_by_customer_id_phone_number(user_id, phone_number):
    query = User.query
    query = query.filter(User.user_id == user_id, User.phone_number == phone_number)
    return query.first()


def find_user_address(user_id):
    return Address.query.filter(Address.user_id == user_id).all()


def add_address(user_id, data):
    user = User.query.get(user_id)
    address_db = Address(first_name=data['first_name'], last_name=data['last_name'],
                         phone_number=data['phone'],
                         city=data['city'],
                         district=data['district'],
                         ward=data['ward'],
                         address=data['address'], )
    user.address.append(address_db)
    db.session.commit()

    return address_db


def delete_address(user_id, address_id):
    user = User.query.get(user_id)

    for a in user.address:
        if a.address_id == address_id:
            user.address.remove(a)
            db.session.commit()
            return a

    raise NotFoundError("Not found address")


def update_address(user_id, address_id, data):
    user = User.query.get(user_id)
    for a in user.address:
        if a.address_id == address_id:
            for key, value in data.items():
                if hasattr(a, key):  # Optional: Check if the attribute exists
                    setattr(a, key, value)
                else:
                    raise ValueError(f"Invalid attribute: {key}")
                    # Commit the changes
            db.session.commit()
            return a
    raise NotFoundError("Not found address")


def find_by_phone_number(phone_number):
    query = User.query
    query = query.filter(User.phone_number == phone_number)
    return query.first()


def find_customer_phone_number(phone_number):
    obj = [{
        'id': item[0],
        'name': item[1],
        'phone_number': item[2]
    }
        for item in db.session.execute(
            select(User.user_id, User.first_name, User.phone_number).where(User.phone_number.contains(phone_number)))
    ]

    return obj


def get_user_by_id(user_id):
    return User.query.get(user_id)


def get_user_by_id(user_id):
    return User.query.options(joinedload(User.account)).filter_by(user_id=user_id).first()

# def get_user_by_id(user_id):
#     return User.query.get(user_id)
