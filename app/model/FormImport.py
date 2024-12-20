
from sqlalchemy import Column, Integer, String, ForeignKey, Double, DATETIME
from app import db, app
from sqlalchemy.orm import relationship


class FormImport(db.Model):
    __tablename__ = "form_import"
    form_import_id = Column(Integer, primary_key=True, autoincrement=True)
    form_import_detail = db.relationship('FormImportDetail', back_populates="form_import", lazy=True)
    created_at = Column(DATETIME)

    employee_id = Column(Integer, ForeignKey("user.user_id"))
    employee = db.relationship("User", back_populates="form_import", lazy=True)

    def to_dict(self):
        json = {
            'form_import_id': self.form_import_id,
            'created_at': self.created_at,
            'employee': {
                'id': self.employee.user_id,
                'name': self.employee.full_name
            },
            'detail': []
        }
        total_quantity = 0
        for detail in self.form_import_detail:
            total_quantity = total_quantity + detail.to_dict()['quantity']
            json['detail'].append(detail.to_dict())
        json['total_quantity'] = total_quantity
        return json

# {
#     'form_id': 12,
#     'created_at': 12,
#     'employee': {
#         'id': 12,
#         'name': 12
#     },
#     'book_detail': [
#         {
#             'book_id': 12,
#             'quantity': 12
#         },
#         {
#             'book_id': 12,
#             'quantity': 12
#         }
#     ],
#       'total': quantity
# }