from app.dao.UserDao import *
from flask import Blueprint, jsonify

from flask import render_template, request
import json

user_api_bp = Blueprint('/api/v1/user', __name__)

@user_api_bp.route("/phone_number/<phone_number>")
def get_customer_phone_number(phone_number):
    return json.dumps(find_customer_phone_number(phone_number))
