from flask_login import current_user

from app.dao.CartDao import delete_cart_item
from app.dao.OrderDAO import *
from app.dao.PaymentDAO import create_payment
from app.dao.UserDao import *
from app.dao.FormImportDAO import *
from flask import Blueprint, jsonify
from flask import render_template, request
import json

order_api_bp = Blueprint('/api/v1/order', __name__)


@order_api_bp.route("/", methods=['GET'])
def get_order():
    status = None
    if request.args.get("status"):
        status = request.args.get("status").split(',')
    payment_method = request.args.get("paymentMethod")
    order_id = request.args.get("orderId")
    sort_by = request.args.get("sortBy")
    sort_dir = request.args.get("dir")
    order_type = request.args.get("orderType")
    page = request.args.get("page", 1)
    start_date = request.args.get("startDate")
    end_date = request.args.get("endDate")
    orders = find_all(order_id=order_id,
                      status=status,
                      payment_method=payment_method,
                      sort_by=sort_by,
                      sort_dir=sort_dir,
                      order_type=order_type,
                      page=int(page),
                      start_date=start_date,
                      end_date=end_date)
    return orders


@order_api_bp.route("/<int:order_id>/update", methods=['POST'])
def update(order_id):
    update_order(order_id, request.json)
    return request.json


@order_api_bp.route("/add", methods=['POST'], endpoint='test_add')
def offline_order():
    order_list = request.json['orderList']
    customer_info = request.json['customerInfo']

    customer_id_ok = bool(customer_info) and customer_info['id'] is not None
    customer_phone_ok = bool(customer_info) and customer_info['phone_number'] is not None and customer_info[
        'phone_number'] != "" and customer_info['phone_number'] != 0

    if customer_id_ok and customer_phone_ok:
        user = find_by_customer_id_phone_number(int(customer_info['id']), str(customer_info['phone_number']))
    elif not customer_id_ok and not customer_phone_ok:
        user = None
    elif customer_phone_ok:
        user = find_by_phone_number(str(customer_info['phone_number']))
        if user is None:
            user = add_offline_user("Default", "Default", "Default2", avt_url=None, sex=True,
                                    phone_number=str(customer_info['phone_number']), isActive=True)
    else:
        return False

    order = create_offline_order(order_list, user)

    return order


@order_api_bp.route('/onlineOrder', methods=['POST'])
def online_order():
    data = request.json
    order = create_online_order(current_user.get_id(), data)

    for book in data['books']:
        delete_cart_item(current_user.get_id(),book['bookId'])

    return jsonify({
        "message": "SUCCESS",
        "status": 200,
        "orderId": order.order_id
    })


@order_api_bp.route('/orderCancellation', methods=['POST'])
def cancel_order():
    data = request.json
    order_cancellation = create_order_cancellation(data)
    return jsonify({
        'message': 'SUCCESS',
        'status': 200,
        'data': order_cancellation.to_dict()
    })


@order_api_bp.route("/<order_id>/confirm", methods=['GET'])
def confirm_order(order_id):
    update_order_status(order_id, OrderStatus.CHO_GIAO_HANG)
    return {
        "ok": "ok"
    }


@order_api_bp.route("/<order_id>/status", methods=['POST'])
def update_status(order_id):
    status = request.json.get("orderStatusId")
    status_enum = OrderStatus(int(status))

    update_order_status(order_id, status_enum)

    if OrderStatus.DA_HOAN_THANH == status_enum:
        order = find_by_id(order_id)
        total_amount = calculate_total_order_amount(order_id)
        payment_detail = PaymentDetail(order_id=order.order_id, created_at=datetime.utcnow(), amount=total_amount)
        create_payment(payment_detail)
    return {
        "messi": "ronaldo"
    }


@order_api_bp.route("/<order_id>/detail", methods=['GET', 'POST'])
def find(order_id):
    order = find_by_id(order_id)
    return order


@order_api_bp.route("/test/<int:order_id>", methods=["GET"])
def test_order(order_id):
    return get_form_imports()
    # calculate_total_order_amount(order_id)
