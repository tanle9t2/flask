from sqlalchemy import text
from app import db
from app.model.BookGerne import BookGerne
import json


def find_by_id(book_gerne_id):
    return BookGerne.query.get(book_gerne_id)


def find_all_extend_attribute(gerne_id):
    book_gerne = BookGerne.query.get(gerne_id)
    return book_gerne.attributes


def get_depth_gerne(id):
    query = """
        SELECT node.book_gerne_id,node.name, node.rgt,node.lft,(COUNT(parent.name) - (sub_tree.depth + 1)) AS depth
        FROM book_gerne AS node,
                 book_gerne AS parent,
                 book_gerne AS sub_parent,
                (
                        SELECT node.name, (COUNT(parent.name) - 1) AS depth
                        FROM book_gerne AS node,
                            book_gerne AS parent
                        WHERE node.lft BETWEEN parent.lft AND parent.rgt
                                AND node.book_gerne_id = :id
                        GROUP BY node.name,node.lft
                        ORDER BY node.lft
                )AS sub_tree
        WHERE node.lft BETWEEN parent.lft AND parent.rgt
                AND node.lft BETWEEN sub_parent.lft AND sub_parent.rgt
                AND sub_parent.name = sub_tree.name
        GROUP BY node.name, sub_tree.depth, node.lft, book_gerne_id
        HAVING (COUNT(parent.name) - (sub_tree.depth + 1)) <= 1
        ORDER BY node.lft;
    """
    result = db.session.execute(text(query), {"id": id})
    rows = result.fetchall()
    # return [BookType(book_type_id=row[0],name=row[1],rgt=row[2],lft=row[3],description=[4]) for row in rows]
    current_gerne = [{
        "id": row[0],
        "name": row[1],
        'rgt':row[2],
        'lft':row[3],
        "depth": row[4]
    } for row in rows if row.depth == 0]
    sub_gerne = [{
        "id": row[0],
        "name": row[1],
        'rgt': row[2],
        'lft': row[3],
        "depth": row[4]
    } for row in rows if row.depth == 1]
    return {
        "current_gerne": current_gerne,
        "sub_gerne": sub_gerne
    }
