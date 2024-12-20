import math
from colorsys import rgb_to_hls
from sys import prefix

from flask import jsonify
from sqlalchemy import text, desc, asc

from app.elasticsearch.BookIndex import BookIndex
from app.model.Config import Config
from app.model.Book import Book
from app import db, es
from app.model.BookGerne import BookGerne


def get_suggest(keyword):
    index_name = BookIndex.index_name
    query = {
        "query": {
            "bool": {
                "should": [
                    {
                        "match_phrase_prefix": {
                            "description": {
                                "max_expansions": 2,
                                "query": keyword,
                                "slop": 3
                            }
                        }
                    }
                    , {
                        "match_phrase_prefix": {
                            "author": {
                                "query": keyword,
                                "max_expansions": 5
                            }
                        }
                    }
                    , {
                        "match_phrase_prefix": {
                            "title": {
                                "boost": 2.0,
                                "max_expansions": 5,
                                "query": keyword
                            }

                        }
                    }
                    , {
                        "nested": {
                            "path": "extended_books",
                            "query": {
                                "match": {
                                    "extended_books.value": {
                                        "query": keyword,
                                        "fuzziness": "AUTO"
                                    }
                                }
                            }
                        }
                    }
                ]
            }
        },
        "sort": [
            {'_score': 'desc'}
        ],
        "from": 0,
        "size": 8,
    }
    try:
        response = es.search(index=index_name, body=query)
        return {
            'data': [data['_source'] for data in response['hits']['hits']],
        }  # Return matching documents
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def search_book_es(keyword, min_price, max_price, extended_books,
                   order, lft, rgt, limit, page):
    index_name = BookIndex.index_name
    condition = {}
    if keyword:
        condition = {
            "bool": {
                "should": [
                    {
                        "match_phrase_prefix": {
                            "description": {
                                "max_expansions": 2,
                                "query": keyword,
                                "slop": 3
                            }
                        }
                    }
                    , {
                        "match_phrase_prefix": {
                            "author": {
                                "query": keyword,
                                "max_expansions": 5
                            }
                        }
                    }
                    , {
                        "match_phrase_prefix": {
                            "title": {
                                "boost": 2.0,
                                "max_expansions": 5,
                                "query": keyword
                            }
                        }
                    }
                    , {
                        "nested": {
                            "path": "extended_books",
                            "query": {
                                "match": {
                                    "extended_books.value": {
                                        "query": keyword,
                                        "fuzziness": "AUTO"
                                    }
                                }
                            }
                        }
                    }
                ]
            }
        }

    else:
        condition = {
            "match_all": {}
        }
    array_condition = [condition]
    if extended_books:
        ex_condition = {
            "bool": {
                'must': [
                    {
                        "nested": {
                            "path": "extended_books",
                            "query": {
                                "term": {
                                    "extended_books.value": ex
                                }
                            }
                        }
                    }
                    for ex in extended_books.values()]
            }

        }
        array_condition.append(ex_condition)

    prefix_query = {
        'bool': {
            'must':
                array_condition
            ,
            "filter": [
                {
                    "range": {
                        "price": {
                            "gte": min_price,
                            "lte": max_price
                        }
                    },
                }
                , {
                    "nested": {
                        "path": "book_gerne",
                        "query": {
                            "range": {
                                "book_gerne.lft": {
                                    "gte": lft,
                                    "lte": rgt
                                }
                            }
                        }
                    }
                }
            ]
        },
    }
    aggregation_query = {
        'query': {
            'bool': {
                "filter": [
                    {
                        "nested": {
                            "path": "book_gerne",
                            "query": {
                                "range": {
                                    "book_gerne.lft": {
                                        "gte": lft,
                                        "lte": rgt
                                    }
                                }
                            }
                        }
                    }
                ]
            }
        },
        "aggs": {
            "nested_extended_books": {
                "nested": {
                    "path": "extended_books"
                },
                "aggs": {
                    "group_by_attribute_id": {
                        "terms": {
                            "field": "extended_books.attribute_id",
                            "size": 10
                        },
                        "aggs": {
                            "attribute_name": {
                                "terms": {
                                    "field": "extended_books.attribute_name",
                                    "size": 1
                                }
                            },
                            "collect_values": {
                                "terms": {
                                    "field": "extended_books.value",
                                    "size": 10
                                }
                            }
                        }
                    }
                }
            }
        },
        "size": 0
    }
    query = {
        "query": prefix_query,
        "sort": [
            {order['field']: order['direction']}
        ],
        "from": page * limit,
        "size": limit,
        "_source": ["book_id", "title", "price", "extended_books", "book_image"]
    }
    try:
        response = es.search(index=index_name, body=query)
        aggregation = es.search(index=index_name, body=aggregation_query)
        return {
            'data': [data['_source'] for data in response['hits']['hits']],
            'extended_books': aggregation['aggregations']['nested_extended_books']['group_by_attribute_id']['buckets'],
            'total': response['hits']['total']['value'],
        }  # Return matching documents
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def search_book(keyword=None, min_price=None, max_price=None,
                order=None, direction=None, gerne_id=None, limit=None, page=1, quantity_status=None):
    query = Book.query
    if keyword:
        query = query.filter(Book.title.contains(keyword))
    if max_price:
        query = query.filter(Book.price.between(min_price, max_price))
    if order:
        if direction == 'desc':
            query = query.order_by(desc(getattr(Book, order)))
        elif direction == 'asc':
            query = query.order_by(asc(getattr(Book, order)))
    if gerne_id:
        gerne = BookGerne.query.get(gerne_id)
        query = query.join(BookGerne)
        query = query.filter(BookGerne.lft.between(gerne.lft, gerne.rgt))
    if quantity_status == 1:
        query = query.filter(Book.quantity >= Config.min_restock_level)
    elif quantity_status == 2:
        query = query.filter(Book.quantity < Config.min_restock_level)

    start = (page - 1) * limit
    end = start + limit
    query_count = query
    total = query_count.count()
    total_page = math.ceil(total / limit)
    query = query.slice(start, end)
    books = query.all()
    return {
        'total_book': total,
        'current_page': page,
        'pages': total_page,
        'books': books
    }
