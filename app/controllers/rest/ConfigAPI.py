from app.dao.CartDao import delete_cart_item
from app.dao.ConfigDAO import get_config
from flask import Blueprint, jsonify
from flask import render_template, request
import json

config_api_bp = Blueprint('/api/v1/config', __name__)

@config_api_bp.route("/")
def getconfig():
    config = get_config()
    return {
        'min_restock_level': config.min_restock_level,
        'min_restock_qty': config.min_restock_qty,
        'order_cancel_period': config.order_cancel_period
    }