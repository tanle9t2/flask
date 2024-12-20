from flask import request, Blueprint, jsonify
from app import app
from app.dao.BookGerneDAO import get_depth_gerne, find_all_extend_attribute

book_gerne_rest_bp = Blueprint('book_gerne_rest', __name__)


@book_gerne_rest_bp.route('/', methods=['GET'])
def get_book_gerne():
    gerne_id = request.args.get('gerneId')
    data = get_depth_gerne(int(gerne_id))
    return jsonify({
        "message": "SUCCESS",
        "status": 200,
        'data': data
    })



@book_gerne_rest_bp.route('/<book_gerne_id>/attributes', methods=['GET'])
def get_attributes(book_gerne_id):
    attributes = find_all_extend_attribute(book_gerne_id)
    print('test',attributes)
    return jsonify({
        "message": "SUCCESS",
        "status": 200,
        'data': [attribute.to_dict() for attribute in attributes]
    })
