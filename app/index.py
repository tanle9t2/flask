import json
import pdb
import threading
from datetime import datetime
from threading import Thread

from elasticsearch import Elasticsearch
from flask_login import current_user

import app.controllers.AccountController
from app.controllers.CartController import cart_bp
from app.controllers.rest.AccountAPI import account_rest_bp
from app.controllers.rest.CartAPI import cart_rest_bp
from app.dao.CartDao import update_cart
from app.controllers.rest.PaymentAPI import payment_rest_bp
from app.controllers.rest.SearchAPI import search_res_bp
from app.dao import UserDao
from app import app, login, consumers
from app.dao.CartDao import find_by_cart_id
from app.elasticsearch.BookIndexService import create_document, delete_document
from app.elasticsearch.KafkaAsysnData import create, update_book_document, delete, \
    add_attribute_value, modify_attribute_value
from app.exception.CartItemError import CartItemError
from app.exception.InsufficientError import InsufficientError
from app.exception.NotFoundError import NotFoundError
from app.model.User import UserRole
from flask import render_template, request, redirect, url_for, jsonify, flash
from app.controllers.SearchController import home_bp
from app.controllers.HomeController import index_bp
from app.controllers.EmployeeController import employee_bp
from app.controllers.OrderController import order_bp
from app.controllers.rest.BookController import book_rest_bp
from app.controllers.rest.AccountAPI import account_rest_bp
from app.controllers.rest.ConfigAPI import config_api_bp
from app.controllers.rest.UserAPI import user_api_bp
from app.controllers.rest.OrderAPI import order_api_bp, update
from app.controllers.rest.BookGerneController import book_gerne_rest_bp
from app.controllers.AccountController import account_bp
from app.controllers.AdminController import admin_bp, update_book
from app.controllers.CartController import cart_bp
from app.controllers.rest.CartAPI import cart_rest_bp
from app.utils.admin import profile

app.register_blueprint(home_bp, url_prefix='/search')
app.register_blueprint(employee_bp, url_prefix='/employee')
app.register_blueprint(order_bp, url_prefix='/order')

app.register_blueprint(config_api_bp, url_prefix='/api/v1/config')
app.register_blueprint(book_gerne_rest_bp, url_prefix='/api/v1/bookGerne')
app.register_blueprint(book_rest_bp, url_prefix='/api/v1/book')
app.register_blueprint(order_api_bp, url_prefix='/api/v1/order')
app.register_blueprint(cart_rest_bp, url_prefix='/api/v1/cart')
app.register_blueprint(user_api_bp, url_prefix='/api/v1/user')
app.register_blueprint(search_res_bp, url_prefix='/api/v1/search')
app.register_blueprint(payment_rest_bp, url_prefix='/api/v1/payment')

app.register_blueprint(account_rest_bp, url_prefix='/api/v1/account')
app.register_blueprint(index_bp, url_prefix='/')
app.register_blueprint(account_bp, url_prefix='/account')
app.register_blueprint(admin_bp, url_prefix='/admin')
app.register_blueprint(cart_bp, url_prefix='/cart')


@app.errorhandler(NotFoundError)
def handle_not_found_error(e):
    return jsonify({
        'name': type(e).__name__,
        "message": e.message,
        'status': e.status_code
    })


@app.errorhandler(InsufficientError)
def handle_insufficient_error(e):
    update_cart(current_user.get_id(), {
        'bookId': e.details['book_id'],
        'quantity': e.details['current_quantity']
    })
    flash(e.message, "error")
    return jsonify({
        'name': type(e).__name__,  # Get the name of the exception
        "message": e.message,
        'details': e.details,
        "status": e.status_code
    })


@app.errorhandler(CartItemError)
def handle_cart_item_error(e):
    return jsonify({
        'name': type(e).__name__,  # Get the name of the exception
        "message": e.message,
        "status": e.status_code
    })


@app.errorhandler(Exception)
def handle_exception(e):
    return jsonify({
        'name': type(e).__name__,
        "message": e.message,
        "status": 500
    })


@app.context_processor
def context():
    app_context = {
        "cart_items": None,
        "total_price": None,
        'current_year': datetime.now().year,
        "profile": None
    }
    if current_user.is_authenticated:
        user_data = profile()
        cart = find_by_cart_id(user_data.user_id)
        app_context['cart_items'] = cart.cart_items
        app_context['total_price'] = cart.total_price()
        app_context['profile'] = user_data
        return app_context

    return app_context


def consume_kafka(topic):
    with app.app_context():
        """Consume messages from Kafka and index them into Elasticsearch."""
        consumer = consumers[topic]
        consumer.subscribe([topic])
        while True:
            msg = consumer.poll(timeout=1.0)
            if msg is None:
                continue
            elif msg.error():
                print(msg.error())
            else:
                if msg.value():
                    data = json.loads(msg.value().decode('utf-8'))
                    handler_message(topic, data)
        consumer.close()


def handler_message(topic, data):
    if topic.__eq__("dbs_.book_store.book"):
        handle_topic_book(data['payload'])
    elif topic.__eq__("dbs_.book_store.extended_book"):
        handle_topic_extended_book(data['payload'])
    # elif topic.__eq__("dbs_.book_store.attribute"):
    #     handle_topic_attribute(data['payload'])
    # elif topic.__eq__("dbs_.book_store.book_gerne"):
    #     handle_topic_book_gerne(data['payload'])


def handle_topic_book(data):
    try:
        # Extract necessary information from the message
        action = data.get('op')  # Assume 'action' field in data determines what to do

        if action == 'c':
            print("created")
            # Logic for creating a new record or entity
            entity_id = data['after']['book_id']
            create(entity_id)

        elif action == 'u':
            # Logic for updating an existing record or entity
            print('update')
            before_data = data.get('before')
            after_data = data.get('after')
            updated_fields = {}
            for field in before_data.keys():
                if before_data[field] != after_data[field]:
                    updated_fields[field] = after_data[field]

            update_book_document(after_data['book_id'], updated_fields)

        elif action == 'd':
            print("delete")
            entity_id = data['before']['book_id']
            delete(entity_id)
        else:
            print(f"Unknown action: {action}")

    except Exception as e:
        print(f"Error handling topic1 message: {e}")


def handle_topic_extended_book(data):
    try:
        # Extract necessary information from the message
        action = data.get('op')  # Assume 'action' field in data determines what to do
        # Assuming there's an 'id' field that identifies the entity

        if action == 'c':
            print("created")
            # Logic for creating a new record or entity
            add_attribute_value(data['after'])

        elif action == 'u':
            # Logic for updating an existing record or entity
            print('updated')
            modify_attribute_value(data['after']['book_id'])
        elif action == 'd':
            print("delete")
            modify_attribute_value(data['before']['book_id'])
        else:
            print(f"Unknown action: {action}")

    except Exception as e:
        print(f"Error handling topic1 message: {e}")


def handle_topic_book_gerne(data):
    pass


# def handle_topic_attribute(data):
#     try:
#         # Extract necessary information from the message
#         action = data.get('op')  # Assume 'action' field in data determines what to do
#         # Assuming there's an 'id' field that identifies the entity
#         if action == 'u' or action == 'd':
#             # Logic for updating an existing record or entity
#             print('updated')
#             modify_attribute(data['after'])
#         elif action == 'd':
#             # Logic for updating an existing record or entity
#             print('delete')
#             modify_attribute(data['before'])
#         else:
#             print(f"Unknown action: {action}")
#
#     except Exception as e:
#         print(f"Error handling topic1 message: {e}")

@app.route('/status', methods=['GET'])
def status():
    threads = [{"name": t.name, "alive": t.is_alive()} for t in threading.enumerate()]
    return jsonify({"threads": threads})


if __name__ == "__main__":
    KAFKA_TOPICS = app.config["KAFKA_TOPIC"]
    for topic in KAFKA_TOPICS:
        consumer_thread = Thread(target=consume_kafka, args=(topic,), daemon=True)
        consumer_thread.start()

    app.run(debug=True)
