import numpy as np
from sqlmodel import SQLModel, Field, Relationship
import uuid
from typing import Optional


class DatasetBase(SQLModel):
    dataset_id: str = Field(unique=True, index=True, primary_key=True)
    dataset_name: str = Field(index=True)
    description: str|None = Field(default="NA")

    PI_full_name: str|None = Field(index=True)
    PI_email: str|None = Field(index=True)
    first_contributor: str = Field(index=True)
    first_contributor_email: str = Field(index=True)
    other_contributors: str|None = Field(default="NA")

    support_grants: str|None = Field(default="NA")
    other_funding_source: Optional[str] | None = Field(default="NA")

    publication_DOI: str|None = Field(default="NA")
    publication_PMID: str|None = Field(default="NA")

    disease: str = Field(default="NA")
    organism: str = Field(default="NA")
    tissue: str = Field(default="NA")
    n_samples: int|None = Field(default=np.nan)
    brain_super_region: str = Field(default="NA")
    brain_region: str = Field(default="NA")

    sample_info: str|None = Field(default="NA")
    assay: str = Field(default="NA")
    dataset_file: str = Field(default="NA")
    sample_sheet: str = Field(default="NA")

    study_id: str = Field(foreign_key="study.study_id")

class Dataset(DatasetBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4().hex))
    study: "Study" = Relationship(back_populates="dataset")
    dataset_samples: list["Sample"] = Relationship(back_populates="dataset")

    def get_super_region_list(self):
        return [i.strip() for i in self.brain_super_region.split(",")]

    def set_super_region_list(self, regions_list):
        self.brain_super_region = ",".join([i.strip() for i in regions_list])

    def get_region_list(self):
        return [i.strip() for i in self.brain_region.split(",")]

    def set_region_list(self, regions_list):
        self.brain_region = ",".join([i.strip() for i in regions_list])


class DatasetCreate(DatasetBase):
    pass