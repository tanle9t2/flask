import pdb

from flask import Blueprint, request, jsonify
from flask_login import current_user

from app.dao.CommentDAO import create_comment
from app.dao.OrderDAO import find_add_by_user_id
from app.dao.UserDao import add_address, delete_address, update_address
from app.model.Account import Account
from app.model.User import User

account_rest_bp = Blueprint('account_rest', __name__)


@account_rest_bp.route('/purchase', methods=['GET'])
def get_purchase():
    status = request.args.get('status')
    orders = find_add_by_user_id(current_user.get_id(), status)

    order_to_dict = [order.to_detail_dict() for order in orders]
    return jsonify({
        "msg": "success",
        "status": 200,
        "orders": order_to_dict
    })


@account_rest_bp.route('/address', methods=['POST'])
def add_address_user():
    body = request.form
    full_name = body['name'].split(' ')
    data = {
        'first_name': full_name[len(full_name) - 1],
        'last_name': ' '.join(full_name[:-1]),
        'phone': body['phone'],
        'city': body['dropdown-province'],
        'district': body['dropdown-district'],
        'ward': body['dropdown-ward'],
        'address': body['specific-address'],
    }
    address = add_address(current_user.get_id(), data)
    return jsonify({
        "msg": "success",
        "status": 200,
        'data': address.to_dict()
    })


@account_rest_bp.route('/address/<address_id>', methods=['PUT'])
def update_address_user(address_id):
    body = request.form
    full_name = body['name'].split(' ')
    data = {
        'first_name': full_name[len(full_name) - 1],
        'last_name': ' '.join(full_name[:-1]),
        'phone_number': body['phone'],
        'city': body['dropdown-province'],
        'district': body['dropdown-district'],
        'ward': body['dropdown-ward'],
        'address': body['specific-address'],
    }
    address = update_address(current_user.get_id(), int(address_id), data)
    return jsonify({
        "msg": "success",
        "status": 200,
        "data": address.to_dict()
    })


@account_rest_bp.route('/address/<address_id>', methods=['DELETE'])
def delete_add_user(address_id):
    address = delete_address(current_user.get_id(), int(address_id))
    return jsonify({
        "msg": "success",
        "status": 200,
        "data": address.to_dict()
    })


@account_rest_bp.route('/comment', methods=['POST'])
def post_comment():
    data = request.json
    comment = create_comment(current_user.get_id(), data)

    return jsonify({
        "msg": "success",
        "status": 200,
        'data': comment.to_dict()
    })
