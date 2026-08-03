from typing import Annotated
from sqlmodel import Session, SQLModel
from sqlmodel import create_engine
from fastapi import Depends

from backend.models import *
from backend.settings import settings

engine = create_engine(settings.database_url, echo=False)


def create_db_and_tables():
    # Create missing database tables
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_session)]
