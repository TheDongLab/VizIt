from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
import uuid

class ProtocolBase(SQLModel):
    protocol_id: str = Field(unique=True, index=True, primary_key=True)
    protocol_name: str = Field(index=True)
    version: str = Field(default="NA")
    sample_collection_summary: str | None = Field(default="NA")
    cell_extraction_summary: str | None = Field(default="NA")
    lib_prep_summary: str | None = Field(default="NA")
    data_processing_summary: str | None = Field(default="NA")
    github_url: str | None = Field(default="NA")
    protocols_io_DOI: str | None = Field(default="NA")
    other_reference: Optional[str] | None = Field(default="NA")

class Protocol(ProtocolBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4().hex))
    # samples: list["Sample"] = Relationship(back_populates="protocol")

class ProtocolCreate(ProtocolBase):
    pass

class ProtocolUpdate(ProtocolBase):
    pass

class ProtocolPublic(ProtocolBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4().hex))

class ProtocolsPublic(SQLModel):
    data: list[ProtocolPublic]
    count: int

