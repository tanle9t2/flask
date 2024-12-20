from flask import Blueprint, jsonify, request
from flask_login import current_user

from app.dao.CartDao import find_by_user_id, update_cart as update, delete_cart_item, add_cart_item as add, \
    add_multiple_cart_item

cart_rest_bp = Blueprint('cart_rest', __name__)


@cart_rest_bp.route('/', methods=['POST'])
def increase_cart_item():
    pass


@cart_rest_bp.route('/', methods=['GET'])
def get_cart():
    cart = find_by_user_id(2)
    return cart.to_dict()


@cart_rest_bp.route('/', methods=['PUT'])
def update_cart():
    request_data = request.json
    cart_item = update(current_user.get_id(), request_data['cartItems'])
    return jsonify({
        "status": 200,
        "message": "Update cart successfully",
        'data': cart_item.to_dict()
    })


@cart_rest_bp.route('/<int:bookId>', methods=['DELETE'])
def delete_cart(bookId):
    cart = delete_cart_item(current_user.get_id(), bookId)
    print('test', cart)
    return jsonify({
        "status": 200,
        "message": "Delete cart item successfully",
        'currentItem': len(cart.cart_items) if len(cart.cart_items) else 0
    })


@cart_rest_bp.route('/<int:bookId>', methods=['POST'])
def add_cart_items(bookId):
    cart_item = add(bookId)
    return jsonify({
        "status": 200,
        "message": "Add cart item successfully",
        "data": {
            "cartItem": cart_item.to_dict(),
            'current_cart': len(cart_item.cart.cart_items),
            'totalPrice': cart_item.cart.total_price()
        },

    })


@cart_rest_bp.route('/books', methods=['POST'])
def add_cart_item():
    request_data = request.json
    add_multiple_cart_item(request_data)
    return jsonify({
        "status": 200,
        "message": "Add cart item successfully"
    })
