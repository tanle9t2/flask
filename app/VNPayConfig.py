import hashlib
import hmac
import math
import random
import time
import uuid
from datetime import timedelta, datetime
from urllib.parse import urlencode, quote, quote_plus
from webbrowser import Error

from flask import request, redirect, url_for
from pyexpat.errors import messages

from app import app
from app.dao.OrderDAO import update_order_status, find_order_by_id
from app.dao.PaymentDAO import create_payment
from app.model.Order import OrderStatus, PaymentDetail


def generate_vnp_txn_ref():
    # Use the current timestamp for uniqueness
    timestamp = int(time.time())  # Current time in seconds since epoch

    # Generate a random UUID and extract the first 8 characters
    random_part = uuid.uuid4().hex[:8]

    # Combine timestamp and random part to form the TxnRef
    txn_ref = f"{timestamp}{random_part}"
    return txn_ref


def get_client_ip():
    # Check if the request has the X-Forwarded-For header (common when behind a proxy)
    if 'X-Forwarded-For' in request.headers:
        # The header can contain multiple IPs, so we take the first one
        return request.headers.getlist('X-Forwarded-For')[0]
    else:
        # Fallback to remote address if the header is not present
        return request.remote_addr


def generate_vnpay_url(order):
    vnpay_url = app.config["VNPAY_URL"]
    vnpay_data = {
        'vnp_Version': '2.1.0',
        'vnp_TmnCode': app.config["VNPAY_TMN_CODE"],
        'vnp_BankCode': "NCB",
        'vnp_Amount': math.ceil(order.get_amount() * 100),  # Amount in smallest unit
        'vnp_Command': 'pay',
        'vnp_OrderInfo': f"Thanh toan don hang {order.order_id}",
        'vnp_OrderType': "Thanh toan don hang",
        'vnp_CurrCode': "VND",
        'vnp_Locale': 'vn',
        'vnp_ReturnUrl': f"{app.config['VNPAY_RETURN_URL']}?orderId={order.order_id}",
        'vnp_TxnRef': order.order_id,
        'vnp_CreateDate': time.strftime('%Y%m%d%H%M%S', time.localtime()),
        'vnp_IpAddr': get_client_ip()
    }

    # Add Expire Date
    vnp_expire_date = (datetime.now() + timedelta(minutes=1)).strftime("%Y%m%d%H%M%S")
    vnpay_data["vnp_ExpireDate"] = vnp_expire_date

    # Sort and encode parameters
    sorted_data = sorted(vnpay_data.items())  # Sort alphabetically
    encoded_query = urlencode(sorted_data)  # URL encode the query string

    # Generate secure hash
    hash_data = hmac.new(
        app.config['VNPAY_HASH_SECRET'].encode("utf-8"),  # Key
        encoded_query.encode("utf-8"),  # Message
        hashlib.sha512  # Hash function
    ).hexdigest()

    # Add secure hash to the query
    encoded_query += f"&vnp_SecureHash={hash_data}"
    vnpay_url += '?' + encoded_query

    return vnpay_url


def generate_secure_hash(encoded_query):
    return hmac.new(
        app.config['VNPAY_HASH_SECRET'].encode("utf-8"),  # Key
        encoded_query.encode("utf-8"),  # Message
        hashlib.sha512  # Hash function
    ).hexdigest()


def process_ipn(params):
    # Step 1: Verify the IPN signature
    if not verify_vnpay_ipn(params):
        return {"code": "97", "message": "Signature verification failed"}

    # Step 2: Process the transaction reference (txnRef)
    order_id = params.get("vnp_TxnRef")
    try:
        if params.get("status").__eq__('00'):
            order_id = int(order_id)
            order = find_order_by_id(order_id)

            payment_detail = PaymentDetail(order_id=order.order_id, created_at=datetime.utcnow(),
                                           amount=order.get_amount())
            create_payment(payment_detail)
            update_order_status(order_id, OrderStatus.DA_THANH_TOAN)  # Simulated booking service
            response = {
                "code": "00",
                "message": "Successful"
            }
        else:
            raise Error("Thanh toán thất bại")
    except Exception:
        response = {
            "code": params.get('status'),
            "message": messages
        }
    return response


def verify_vnpay_ipn(params):
    # Extract the secure hash from parameters
    req_secure_hash = params.get("vnp_SecureHash")
    params.pop("vnp_SecureHash", None)
    params.pop("vnp_SecureHashType", None)

    # Sort the remaining keys
    field_names = sorted(params.keys())

    # Build the hash payload
    hash_payload = []
    for field_name in field_names:
        field_value = params.get(field_name)
        if field_value:  # Ensure the value is not None or empty
            # Append URL-encoded key-value pairs
            hash_payload.append(f"{field_name}={quote_plus(str(field_value), safe='')}")

    # Join the payload with '&'
    hash_payload_str = "&".join(hash_payload)
    # Compute the secure hash (Replace with your actual signing logic)
    secure_hash = __hmacsha512(app.config['VNPAY_HASH_SECRET'], hash_payload_str)

    # Compare the computed hash with the received hash
    return secure_hash == req_secure_hash


def __hmacsha512(key, data):
    byteKey = key.encode('utf-8')
    byteData = data.encode('utf-8')
    return hmac.new(byteKey, byteData, hashlib.sha512).hexdigest()
