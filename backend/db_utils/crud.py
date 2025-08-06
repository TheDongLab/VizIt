import uuid

import numpy as np
import pandas as pd
from fastapi import HTTPException
from sqlmodel import Session, select

from backend.models import *
from backend.db import engine

## ===================================================
## insert functions
def insert_study(study: Study, session: Session):
    ## check if study exists
    statement = select(Study).where(Study.study_id == study.study_id)  # Create a SELECT query
    result = session.exec(statement).first()
    if result:
        return result
    else:
        session.add(study)
        session.commit()
        session.refresh(study)
        return study

def insert_dataset(dataset: Dataset, session: Session):
    ## check if dataset exists
    statement = select(Dataset).where(Dataset.dataset_id == dataset.dataset_id)  # Create a SELECT query
    result = session.exec(statement).first()
    if result:
        return result
    session.add(dataset)
    session.commit()
    session.refresh(dataset)
    return dataset

def delete_dataset(dataset_id: str, session: Session):
    ## check if dataset exists
    statement = select(Dataset).where(Dataset.dataset_id == dataset_id)  # Create a SELECT query
    result = session.exec(statement).first()
    if result:
        ## delete samples in this dataset
        statement = select(Sample).where(Sample.dataset_id == dataset_id) # delete samples
        samples = session.exec(statement).all()
        for sample in samples:
            session.delete(sample)
            session.commit()

        ## delete dataset
        session.delete(result) # delete dataset
        session.commit()
        return True
    else:
        return False

def insert_data(data: Data, session: Session):
    session.add(data)
    session.commit()
    session.refresh(data)
    return data

def insert_sample(sample: Sample, session: Session):
    ## check if sample exists
    statement = select(Sample).where(Sample.sample_id == sample.sample_id,
                                     Sample.dataset_id == sample.dataset_id)  # Create a SELECT query
    result = session.exec(statement).first()
    if result:
        return result
    session.add(sample)
    session.commit()
    session.refresh(sample)
    return sample


def import_sample_sheet(sample_sheet: str, session: Session):
    print(f"=======import_sample_sheet:{sample_sheet}==========")
    ## read the csv file
    empty_data_lst = [None, "none", "Null", "null", "na", np.nan, "Unknown", "unknown", "NaN", "nan", "N/A"]
    df = pd.read_csv(sample_sheet, thousands=',')
    df['id'] = [str(uuid.uuid4().hex) for _ in range(len(df))]
    df.replace(empty_data_lst, "NA", inplace=True)
    df.loc[df['repeated_sample'] == "NA", 'repeated_sample'] = -1
    df.loc[df['replicate_count'] == "NA", 'replicate_count'] = -1
    df.loc[df['input_cell_count'] == "NA", 'input_cell_count'] = -1
    df.loc[df['RIN'] == "NA", 'RIN'] = -1
    df.loc[df['source_RIN'] == "NA", 'source_RIN'] = -1
    df.loc[df['DV200'] == "NA", 'DV200'] = -1
    df.loc[df['pm_PH'] == "NA", 'pm_PH'] = -1
    df.loc[df['sequencing_length'] == "NA", 'sequencing_length'] = -1

    for index, row in df.iterrows():
        sample = Sample(
            sample_id=row['sample_id'],
            source_id=row['source_id'],
            replicate=row['replicate'],
            replicate_count=row['replicate_count'],
            repeated_sample=row['repeated_sample'],
            batch=row['batch'],
            tissue=row['tissue'],
            brain_region=row['brain_region'],
            hemisphere=row['hemisphere'],
            region_level_1=row['region_level_1'],
            region_level_2=row['region_level_2'],
            region_level_3=row['region_level_3'],
            RIN=row['RIN'],
            source_RIN=row['source_RIN'],
            molecular_source=row['molecular_source'],
            input_cell_count=row['input_cell_count'],
            assay_kit=row['assay_kit'],
            sequencing_end=row['sequencing_end'],
            sequencing_length=row['sequencing_length'],
            sequencing_instrument=row['sequencing_instrument'],
            organism_ontology_term_id=row['organism_ontology_term_id'],
            development_stage_ontology_term_id=row['development_stage_ontology_term_id'],
            sex_ontology_term_id=row['sex_ontology_term_id'],
            self_reported_ethnicity_ontology_term_id=row['self_reported_ethnicity_ontology_term_id'],
            disease_ontology_term_id=row['disease_ontology_term_id'],
            tissue_ontology_term_id=row['tissue_ontology_term_id'],
            cell_type_ontology_term_id=row['cell_type_ontology_term_id'],
            assay_ontology_term_id=row['assay_ontology_term_id'],

            suspension_type=row['suspension_type'],
            DV200=row['DV200'],
            pm_PH=row['pm_PH'],
            donor_id=row['donor_id'],

            dataset_id=row['dataset_id'],
            assay=row['assay'],
            data_protocol=row["data_protocol"]
        )
        insert_sample(sample, session)

def insert_protocol(protocol: Protocol, session: Session):
    session.add(protocol)
    session.commit()
    session.refresh(protocol)
    return protocol

def insert_subject(subject: Subject, session: Session):
    session.add(subject)
    session.commit()
    session.refresh(subject)
    return subject

def insert_clinpath(clinpath: Clinpath, session: Session):
    session.add(clinpath)
    session.commit()
    session.refresh(clinpath)
    return clinpath

## ===================================================
## read functions
def get_data_by_id(id: uuid.UUID, session):
    if not id:
        raise ValueError("id is empty")
    data = session.get(Data, id)

    if not data:
        raise HTTPException(status_code=404, detail="Sample not found")
    return data

def get_all_data(session):
    statement = select(Data)  # Create a SELECT query
    result = session.exec(statement)  # Execute the query
    return result.all()  # Fetch all results

def get_all_samples(session):
    statement = select(Sample)
    result = session.exec(statement)
    return result.all()

def get_sample_by_conditions(conditions: dict, session):
    query = select(Sample)
    for key, value in conditions.items():
        if hasattr(Sample, key):
            query = query.where(getattr(Sample, key).in_(value))
        else:
            pass

    result = session.exec(query)
    return result.all()

def get_dataset_by_id(dataset_id: str, session):
    if not id:
        raise ValueError("dataset id is empty")
    statement = select(Dataset).where(Dataset.dataset_id == dataset_id)  # Create a SELECT query
    result = session.exec(statement).first()

    if not result:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return result

def get_all_datasets(session):
    statement = select(Dataset)
    result = session.exec(statement)
    return result.all()


def get_home_data_1(session):
    datasets = get_all_datasets(session)

    diseases = {}
    for dataset in datasets:
        # Split regions and zip them
        super_regions = [x.strip() for x in dataset.brain_super_region.split(',')]
        sub_regions = [x.strip() for x in dataset.brain_region.split(',')]

        if len(super_regions) != len(sub_regions):
            # Skip or log if mismatch; or raise an error
            continue

        region_pairs = list(zip(super_regions, sub_regions))

        if dataset.disease not in diseases:
            diseases[dataset.disease] = {}
            diseases[dataset.disease]["brain_super_region"] = {dataset.brain_super_region: {dataset.brain_region: 1}}
            diseases[dataset.disease]["assay"] = {dataset.assay: 1}
            diseases[dataset.disease]["n_samples"] = dataset.n_samples
            diseases[dataset.disease]["n_datasets"] = 1
            if dataset.assay.lower() == "visiumst":
                diseases[dataset.disease]["n_visiumst"] = dataset.n_samples
            else:
                diseases[dataset.disease]["n_visiumst"] = 0
        else:
            if dataset.brain_super_region not in diseases[dataset.disease]["brain_super_region"]:
                diseases[dataset.disease]["brain_super_region"][dataset.brain_super_region] = {dataset.brain_region: 1}
            else:
                if dataset.brain_region not in diseases[dataset.disease]["brain_super_region"][dataset.brain_super_region]:
                    diseases[dataset.disease]["brain_super_region"][dataset.brain_super_region][dataset.brain_region] = 1
                else:
                    diseases[dataset.disease]["brain_super_region"][dataset.brain_super_region][dataset.brain_region] += 1

            if dataset.assay not in diseases[dataset.disease]["assay"]:
                diseases[dataset.disease]["assay"][dataset.assay] = 1
            else:
                diseases[dataset.disease]["assay"][dataset.assay] += 1

            diseases[dataset.disease]["n_samples"] += dataset.n_samples
            diseases[dataset.disease]["n_datasets"] += 1

            if dataset.assay.lower() == "visiumst":
                diseases[dataset.disease]["n_visiumst"] += dataset.n_samples
            else:
                diseases[dataset.disease]["n_visiumst"] += 0

    return diseases

def get_home_data(session):
    datasets = get_all_datasets(session)

    diseases = {}

    for dataset in datasets:
        # Split regions and zip them
        super_regions = [x.strip() for x in dataset.brain_super_region.split(',')]
        sub_regions = [x.strip() for x in dataset.brain_region.split(',')]

        if len(super_regions) != len(sub_regions):
            # Skip or log if mismatch; or raise an error
            continue

        region_pairs = list(zip(super_regions, sub_regions))

        if dataset.disease not in diseases:
            diseases[dataset.disease] = {
                "brain_super_region": {},
                "assay": {dataset.assay: 1},
                "n_samples": dataset.n_samples,
                "n_datasets": 1,
                "n_regions": len(region_pairs),
                "n_visiumst": dataset.n_samples if dataset.assay.lower() == "visiumst" else 0
            }

            # Initialize brain regions
            for super_r, sub_r in region_pairs:
                diseases[dataset.disease]["brain_super_region"].setdefault(super_r, {})[sub_r] = 1

        else:
            for super_r, sub_r in region_pairs:
                brain_dict = diseases[dataset.disease]["brain_super_region"]
                if super_r not in brain_dict:
                    brain_dict[super_r] = {sub_r: 1}
                else:
                    brain_dict[super_r][sub_r] = brain_dict[super_r].get(sub_r, 0) + 1

            # Update assay count
            assay_dict = diseases[dataset.disease]["assay"]
            assay_dict[dataset.assay] = assay_dict.get(dataset.assay, 0) + 1

            # Update sample and dataset count
            diseases[dataset.disease]["n_samples"] += dataset.n_samples
            diseases[dataset.disease]["n_regions"] += len(region_pairs)
            diseases[dataset.disease]["n_datasets"] += 1

            if dataset.assay.lower() == "visiumst":
                diseases[dataset.disease]["n_visiumst"] += dataset.n_samples

    return diseases


## ===================================================
## update functions


