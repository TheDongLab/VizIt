from fastapi import APIRouter, HTTPException
from fastapi import Request


# from backend.funcs.get_data import *

from backend.funcs.get_data import (
    get_qtl_gene_list,
    get_qtl_snp_list,
    get_snp_data_for_gene,
    get_gene_data_for_snp,
    get_celltypes_for_gene,
    get_celltypes_for_snp,
)

router = APIRouter()


@router.get("/")
async def read_root():
    return {"Message": "Hello QTL."}


@router.get("/getgenelist")
async def getgenelist(request: Request):
    print("getgenelist() called================")
    dataset_id = request.query_params.get("dataset")
    query_str = request.query_params.get("query_str")

    response = get_qtl_gene_list(dataset_id, query_str)

    if "Error" in response:
        raise HTTPException(status_code=404, detail="Error in getting QTL gene list.")
    return response


@router.get("/getsnplist")
async def getsnplist(request: Request):
    print("getsnplist() called================")
    dataset_id = request.query_params.get("dataset")
    query_str = request.query_params.get("query_str")

    response = get_qtl_snp_list(dataset_id, query_str)

    if "Error" in response:
        raise HTTPException(status_code=404, detail="Error in getting QTL SNP list.")
    return response


@router.get("/getcelltypesforgene")
async def getcelltypesforgene(request: Request):
    print("getcelltypesforgene() called================")
    dataset_id = request.query_params.get("dataset")
    gene = request.query_params.get("gene")

    response = get_celltypes_for_gene(dataset_id, gene)
    if "Error" in response:
        raise HTTPException(
            status_code=404, detail="Error in getting cell types for gene."
        )
    return response


@router.get("/getcelltypesforsnp")
async def getcelltypesforsnp(request: Request):
    print("getcelltypesforsnp() called================")
    dataset_id = request.query_params.get("dataset")
    snp = request.query_params.get("snp")

    response = get_celltypes_for_snp(dataset_id, snp)
    if "Error" in response:
        raise HTTPException(
            status_code=404, detail="Error in getting cell types for SNP."
        )
    return response


@router.get("/getsnpdataforgene")
async def getsnpdataforgene(request: Request):
    print("getsnpdataforgene() called================")
    dataset_id = request.query_params.get("dataset")
    gene = request.query_params.get("gene")
    celltype = request.query_params.get("celltype")

    response = get_snp_data_for_gene(dataset_id, gene, celltype)
    if "Error" in response:
        raise HTTPException(status_code=404, detail="Error in getting SNP data.")
    return response


@router.get("/getgenedataforsnp")
async def getgenedataforsnp(request: Request):
    print("getgenedataforsnp() called================")
    dataset_id = request.query_params.get("dataset")
    snp = request.query_params.get("snp")
    celltype = request.query_params.get("celltype")

    response = get_gene_data_for_snp(dataset_id, snp, celltype)
    if response is None or "Error" in response:
        raise HTTPException(status_code=404, detail="Error in getting gene data.")
    return response
