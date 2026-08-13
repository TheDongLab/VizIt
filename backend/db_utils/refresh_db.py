import os
import shutil
import sys

import toml
from sqlmodel import Session

from backend.db import engine, create_db_and_tables
from backend.db_utils.crud import insert_study, insert_dataset, import_sample_sheet
from backend.models import Study, Dataset

DATASETS_DIR = "backend/datasets"
SAMPLESHEETS_DIR = "backend/SampleSheets"


def check_toml_file(toml_data):
    if "datasetfile" not in toml_data:
        return {"message": "Error: Missing [datasetfile] config.", "success": False}
    else:
        required_keys = ["datatype"]
        for key in required_keys:
            if (
                key not in toml_data["datasetfile"]
                or toml_data["datasetfile"][key].strip() == ""
            ):
                return {
                    "message": f"Error: Missing [datasetfile - {key}] config.",
                    "success": False,
                }

    if "dataset" not in toml_data:
        return {"message": "Error: Missing [dataset] config.", "success": False}
    else:
        required_keys = [
            "dataset_name",
            "n_samples",
            "brain_super_region",
            "brain_region",
            "organism",
            "tissue",
            "disease",
        ]
        for key in required_keys:
            if (
                key not in toml_data["dataset"]
                or str(toml_data["dataset"][key]).strip() == ""
            ):
                return {
                    "message": f"Error: Missing [dataset - {key}] config.",
                    "success": False,
                }

    if "study" not in toml_data:
        return {"message": "Error: Missing [study] config.", "success": False}
    else:
        required_keys = ["study_name"]
        for key in required_keys:
            if key not in toml_data["study"] or toml_data["study"][key].strip() == "":
                return {
                    "message": f"Error: Missing [study - {key}] config.",
                    "success": False,
                }

    if "protocol" not in toml_data:
        return {"message": "Error: Missing [protocol] config.", "success": False}
    else:
        required_keys = ["protocol_id"]
        for key in required_keys:
            if (
                key not in toml_data["protocol"]
                or toml_data["protocol"][key].strip() == ""
            ):
                return {
                    "message": f"Error: Missing [protocol - {key}] config.",
                    "success": False,
                }

    return {"message": "Config file is valid", "success": True}


def refresh_dataset(dataset_i, session: Session):
    """Import a single dataset folder. Returns the check_toml_file-style result."""
    dataset_path = f"{DATASETS_DIR}/{dataset_i}"
    ## load dataset info
    dataset_info_file = f"{dataset_path}/dataset_info.toml"
    if not os.path.exists(dataset_info_file):
        return {"message": "Skipped: no dataset_info.toml.", "success": None}

    with open(dataset_info_file, "r") as f:
        dataset_info = toml.load(f)

    ## check if dataset configuration is valid
    check_result = check_toml_file(dataset_info)
    if not check_result["success"]:
        return check_result

    print("=======insert info into database==========")
    study_dict = dataset_info["study"]
    study_dict["study_id"] = study_dict["study_name"]
    study = Study(**study_dict)

    dataset_dict = dataset_info["dataset"]
    dataset_dict["dataset_id"] = dataset_dict["dataset_name"]
    dataset_dict["assay"] = dataset_info["datasetfile"]["datatype"]
    dataset_dict["study_id"] = study_dict["study_id"]
    dataset_dict["dataset_file"] = dataset_info["datasetfile"]["file"]
    dataset = Dataset(**dataset_dict)

    insert_study(study, session)
    insert_dataset(dataset, session)

    sample_sheet = dataset_dict.get("sample_sheet")
    if sample_sheet not in (None, "None", ""):
        sample_sheet_path = f"{SAMPLESHEETS_DIR}/{sample_sheet}"
        shutil.copyfile(sample_sheet_path, f"{dataset_path}/{sample_sheet}")
        import_sample_sheet(sample_sheet_path, session)

    return {"message": f"Imported '{dataset_i}'.", "success": True}


def refresh_database(session: Session):
    """Import every dataset folder. A dataset with an invalid or unreadable
    dataset_info.toml is reported and skipped, the remaining ones still run."""
    if not os.path.isdir(DATASETS_DIR):
        return {
            "message": f"Error: '{DATASETS_DIR}' not found. Run this from the repository root.",
            "success": False,
            "imported": 0,
            "skipped": 0,
            "errors": [],
        }

    imported = 0
    errors = []
    ## loop through all datasets
    for dataset_i in sorted(os.listdir(DATASETS_DIR)):
        if not os.path.isdir(f"{DATASETS_DIR}/{dataset_i}"):
            continue
        try:
            result = refresh_dataset(dataset_i, session)
        except Exception as e:
            errors.append(f"{dataset_i}: {e}")
            continue

        if result["success"]:
            imported += 1
        elif result["success"] is False:
            errors.append(f"{dataset_i}: {result['message']}")

    if errors:
        return {
            "message": f"Database refreshed with problems: {imported} imported, {len(errors)} skipped.",
            "success": False,
            "imported": imported,
            "skipped": len(errors),
            "errors": errors,
        }

    return {
        "message": f"Database refreshed successfully: {imported} dataset(s).",
        "success": True,
        "imported": imported,
        "skipped": 0,
        "errors": [],
    }


def main():
    create_db_and_tables()
    with Session(engine) as session:
        result = refresh_database(session)

    for error in result["errors"]:
        print(f"[SKIPPED] {error}", file=sys.stderr)
    print(result["message"])
    sys.exit(0 if result["success"] else 1)


if __name__ == "__main__":
    main()
