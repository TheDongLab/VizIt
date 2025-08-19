from fastapi import APIRouter, HTTPException
from starlette.requests import Request

from backend.db import SessionDep
from backend.db_utils.crud import *
from backend.funcs.get_data import *

router = APIRouter()


@router.get("/")
async def read_root():
    return {"Message": "Hello API."}


@router.get("/gethomedata")
async def gethomedata(session: SessionDep):
    print("gethomedata() called================")
    response = get_home_data(session)
    # print (response)
    if "Error" in response:
        raise HTTPException(status_code=404, detail="Error in getting home data.")
    return response


@router.get("/getgenelist")
async def getgenelist(request: Request):
    print("getgenelist() called================")
    dataset_id = request.query_params.get("dataset")
    query_str = request.query_params.get("query_str")

    response = get_gene_list(dataset_id, query_str)
    # print (response)
    if "Error" in response:
        raise HTTPException(status_code=404, detail="Error in getting gene list.")
    return response


@router.get("/getsamplelist")
async def getsamplelist(request: Request):
    print("getsamplelist() called================")
    dataset_id = request.query_params.get("dataset")
    query_str = request.query_params.get("query_str")

    response = get_sample_list(dataset_id, query_str)
    # print (response)
    if "Error" in response:
        return {"success": False, "message": "Error in getting sample list."}
    return {"success": True, "data": response}


@router.get("/getmetalist")
async def getmetalist(request: Request):
    print("getmetalist() called================")
    dataset_id = request.query_params.get("dataset")
    query_str = request.query_params.get("query_str")

    response = get_meta_list(dataset_id, query_str)
    # print (response)
    if "Error" in response:
        raise HTTPException(status_code=404, detail="Error in getting Meta list.")
    return response


@router.get("/getmainclusterinfo")
async def getmainclusterinfo(request: Request):
    print("getmainclusterinfo() called================")
    dataset_id = request.query_params.get("dataset")

    response = get_config_info(dataset_id)
    # print (response)
    if "Error" in response:
        raise HTTPException(status_code=404, detail="Error in getting main cluster info.")

    main_cluster = response['meta_features']['main_cluster_column']
    if main_cluster is None or main_cluster == "":
        raise HTTPException(status_code=404, detail="Error in getting main cluster info.")

    return main_cluster


@router.get("/getclusterlist")
async def getclusterlist(request: Request):
    print("getclusterlist() called================")
    dataset_id = request.query_params.get("dataset")

    response = get_cluster_list(dataset_id)
    # print (response)
    if "Error" in response:
        raise HTTPException(status_code=404, detail="Error in getting cluster list.")
    return response


@router.get("/getcellcounts")
async def getcellcounts(request: Request):
    print("getcellcounts() called================")
    dataset_id = request.query_params.get("dataset")

    response = get_celltype_counts(dataset_id)
    # print (response)
    if "Error" in response:
        raise HTTPException(status_code=404, detail="Error in getting celltype list.")
    return response


@router.get("/getmarkergenes")
async def getmarkergenes(request: Request):
    print("getmarkergenes() called================")
    dataset_id = request.query_params.get("dataset")

    response = get_marker_genes(dataset_id)
    # print (response)
    if "Error" in response:
        raise HTTPException(status_code=404, detail="Error in getting gene markers.")
    return response


@router.get("/getdegsofcluster")
async def getdegsofcluster(request: Request):
    dataset_id = request.query_params.get("dataset")
    cluster = request.query_params.get("cluster")
    print(f"getdegsofcluster({dataset_id},{cluster}) called================")

    response = get_degs_pseudobulk(dataset_id, cluster)
    # response = get_degs_celllevel(dataset_id, celltype)
    # print (response)
    if "Error" in response:
        raise HTTPException(status_code=404, detail="Error in getting gene markers.")
    return response


@router.get("/getumapembedding")
async def getumapembedding(request: Request):
    print("getumapembedding() called================")
    dataset_id = request.query_params.get("dataset")

    response = get_umapembedding(dataset_id)
    # print (response)
    if "Error" in response:
        raise HTTPException(status_code=404, detail="Error in getting Meta list.")
    return response


@router.get("/getexprdata")
async def getexprdata(request: Request):
    print("getgeneexprdata() called================")
    dataset_id = request.query_params.get("dataset")
    gene = request.query_params.get("gene")

    response = get_expr_data(dataset_id, gene)
    # print (response)
    if "Error" in response:
        raise HTTPException(status_code=404, detail="Error in getting expression data.")
    return response


@router.get("/getpseudoexprdata")
async def getpseudoexprdata(request: Request):
    print("getpseudoexprdata() called================")
    dataset_id = request.query_params.get("dataset")
    gene = request.query_params.get("gene")

    response = get_pseudoexpr_data(dataset_id, gene)
    # print (response)
    if "Error" in response:
        raise HTTPException(status_code=404, detail="Error in getting expression data.")
    return response


@router.get("/getallmetadata")
async def getallmetadata(request: Request):
    dataset = request.query_params.get("dataset_id")
    cols = request.query_params.getlist("cols[]")
    rows = request.query_params.getlist("rows[]")
    print(f"getallmetadata({dataset},{cols},{rows}) called================")

    metadata = get_all_metadata(dataset, cols=cols, rows=rows)

    if "Error" in metadata:
        raise HTTPException(status_code=404, detail=metadata)

    return metadata


@router.get("/getallsamplemetadata")
async def getallsamplemetadata(request: Request):
    print("getallsamplemetadata() called================")
    dataset_id = request.query_params.get("dataset")

    response = get_sample_metadata(dataset_id)
    # print (response)
    if "Error" in response:
        raise HTTPException(status_code=404, detail="Error in getting sample metadata.")
    return response


@router.get("/getmetadataofsample")
async def getmetadataofsample(request: Request):
    print("getmetadataofsample() called================")
    dataset_id = request.query_params.get("dataset")
    sample = request.query_params.get("sample")

    response = get_metadata_of_sample(dataset_id, sample)
    # print (response)
    if "Error" in response:
        raise HTTPException(status_code=404, detail="Error in getting sample metadata.")
    return response


@router.get("/getdatatable/{data_id}")
async def getdatatable(data_id: str | uuid.UUID, session: SessionDep):
    if not data_id:
        raise HTTPException(status_code=400, detail="data_id is empty")

    if data_id == "all":
        data = get_all_data(session)
        if not data:
            raise HTTPException(status_code=404, detail="Sample table is empty")
        return data
    else:
        data = get_data_by_id(data_id, session)
        if not data:
            raise HTTPException(status_code=404, detail="Sample not found")
        return data


@router.get("/getsampletable")
async def getsampletable(request: Request, session: SessionDep):
    sample_ids = request.query_params.getlist("sample_id")
    dataset_ids = request.query_params.getlist("dataset_id")
    conditions = {k: request.query_params.getlist(k) for k, v in request.query_params.items()}

    print(f"getsampletable({sample_ids},{dataset_ids},{conditions}) called================")

    if not sample_ids and not dataset_ids:
        raise HTTPException(status_code=400, detail="Dataset_id or sample_id is empty")

    if dataset_ids[0] == "all":
        conditions.pop("dataset_id")
        if sample_ids[0] == "all":
            sample = get_all_samples(session)
            if not sample:
                raise HTTPException(status_code=404, detail="Sample table is empty")
            return sample
        else:
            sample = get_sample_by_conditions(conditions, session)
            if not sample:
                raise HTTPException(status_code=404, detail="Sample not found")
            return sample
    else:
        if sample_ids[0] == "all":
            conditions.pop("sample_id")
            samples = get_sample_by_conditions(conditions, session)
            if not samples:
                raise HTTPException(status_code=404, detail="Sample table is empty")
            return samples
        else:
            sample = get_sample_by_conditions(conditions, session)
            if not sample:
                raise HTTPException(status_code=404, detail="Sample not found")
            return sample


@router.get("/getdatasetlist/{dataset_id}")
async def getdatasetlist(dataset_id: str | uuid.UUID, session: SessionDep):
    if not dataset_id:
        raise HTTPException(status_code=400, detail="dataset_id is empty")

    if dataset_id == "all":
        datasets = get_all_datasets(session)
        if not datasets:
            raise HTTPException(status_code=404, detail="Dataset table is empty")

        brain_super_region_ls = []
        brain_region_ls = []
        assay_ls = []
        organism_ls = []
        tissue_ls = []
        disease_ls = []
        for dataset in datasets:
            brain_super_region_ls += [i.strip() for i in dataset.brain_super_region.split(",")]
            brain_region_ls += [i.strip() for i in dataset.brain_region.split(",")]
            assay_ls.append(dataset.assay)
            organism_ls.append(dataset.organism)
            tissue_ls.append(dataset.tissue)
            disease_ls+=[d.strip() for d in dataset.disease.split(",")]

        dataset_fileters = [
            {"title": "Assay Type", "key": "assayType", "options": set(assay_ls), },
            {"title": "Brain Region", "key": "brainRegion", "options": set(brain_super_region_ls), },
            {"title": "Brain Sub-Region", "key": "brainSubregion", "options": set(brain_region_ls), },
            {"title": "Organism", "key": "organism", "options": set(organism_ls), },
            {"title": "Tissue", "key": "tissue", "options": set(tissue_ls), },
            {"title": "Disease", "key": "disease", "options": set(disease_ls), },
        ]
        return [datasets, dataset_fileters]  # datasets, dataset_fileters
    else:
        dataset = get_dataset_by_id(dataset_id, session)
        if not dataset:
            raise HTTPException(status_code=404, detail=f"dataset not found with id: {dataset_id}")
        return dataset
