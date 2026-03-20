from fastapi import APIRouter, HTTPException
from fastapi import Request

# from backend.funcs.get_data import *

from backend.funcs.get_data import (
    get_bw_data_exists,
    get_region_signal_data,
    get_celltype_list,
    get_bigwig_celltype_list,
    get_gene_locations_in_chromosome,
    get_qtl_gene_list,
    get_qtl_snp_list,
    get_exon_structure_in_chromosome,
    get_gencode_version,
    get_gwas_datasets,
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
    strand = request.query_params.get("strand")

    print(f"getregionsignaldata() called with bin size {bin_size}================")

    response = get_region_signal_data(
        dataset_id, chromosome, start, end, celltype, bin_size, strand
    )

    if isinstance(response, str) and "Error" in response:
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


@router.get("/getbigwigcelltypelist")
async def getbigwigcelltypelist(request: Request):
    print("getbigwigcelltypelist() called================")

    dataset_id = request.query_params.get("dataset")

    response = get_bigwig_celltype_list(dataset_id)

    if "Error" in response:
        raise HTTPException(
            status_code=404, detail="Error in getting bigwig cell type list"
        )
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


@router.get("/getgwasdatasets")
async def getgwasdatasets(request: Request):
    print("getgwasdatasets() called================")
    dataset_id = request.query_params.get("dataset")

    response = get_gwas_datasets(dataset_id)

    if "Error" in response:
        raise HTTPException(status_code=404, detail="Error in getting GWAS datasets.")
    return response


@router.get("/getgwasinchromosome")
async def getgwasinchromosome(request: Request):
    print("getgwasinchromosome() called================")
    dataset_id = request.query_params.get("dataset")
    gwas_dataset_id = request.query_params.get("gwas_dataset")
    chromosome = request.query_params.get("chromosome")
    start = request.query_params.get("start")
    end = request.query_params.get("end")

    start = int(start) if start else None
    end = int(end) if end else None

    response = get_gwas_in_chromosome(
        dataset_id, gwas_dataset_id, chromosome, start, end
    )

    if "Error" in response:
        if "Chromosome file not found" in response:
            return {"hasGwas": False, "data": []}
        # raise HTTPException(status_code=404, detail="Error in getting GWAS data.")
    return {"hasGwas": True, "data": response}

    response = get_gwas_in_chromosome(dataset_id, chromosome, start, end)

    if "Error" in response:
        raise HTTPException(status_code=404, detail="Error in getting GWAS data.")
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


@router.get("/getexonstructureinchromosome")
async def getexonstructureinchromosome(request: Request):
    print("getexonstructureinchromosome() called================")
    dataset_id = request.query_params.get("dataset")
    chromosome = request.query_params.get("chromosome")
    start = request.query_params.get("start")
    end = request.query_params.get("end")

    start = int(start) if start else None
    end = int(end) if end else None

    response = get_exon_structure_in_chromosome(dataset_id, chromosome, start, end)

    if isinstance(response, str) and "Error" in response:
        print(response)
        raise HTTPException(status_code=404, detail="Error in getting exon structure.")

    return response


@router.get("/getgencodeversion")
async def getgencodeversion(request: Request):
    print("getgencodeversion() called================")
    dataset_id = request.query_params.get("dataset")

    response = get_gencode_version(dataset_id)
    if "Error" in response:
        raise HTTPException(status_code=404, detail="Error in getting GENCODE version.")
    return response
