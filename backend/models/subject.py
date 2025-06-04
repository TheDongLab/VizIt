import uuid

import numpy as np
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional

class SubjectBase(SQLModel):
    subject_id: str = Field(unique=True, index=True, primary_key=True)
    source_subject_id: str = Field(index=True)
    AMPPD_id: str = Field(index=True)
    GP2_id: str = Field(index=True)
    biobank_name: str = Field(index=True)
    organism: str = Field(default="NA")
    sex: str = Field(default="NA")
    age_at_collection: float = Field(default=np.nan)
    race: str = Field(default="NA")
    ethnicity: str = Field(default="NA")
    family_history: str = Field(default="NA")
    last_diagnosis: str = Field(default="NA")
    age_at_onset: int = Field(ge=0, le=120, default=np.nan)
    age_at_diagnosis: int = Field(ge=0, le=120, default=np.nan)
    first_motor_symptom: int = Field(ge=0, le=120, default=np.nan)   ## Age in years at which first motor symptoms manifest. Between 0 and 120
    hx_dementia_mci: str = Field(default="NA")
    hx_melanoma: str = Field(default="NA")
    education_level: str = Field(default="NA")
    smoking_status: str = Field(default="NA")
    smoking_years: Optional[int]|None = Field(default=np.nan)
    APOE_e4_status: str = Field(default="NA")
    cognitive_status: str = Field(default="NA")
    time_from_baseline: int = Field(default="NA")
    primary_diagnosis: str = Field(default="NA")
    primary_diagnosis_text: Optional[str]| None = Field(default="NA")

class Subject(SubjectBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4().hex))
    # subject_samples: list["Sample"] = Relationship(back_populates="subject")
    subject_clinpath: Optional["Clinpath"] = Relationship(back_populates="subject")

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(SubjectBase):
    pass

class SubjectPublic(SubjectBase):
    id: str

class SubjectsPublic(SQLModel):
    data: list[SubjectPublic]
    count: int