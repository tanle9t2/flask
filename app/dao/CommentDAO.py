from app import db
from app.model.Comment import Comment


def create_comment(user_id,data):
    print('test', data)
    comment = data['comment']
    book_id = data.get('bookId')
    star_count = data.get('starCount')

    comment_product_db = Comment(book_id=book_id, star_count=star_count
                                 , content=comment, user_id=user_id)
    db.session.add(comment_product_db)
    db.session.commit()

    return comment_product_db

# def reply_comment(data):
#     comment = data['comment']
#     parent_id = data['parentId']
#     parent_comment = Comment.query.get(parent_id)
#
#     update_comment = Comment.query.filter(Comment.lft > parent_comment.lft).all()
#     comment_db = Comment(content=comment, lft=parent_comment.rgt, rgt=parent_comment.rgt + 1, user_id=2)
#     parent_comment.rgt += 2
#
#     for item in update_comment:
#         item.lgt += 2
#         item.rgt += 2
#
#     db.session.add(comment_db)
#     db.session.commit()
