import uuid

import numpy as np
from fastapi import APIRouter, HTTPException
import pandas as pd
from backend.db import engine

router = APIRouter()

@router.get("/")
async def read_root():
    return {"Message": "Hello DB."}


'''
NOTE: 
Here is the order to import the CSV data into the database
1. study
2. protocol
3. dataset
4. subject
5. clinpath
6. sample
7. data
'''
@router.get("/import_csv/{table}", tags=["db"])
async def import_csv(table: str):
    empty_data_lst = [None, "none","Null","null","na", np.nan, "Unknown","unknown","NaN","nan","N/A"]
    if table == "study":
        try:
            df = pd.read_csv("backend/files/Study.csv", thousands=',')
            df['id'] = [str(uuid.uuid4().hex) for _ in range(len(df))]
            df.replace(empty_data_lst, "NA", inplace=True)
            df.to_sql(table, engine, if_exists="append", index=False)
            return {"success": True, "message": "Study data imported successfully"}
        except Exception as e:
            print(e)
            return {"success": False, "message": str(e)}

    elif table == "protocol":
        try:
            df = pd.read_csv("backend/files/Protocol.csv", thousands=',')
            df['id'] = [str(uuid.uuid4().hex) for _ in range(len(df))]
            df.replace(empty_data_lst, "NA", inplace=True)
            df.to_sql(table, engine, if_exists="append", index=False)
            return {"success": True, "message": "Protocol data was imported successfully"}
        except Exception as e:
            print(e)
            return {"success": False, "message": str(e)}

    elif table == "dataset":
        try:
            df = pd.read_csv("backend/files/Dataset.csv", thousands=',')
            df['id'] = [str(uuid.uuid4().hex) for _ in range(len(df))]
            df.replace(empty_data_lst, "NA", inplace=True)
            df.to_sql(table, engine, if_exists="append", index=False)
            return {"success": True, "message": "Dataset data imported successfully"}
        except Exception as e:
            print(e)
            return {"success": False, "message": str(e)}

    elif table == "subject":
        try:
            df = pd.read_csv("backend/files/Subject.csv", thousands=',')
            df['id'] = [str(uuid.uuid4().hex) for _ in range(len(df))]
            df.replace(empty_data_lst, "NA", inplace=True)

            df.loc[df['age_at_collection'] == "NA", 'age_at_collection'] = -1
            df.loc[df['age_at_onset'] == "NA", 'age_at_onset'] = -1
            df.loc[df['age_at_diagnosis'] == "NA", 'age_at_diagnosis'] = -1
            df.loc[df['first_motor_symptom'] == "NA", 'first_motor_symptom'] = -1
            df.loc[df['smoking_years'] == "NA", 'smoking_years'] = -1
            df.loc[df['time_from_baseline'] == "NA", 'time_from_baseline'] = -1

            df.to_sql(table, engine, if_exists="append", index=False)
            return {"success": True, "message": "Subject data is imported successfully"}
        except Exception as e:
            print(e)
            return {"success": False, "message": str(e)}

    elif table == "clinpath":
        try:
            df = pd.read_csv("backend/files/Clinpath.csv", thousands=',')
            df['id'] = [str(uuid.uuid4().hex) for _ in range(len(df))]
            df.replace(empty_data_lst, "NA", inplace=True)
            df.loc[df['path_year_death'] == "NA", 'path_year_death'] = -1
            df.loc[df['age_at_death'] == "NA", 'age_at_death'] = -1
            df.loc[df['brain_weight'] == "NA", 'brain_weight'] = -1
            df.loc[df['duration_pmi'] == "NA", 'duration_pmi'] = -1

            df.to_sql(table, engine, if_exists="append", index=False)
            return {"success": True, "message": "Clinpath data imported successfully"}
        except Exception as e:
            print(e)
            return {"success": False, "message": str(e)}

    elif table == "sample":
        # Logic to import sample data
        try:
            ## read the csv file
            df = pd.read_csv("backend/files/Sample.csv", thousands=',')
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

            df.to_sql(table, engine, if_exists="append", index=False)
        except Exception as e:
            print(e)
            return {"success": False, "message": str(e)}
        return {"success": True, "message": "Sample data is imported successfully"}

    elif table == "data":
        try:
            df = pd.read_csv("backend/files/Data.csv", thousands=',')
            df['id'] = [str(uuid.uuid4().hex) for _ in range(len(df))]
            df.replace(empty_data_lst, "NA", inplace=True)
            df.loc[df['replicate_count'] == "NA", 'replicate_count'] = -1
            df.loc[df['repeated_sample'] == "NA", 'repeated_sample'] = -1
            df.loc[df['time'] == "NA", 'time'] = -1

            df.to_sql(table, engine, if_exists="append", index=False)
            return {"success": True, "message": "Data sheet was imported successfully"}
        except Exception as e:
            print(e)
            return {"success": False, "message": str(e)}

    else:
        return {"success": False, "message": "Invalid path/table"}

