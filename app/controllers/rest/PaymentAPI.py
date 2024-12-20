from datetime import datetime

from flask import request, redirect, Blueprint, jsonify

from app import app, db, VNPayConfig
from app.VNPayConfig import generate_vnpay_url
from app.dao.OrderDAO import find_by_id, find_order_by_id, update_order_status
from app.model.Order import OrderStatus, PaymentDetail
from app.dao.PaymentDAO import create_payment as create_payment_detail

payment_rest_bp = Blueprint('payment_rest', __name__)


@payment_rest_bp.route('/', methods=['POST'])
def generate_payment():
    order_id = request.args.get("orderId", type=int)
    order = find_order_by_id(order_id)
    vnpay_url = generate_vnpay_url(order)
    return jsonify({
        "message": "SUCCESS",
        'status': 200,
        "vnpay_url": vnpay_url
    })


@payment_rest_bp.route('/payment-ipn', methods=['GET'])
def process_ipn():
    res = request.args.to_dict()
    return VNPayConfig.process_ipn(res)

