from fastapi import APIRouter, HTTPException
from fastapi import Request


# from backend.funcs.get_data import *

from backend.funcs.get_data import (
    get_bw_data_exists,
    get_region_signal_data,
    get_celltype_list,
    get_gene_locations_in_chromosome,
    get_gwas_in_chromosome,
)

router = APIRouter()


@router.get("/")
async def read_root():
    return {"Message": "Hello Signal."}


@router.get("/getbwdataexists")
async def getbwdataexists(request: Request):
    dataset_id = request.query_params.get("dataset")
    exists = get_bw_data_exists(dataset_id)
    return {"hasBWData": exists}

@router.get("/getregionsignaldata")
async def getregionsignaldata(request: Request):
    dataset_id = request.query_params.get("dataset")
    chromosome = request.query_params.get("chromosome")
    start = int(request.query_params.get("start"))
    end = int(request.query_params.get("end"))
    celltype = request.query_params.get("celltype")
    bin_size = int(request.query_params.get("binsize", 1))

    print(f"getregionsignaldata() called with bin size {bin_size}================")

    response = get_region_signal_data(
        dataset_id, chromosome, start, end, celltype, bin_size
    )

    if "Error" in response:
        print(response)
        if "BigWig folder not found" in response:
            return {"hasBWData": False, "message": response}
        raise HTTPException(status_code=404, detail="Error in getting signal data")
    return {"hasBWData": True, "data": response}


@router.get("/getcelltypelist")
async def getcelltypelist(request: Request):
    print("getcelltypelist() called================")

    dataset_id = request.query_params.get("dataset")

    response = get_celltype_list(dataset_id)

    if "Error" in response:
        raise HTTPException(status_code=404, detail="Error in getting cell type list")
    return response


@router.get("/getgenelocationsinchromosome")
async def getgenelocationsinchromosome(request: Request):
    print("getgenelocationsinchromosome() called================")
    dataset_id = request.query_params.get("dataset")
    chromosome = request.query_params.get("chromosome")
    start = request.query_params.get("start")
    end = request.query_params.get("end")

    start = int(start) if start else None
    end = int(end) if end else None

    response = get_gene_locations_in_chromosome(dataset_id, chromosome, start, end)

    if "Error" in response:
        print(response)
        raise HTTPException(status_code=404, detail="Error in getting gene locations.")
    return response


@router.get("/getgwasinchromosome")
async def getgwasinchromosome(request: Request):
    print("getgwasinchromosome() called================")
    dataset_id = request.query_params.get("dataset")
    chromosome = request.query_params.get("chromosome")
    start = request.query_params.get("start")
    end = request.query_params.get("end")

    start = int(start) if start else None
    end = int(end) if end else None

    response = get_gwas_in_chromosome(dataset_id, chromosome, start, end)

    if "Error" in response:
        raise HTTPException(status_code=404, detail="Error in getting GWAS data.")
    return response
