import numpy as np
from sqlmodel import SQLModel, Field, Relationship
import uuid
from typing import Optional


class StudyBase(SQLModel):
    study_id: str = Field(index=True, primary_key=True)
    study_name: str = Field(index=True)
    description: str = Field(default="NA")

    team_name: str = Field(index=True)
    lab_name: str = Field(index=True)

    submitter_name: str = Field(default="NA")
    submitter_email: str = Field(default="NA")

class Study(StudyBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4().hex))
    dataset: list["Dataset"] = Relationship(back_populates="study")

class StudyCreate(StudyBase):
    pass

class StudyUpdate(SQLModel):
    study_name: Optional[str] = Field(default="NA")
    description: Optional[str] = Field(default="NA")
    team_dataset_id: Optional[str] = Field(default="NA")
    dataset_name: Optional[str] = Field(default="NA")

    submitter_name: Optional[str] = Field(default="NA")
    submitter_email: Optional[str] = Field(default="NA")

class StudyPublic(StudyBase):
    id: str

class StudiesPublic(SQLModel):
    data: list[StudyPublic]
    count: int
