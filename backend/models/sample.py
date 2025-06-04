import uuid

import numpy as np
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List


class SampleBase(SQLModel):
    sample_id: str = Field(index=True)
    source_id: str = Field(index=True)
    # subject_id: str = Field(index=True, foreign_key="subject.subject_id")

    replicate: str = Field(default="NA")
    replicate_count: int = Field(default=np.nan)
    repeated_sample: int = Field(default=np.nan)
    batch: str = Field(default="NA")

    tissue: str = Field(default="NA")
    brain_region: str = Field(default="NA")
    hemisphere: str = Field(default="NA")
    region_level_1: str = Field(default="NA")
    region_level_2: str = Field(default="NA")
    region_level_3: str = Field(default="NA")

    RIN: float = Field(default=-1)
    source_RIN: float = Field(default=-1)
    molecular_source: str = Field(default="NA")
    input_cell_count: int = Field(default=-1)
    assay_kit: str = Field(default="NA")
    sequencing_end: str = Field(default="NA")
    sequencing_length: int = Field(default="NA")
    sequencing_instrument: str = Field(default="NA")

    organism_ontology_term_id: str = Field(default="NA")
    development_stage_ontology_term_id: str = Field(default="NA")
    sex_ontology_term_id: str = Field(default="NA")
    self_reported_ethnicity_ontology_term_id: str = Field(default="NA")
    disease_ontology_term_id: str = Field(default="NA")
    tissue_ontology_term_id: str = Field(default="NA")
    cell_type_ontology_term_id: str = Field(default="NA")
    assay_ontology_term_id: str = Field(default="NA")
    suspension_type: str = Field(default="NA")
    DV200: Optional[float] | None = Field(default=-1)
    pm_PH: Optional[float] | None = Field(default=-1)
    donor_id: Optional[str] | None  = Field(default="NA")

    dataset_id: str = Field(index=True, foreign_key="dataset.dataset_id")
    assay: str = Field(default="NA")

    data_protocol: str = Field(default="NA")

class Sample(SampleBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4().hex), primary_key=True)
    # Relationship to Sample (one-to-many)
    dataset: Optional["Dataset"] = Relationship(back_populates="dataset_samples")

    # sample_data: List["Data"] = Relationship(back_populates="sample")
    # subject: Optional["Subject"] = Relationship(back_populates="subject_samples")
    # protocol: Optional["Protocol"] = Relationship(back_populates="samples")



class SampleCreate(SampleBase):
    pass

class SampleUpdate(SQLModel):
    sample_id: Optional[str] = Field(default="NA")
    source_id: Optional[str] = Field(default="NA")

    replicate: Optional[str] = Field(default="NA")
    replicate_count: Optional[int] = Field(default="NA")
    repeated_sample: Optional[int] = Field(default="NA")
    batch: Optional[str] = Field(default="NA")

    tissue: Optional[str] = Field(default="NA")
    brain_region: Optional[str] = Field(default="NA")
    hemisphere: Optional[str] = Field(default="NA")
    region_level_1: Optional[str] = Field(default="NA")
    region_level_2: Optional[str] = Field(default="NA")
    region_level_3: Optional[str] = Field(default="NA")

    RIN: Optional[float] = Field(default="NA")
    source_RIN: Optional[float] = Field(default="NA")
    molecular_source: Optional[str] = Field(default="NA")
    input_cell_count: Optional[int] = Field(default="NA")
    assay_kit: Optional[str] = Field(default="NA")
    sequencing_end: Optional[str] = Field(default="NA")
    sequencing_length: Optional[str] = Field(default="NA")
    sequencing_instrument: Optional[str] = Field(default="NA")

    organism_ontology_term_id: Optional[str] = Field(default="NA")
    development_stage_ontology_term_id: Optional[str] = Field(default="NA")
    sex_ontology_term_id: Optional[str] = Field(default="NA")
    self_reported_ethnicity_ontology_term_id: Optional[str] = Field(default="NA")
    disease_ontology_term_id: Optional[str] = Field(default="NA")
    tissue_ontology_term_id: Optional[str] = Field(default="NA")
    cell_type_ontology_term_id: Optional[str] = Field(default="NA")
    assay_ontology_term_id: Optional[str] = Field(default="NA")

    suspension_type: Optional[str] = Field(default="NA")
    DV200: Optional[float] = Field(default="NA")
    pm_PH: Optional[float] = Field(default="NA")
    donor_id: Optional[str] = Field(default="NA")


class SamplePublic(SampleBase):
    id: str

class SamplesPublic(SQLModel):
    data: list[SamplePublic]
    count: int

