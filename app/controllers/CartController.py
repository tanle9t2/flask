from flask import Blueprint, render_template, request, session, jsonify

from app.dao import AddressDAO
from app.dao.CartDao import find_by_user_id, find_by_cart_id
from flask_login import current_user

from app.dao.UserDao import find_user_address

cart_bp = Blueprint('cart', __name__)


@cart_bp.route('/')
def cart():
    cart = find_by_user_id(current_user.get_id())

    return render_template("cart.html", cart=cart)


@cart_bp.route('/checkout', methods=['GET', 'POST'])
def checkout():
    if request.method.__eq__('POST'):
        data = request.get_json()
        cart_ss = session.get('cartTick')
        if cart_ss is None:
            cart_ss = []

        # Update the cart session with new data
        cart_ss = [{
            'bookId': int(item['bookId']),
            'img': item['img'],
            'quantity': int(item['quantity']),
            'price': float(item['price']),
            'title': item['title'],
        } for item in data]

        # Save the updated cart back into the session
        session['cartTick'] = cart_ss
        return jsonify({
            "status": "200",
            "message": "SUCCESS",
        })

    cart_tick = session.get('cartTick')
    address_default = AddressDAO.find_by_user_id(1)
    address_user = find_user_address(current_user.get_id())
    total_price = 30000
    for item in cart_tick:
        total_price += item['price']

    return render_template('checkout-cart.html', cartTick=cart_tick, total_price=total_price,
                           address_default=address_default,
                           address_user=address_user)


@cart_bp.route('/get_all_sessions', methods=['GET'])
def get_all_sessions():
    # Retrieve all session data
    session_data = dict(session)  # Convert session to a regular dictionary
    return jsonify(session_data)


@cart_bp.route('/clear_session', methods=['POST', 'GET'])
def clear_session():
    session.clear()  # Remove all keys and their values from the session
    return jsonify({"message": "Session destroyed.", "status": 200})
