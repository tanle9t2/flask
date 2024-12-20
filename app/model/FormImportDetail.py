
from sqlalchemy import Column, Integer, String, ForeignKey, Double, DATETIME
from app import db, app
from app.model.FormImport import FormImport
from sqlalchemy.orm import relationship


class FormImportDetail(db.Model):
    __tablename__ = "form_import_detail"
    form_import_id = Column(Integer, ForeignKey("form_import.form_import_id"), primary_key=True)
    book_id = Column(Integer, ForeignKey("book.book_id"), primary_key=True)

    book = db.relationship("Book", back_populates="form_import_detail", lazy=True)
    form_import = db.relationship("FormImport", back_populates="form_import_detail", lazy=True)
    quantity = Column(Integer)

    def to_dict(self):
        return {
            'book_detail': self.book.to_dict_manage(),
            'quantity': self.quantity
        }