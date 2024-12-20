from flask import Blueprint, request, render_template
from app import app
from app.dao.OrderDAO import *
from flask import jsonify, json

order_bp = Blueprint('order', __name__)

@order_bp.route("/<order_id>")
def get_order_by_id(order_id):
    order = find_by_id(order_id)
    return order.to_dict()

@order_bp.route("/")
def filter_orders():
    status = request.args.get("status")
    paymentMethod = request.args.get("paymentMethod")
    sortBy = request.args.get("sortBy")
    sortDir = request.args.get("sortDir")
    page = request.args.get("page", 1)
    orders = find_all(status=status,
             paymentMethod=paymentMethod,
             sortBy=sortBy,
             sortDir=sortDir,
             page=int(page))

    return [order.to_dict() for order in orders]

