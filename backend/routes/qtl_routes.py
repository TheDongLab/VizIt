from fastapi import APIRouter, HTTPException
from fastapi import Request


# from backend.funcs.get_data import *

from backend.funcs.get_data import (
    get_qtl_gene_list,
    get_qtl_snp_list,
    get_snp_data_for_gene,
    get_gene_data_for_snp,
    get_gene_celltypes,
    get_snp_celltypes,
    get_gene_chromosome,
    get_snp_chromosome,
    get_gene_location,
    get_snp_location,
    get_gene_locations_in_chromosome,
    get_snp_locations_in_chromosome,
    get_gwas_in_chromosome,
)

router = APIRouter()


@router.get("/")
async def read_root():
    return {"Message": "Hello QTL."}


@router.get("/getgenelocation")
async def getgenelocation(request: Request):
    print("getgenelocation() called================")
    dataset_id = request.query_params.get("dataset")
    gene = request.query_params.get("gene")

    response = get_gene_location(dataset_id, gene)

    if "Error" in response:
        raise HTTPException(status_code=404, detail="Error in getting gene location.")
    return response


@router.get("/getsnplocation")
async def getsnplocation(request: Request):
    print("getsnplocation() called================")
    dataset_id = request.query_params.get("dataset")
    snp = request.query_params.get("snp")

    response = get_snp_location(dataset_id, snp)

    if "Error" in response:
        raise HTTPException(status_code=404, detail="Error in getting SNP location.")
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
        raise HTTPException(status_code=404, detail="Error in getting gene locations.")
    return response


@router.get("/getsnplocationsinchromosome")
async def getsnplocationsinchromosome(request: Request):
    print("getsnplocationsinchromosome() called================")
    dataset_id = request.query_params.get("dataset")
    chromosome = request.query_params.get("chromosome")
    start = request.query_params.get("start")
    end = request.query_params.get("end")

    start = int(start) if start else None
    end = int(end) if end else None

    response = get_snp_locations_in_chromosome(dataset_id, chromosome, start, end)

    if "Error" in response:
        raise HTTPException(status_code=404, detail="Error in getting SNP locations.")
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


@router.get("/getgenechromosome")
async def getgenechromosome(request: Request):
    print("getgenechromosome() called================")
    dataset_id = request.query_params.get("dataset")
    gene = request.query_params.get("gene")

    response = get_gene_chromosome(dataset_id, gene)

    if "Error" in response:
        raise HTTPException(status_code=404, detail="Error in getting gene chromosome.")
    return response


@router.get("/getsnpchromosome")
async def getsnpchromosome(request: Request):
    print("getsnpchromosome() called================")
    dataset_id = request.query_params.get("dataset")
    snp = request.query_params.get("snp")

    response = get_snp_chromosome(dataset_id, snp)

    if "Error" in response:
        raise HTTPException(status_code=404, detail="Error in getting SNP chromosome.")
    return response


@router.get("/getgenelist")
async def getgenelist(request: Request):
    print("getgenelist() called================")
    dataset_id = request.query_params.get("dataset")
    query_str = request.query_params.get("query_str")

    response = get_qtl_gene_list(dataset_id, query_str)

    if "Error" in response:
        raise HTTPException(status_code=404, detail="Error in getting gene list.")
    return response


@router.get("/getsnplist")
async def getsnplist(request: Request):
    print("getsnplist() called================")
    dataset_id = request.query_params.get("dataset")
    query_str = request.query_params.get("query_str")

    response = get_qtl_snp_list(dataset_id, query_str)

    if "Error" in response:
        raise HTTPException(status_code=404, detail="Error in getting SNP list.")
    return response


@router.get("/getgenecelltypes")
async def getgenecelltypes(request: Request):
    print("getgenecelltypes() called================")
    dataset_id = request.query_params.get("dataset")
    gene = request.query_params.get("gene")

    response = get_gene_celltypes(dataset_id, gene)
    if "Error" in response:
        raise HTTPException(
            status_code=404, detail="Error in getting cell types for gene."
        )
    return response


@router.get("/getsnpcelltypes")
async def getsnpcelltypes(request: Request):
    print("getsnpcelltypes() called================")
    dataset_id = request.query_params.get("dataset")
    snp = request.query_params.get("snp")

    response = get_snp_celltypes(dataset_id, snp)
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
    if "Error" in response:
        raise HTTPException(status_code=404, detail="Error in getting gene data.")
    return response
