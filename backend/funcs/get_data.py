import os
import pandas as pd
import polars as pl
import numpy as np
import pyBigWig
import math
import json
import toml
import re
from functools import lru_cache


def safe_filename(name):
    return re.sub(r"[^a-zA-Z0-9_\-]", "_", name)


def _normalize_gene_list(raw):
    # Normalize gene list to the format of [{id, name}, ...]
    if raw and isinstance(raw[0], str):
        return [{"id": g, "name": g} for g in raw]
    return raw


def get_snp_group(rs_id: str) -> str:
    digits = rs_id[2:]
    if not digits.isdigit():
        raise ValueError
    if len(digits) < 4:
        return "rs_lt1k"
    return "rs" + digits[:4]

def get_gene_file_name(gene: str) -> str:
    ## For caQTL dataset, the genes are defined as a region in the format of chr1-1000000-1000001
    ## the regions on the same chromosome are grouped together in one file, e.g., chr1.json.
    ## 
    ## For eQTL dataset, the genes are save in json files with the same name as the gene, e.g., BRCA1.json.
    if gene.startswith("chr"):
        return gene.split("-")[0]
    else:
        return gene

def get_gene_location(dataset, gene):
    if dataset == "all":
        return "Error: Dataset is not specified."
    
    if gene.startswith("chr") and "-" in gene:
        try:
            parts = gene.split("-")
            if len(parts) == 3:
                chromosome = parts[0]
                start = int(parts[1])
                end = int(parts[2])
                
                return {
                    "gene_id": gene,
                    "gene_name": gene,
                    "chromosome": chromosome,
                    "start": start,
                    "end": end,
                }
            else:
                return f"Error: Invalid region format for gene {gene}. Expected format: chr#-start-end"
        except ValueError as e:
            return f"Error: Could not parse positions from gene {gene}: {str(e)}"
    
    # Case 2: eQTL dataset - need to look up in JSON file
    genes_file = os.path.join(
        "backend", "datasets", dataset, "gene_jsons", 
        get_gene_file_name(safe_filename(gene)) + ".json"
    )

    if not os.path.exists(genes_file):
        print(genes_file + " not found")
        return "Error: Gene list file not found for the specified dataset."
    
    with open(genes_file, "r") as f:
        data = json.load(f)
        
        if isinstance(data, dict) and gene in data:
            gene_x = data[gene]
        else:
            gene_x = data

    if not gene_x:
        return f"Error: Gene {gene} not found in dataset."

    name = gene_x.get("name", gene)
    chromosome = gene_x.get("chromosome")
    position_start = gene_x.get("position_start")
    position_end = gene_x.get("position_end")

    if position_start is not None and position_end is not None:
        return {
            "gene_id": gene,
            "gene_name": name,
            "chromosome": chromosome,
            "start": position_start,
            "end": position_end,
        }
    else:
        return f"Error: Gene does not have valid position data in dataset."


def get_snp_location(dataset, snp):
    if dataset == "all":
        return "Error: Dataset is not specified."

    def load_snp_from_file(file_path):
        if os.path.exists(file_path):
            with open(file_path, "r") as f:
                data = json.load(f)
            return data.get(snp, None)
        return None

    try:
        group = get_snp_group(snp)
        snps_file = os.path.join(
            "backend", "datasets", dataset, "snp_jsons_merged", group + ".json"
        )
        snp_data = load_snp_from_file(snps_file)
        if snp_data:
            return {
                "chromosome": snp_data["chromosome"],
                "position": snp_data["position"],
            }
    except ValueError:
        # Invalid rsID
        pass

    default_file = os.path.join("backend", "datasets", "snp_locations.json")
    snp_data = load_snp_from_file(default_file)
    if snp_data:
        return {
            "chromosome": snp_data["chromosome"],
            "position": snp_data["position"],
        }

    return None


def get_gene_locations_in_chromosome(dataset, chromosome, start, end):
    if dataset == "all":
        return "Error: Dataset is not specified."
    else:
        chromosome_file = os.path.join(
            "backend", "datasets", dataset, "gene_locations", chromosome + ".parquet"
        )
        # significant_genes_list = get_qtl_gene_list(dataset)

        if os.path.exists(chromosome_file):
            df = pl.read_parquet(chromosome_file).filter(
                (pl.col("position_end") >= start)
                & (pl.col("position_start") <= end)
                # & pl.col("gene_id").is_in(significant_genes_list)
            )

            if not df.is_empty():
                df = df.drop_nulls()

                return {col: df.get_column(col).to_list() for col in df.columns}
            else:
                return f"No genes found in the region."
        else:
            print(chromosome_file + " not found")
            return "Error: Chromosome file not found for the specified dataset."


def get_snp_locations_in_chromosome(dataset, chromosome, start, end):
    if dataset == "all":
        return "Error: Dataset is not specified."
    else:
        chromosome_file = os.path.join(
            "backend", "datasets", dataset, "snp_locations", chromosome + ".parquet"
        )
        significant_snps_list = get_qtl_snp_list(dataset)

        if os.path.exists(chromosome_file):
            df = pl.read_parquet(chromosome_file).filter(
                (pl.col("position") >= start)
                & (pl.col("position") <= end)
                & pl.col("snp_id").is_in(significant_snps_list)
            )
            if not df.is_empty():
                df = df.drop_nulls()
                return {col: df.get_column(col).to_list() for col in df.columns}
            else:
                return f"No SNPs found in the region."
        else:
            print(chromosome_file + " not found")
            return "Error: Chromosome file not found for the specified dataset."


def get_gwas_datasets(dataset):
    config_path = os.path.join("backend", "datasets", dataset, "gwas", "gwas_datasets.toml")
    if not os.path.exists(config_path):
        return [] 
    with open(config_path, "r") as f:
        config = toml.load(f)
    return config.get("datasets", [])


def get_gwas_in_chromosome(qtl_dataset, gwas_dataset, chromosome, start, end):
    base_dir = os.path.join("backend", "datasets", qtl_dataset, "gwas", gwas_dataset)
    file_path = os.path.join(base_dir, f"{chromosome}.tsv")
    if not os.path.exists(file_path):
        # Return empty
        return {
            "snp_id": [],
            "position": [],
            "beta_value": [],
            "p_value": [],
        }
    df = pl.read_csv(file_path, separator="\t").filter(
        (pl.col("position") >= start) & (pl.col("position") <= end)
    )
    if df.is_empty():
        return {
            "snp_id": [],
            "position": [],
            "beta_value": [],
            "p_value": [],
        }
    return df.drop_nulls().to_dict(as_series=False)


def get_gene_chromosome(dataset, gene):
    if dataset == "all":
        return "Error: Dataset is not specified."

    if gene is None:
        return "Error: Gene is not specified."
    
    if gene.startswith("chr") and "-" in gene:
        chromosome = gene.split("-")[0]
        return chromosome
    
    genes_file = os.path.join(
        "backend", "datasets", dataset, "gene_jsons", 
        get_gene_file_name(safe_filename(gene)) + ".json"
    )

    if os.path.exists(genes_file):
        with open(genes_file, "r") as f:
            data = json.load(f)
            gene_x = data

        if gene_x:
            chromosome = gene_x.get("chromosome")
            if chromosome:
                return chromosome
            else:
                return f"Error: Gene {gene} found but has no chromosome information in {dataset} dataset."
        else:
            return f"Error: Gene {gene} not found in {dataset} dataset."
    else:
        print(genes_file + " not found")
        return f"Error: Gene list file not found for the specified dataset {dataset}."


def get_snp_chromosome(dataset, snp):
    if dataset == "all":
        return "Error: Dataset is not specified."
    else:
        snps_file = os.path.join(
            "backend", "datasets", dataset, "snp_jsons_merged", get_snp_group(snp) + ".json"
        )

    if os.path.exists(snps_file):
        with open(snps_file, "r") as f:
            data = json.load(f)
            snp = data.get(snp, None)
        if data and snp:
            return snp["chromosome"]
        else:
            return f"Error: SNP {snp} not found in {dataset} dataset."
    else:
        print(snps_file + " not found")
        return "Error: SNP list file not found for the specified dataset."


def get_gene_list(dataset, query_str="AB"):
    if dataset == "all":
        genes_file = os.path.join("backend", "datasets", "gene_list.json")
    else:
        genes_file = os.path.join("backend", "datasets", dataset, "gene_list.json")

    if os.path.exists(genes_file):
        with open(genes_file, "r") as f:
            data = json.load(f)
        if query_str == "all":
            return data
        elif query_str == "default":
            return data[:10]
        else:
            return [gene for gene in data if gene.lower().startswith(query_str.lower())]
    else:
        print(genes_file + " not found")
        return "Error: Gene list file not found"


def get_qtl_gene_list(dataset, query_str="all"):
    if dataset == "all":
        return "Error: Gene dataset not specified."
    else:
        genes_file = os.path.join(
            "backend", "datasets", dataset, "gene_list.json"
        )

    if os.path.exists(genes_file):
        with open(genes_file, "r") as f:
            data = json.load(f)

        data = _normalize_gene_list(data)

        if query_str == "all":
            filtered = data
        else:
            q = query_str.lower()
            filtered = [
                gene
                for gene in data
                if gene["id"].lower().startswith(q)
                or gene["name"].lower().startswith(q)
            ]

            print(f"Filtered gene list with query '{query_str}': {len(filtered)} genes found")
        return {
            "id": [g["id"] for g in filtered],
            "name": [g["name"] for g in filtered],
        }
    else:
        print(genes_file + " not found")
        return "Error: Gene list file not found"


def get_qtl_snp_list(dataset, query_str="all"):
    if dataset == "all":
        return "Error: SNP dataset not specified."
    else:
        snps_file = os.path.join("backend", "datasets", dataset, "snp_list.json")

    if os.path.exists(snps_file):
        with open(snps_file, "r") as f:
            data = json.load(f)
        if query_str == "all":
            return data
        else:
            return [snp for snp in data if snp.lower().startswith(query_str.lower())]
    else:
        print(snps_file + " not found")
        return "Error: SNP list file not found"


def get_gene_celltypes(dataset, gene):
    if dataset == "all":
        return "Error: Dataset is not specified."
    else:
        genes_file = os.path.join(
            "backend", "datasets", dataset, "gene_jsons", get_gene_file_name(safe_filename(gene)) + ".json"
        )

    if os.path.exists(genes_file):
        with open(genes_file, "r") as f:
            data = json.load(f)

            if gene.startswith("chr"):
                gene_x = data.get(gene, None)
            else:
                gene_x = data

        if gene_x:
            return gene_x.get("celltypes", [])
        else:
            return f"Error: Gene not found in dataset."
    else:
        print(genes_file + " not found")
        return "Error: Gene list file not found for the specified dataset."


def get_snp_celltypes(dataset, snp):
    if dataset == "all":
        return "Error: Dataset is not specified."
    else:
        snps_file = os.path.join(
            "backend", "datasets", dataset, "snp_jsons_merged", get_snp_group(snp) + ".json"
        )

    if os.path.exists(snps_file):
        with open(snps_file, "r") as f:
            data = json.load(f)
            snp = data.get(snp, None)
        if data and snp:
            return snp["celltypes"]
        else:
            return f"Error: SNP not found in dataset."
    else:
        print(snps_file + " not found")
        return "Error: SNP list file not found for the specified dataset."


def get_snp_data_for_gene(dataset, gene, celltype=""):
    if dataset == "all":
        return "Error: Dataset is not specified."

    gene_loc = get_gene_location(dataset, gene)
    if not isinstance(gene_loc, dict):
        return f"Error: {gene_loc}"

    chrom = gene_loc["chromosome"]
    gene_name = gene_loc["gene_name"] or gene  # symbol
    gene_start = gene_loc["start"]
    gene_end = gene_loc["end"]

    celltype_mapping_file = os.path.join(
        "backend", "datasets", dataset, "celltypes", "celltype_parquet.json"
    )
    if not os.path.exists(celltype_mapping_file):
        print(celltype_mapping_file + " not found")
        return "Error: Celltype mapping file not found for the specified dataset."

    with open(celltype_mapping_file, "r") as f:
        celltype_mapping = json.load(f)

    celltype_file = celltype_mapping.get(celltype, celltype)
    data_file = os.path.join("backend", "datasets", dataset, "celltypes", celltype_file)

    if not os.path.exists(data_file):
        print(data_file + " not found")
        return "Error: QTL data file not found for the specified dataset and cell type."

    gene_df = (
        pl.scan_parquet(data_file)
        .filter(
            pl.col("gene_id") == gene_name
        )  # TODO consider filtering on gene_id instead of gene_name
        .collect()
    )

    if gene_df.is_empty():
        return f"Error: Gene {gene} not found in {celltype or 'file'} cell type."

    def get_position(snp_id: str):
        if snp_id is None or not isinstance(snp_id, str):
            return None
        snp_location = get_snp_location(dataset, snp_id)
        if isinstance(snp_location, dict):
            return snp_location.get("position")
        return None

    gene_df = gene_df.with_columns(
        pl.col("snp_id")
        .map_elements(get_position, return_dtype=pl.Int64)
        .alias("position")
    ).drop_nulls(subset=["position"])

    gene_df = gene_df.with_columns(
        [
            pl.lit(gene).alias("gene_id"),  # Ensembl ID
            pl.lit(gene_name).alias("gene_name"),  # Symbol
            pl.lit(chrom).alias("chromosome"),
            pl.lit(gene_start).alias("position_start"),
            pl.lit(gene_end).alias("position_end"),
        ]
    )

    return gene_df.to_dict(as_series=False)


def get_gene_data_for_snp(dataset, is_caqtl, snp, celltype=""):
    if dataset == "all":
        return "Error: Dataset is not specified."

    snp_loc = get_snp_location(dataset, snp)
    if not isinstance(snp_loc, dict):
        return f"Error: {snp_loc}"
    chrom = snp_loc["chromosome"]

    celltype_mapping_file = os.path.join(
        "backend", "datasets", dataset, "celltypes", "celltype_parquet.json"
    )
    if not os.path.exists(celltype_mapping_file):
        print(celltype_mapping_file + " not found")
        return "Error: Celltype mapping file not found for the specified dataset."

    with open(celltype_mapping_file, "r") as f:
        celltype_mapping = json.load(f)

    celltype_file = celltype_mapping.get(celltype, celltype)
    data_file = os.path.join("backend", "datasets", dataset, "celltypes", celltype_file)

    if not os.path.exists(data_file):
        print(data_file + " not found")
        return "Error: QTL data file not found for the specified dataset and cell type."

    snp_df = (
        pl.scan_parquet(data_file)
        .filter(pl.col("snp_id") == snp)
        .collect()
        .drop("snp_id")
    )

    if snp_df.is_empty():
        return f"Error: SNP not found in cell type file."

    if is_caqtl:
        def parse_region(region: str):
            try:
                chrom_part, start_str, end_str = region.split("-")
                return chrom_part, int(start_str), int(end_str)
            except Exception:
                return None, None, None

        snp_df = snp_df.with_columns(
            [
                pl.col("gene_id")
                .map_elements(lambda r: parse_region(r)[0], return_dtype=pl.Utf8)
                .alias("chromosome"),
                pl.col("gene_id")
                .map_elements(lambda r: parse_region(r)[1], return_dtype=pl.Int64)
                .alias("position_start"),
                pl.col("gene_id")
                .map_elements(lambda r: parse_region(r)[2], return_dtype=pl.Int64)
                .alias("position_end"),
                pl.lit("x").alias("strand"),
                pl.lit(None, dtype=pl.Utf8).alias("biotype"),
                pl.col("gene_id").alias("gene_name"),
            ]
        )
        return snp_df.to_dict(as_series=False)

    gene_loc_file = os.path.join(
        "backend", "datasets", dataset, "gene_locations", f"{chrom}.parquet"
    )
    if not os.path.exists(gene_loc_file):
        print(gene_loc_file + " not found")
        return "Error: Gene locations file not found for the specified dataset."

    gene_loc_df = pl.read_parquet(gene_loc_file)

    if "gene_name" not in gene_loc_df.columns:
        return "Error: gene_locations parquet has no gene_name column for eQTL dataset."

    gene_loc_df = gene_loc_df.select(
        ["gene_id", "gene_name", "position_start", "position_end", "strand", "biotype"]
    )

    snp_df = snp_df.rename({"gene_id": "gene_name"})
    result_df = snp_df.join(
        gene_loc_df, on="gene_name", how="left"
    )

    result_df = result_df.drop_nulls(subset=["position_start", "position_end"])

    return result_df.to_dict(as_series=False)


def get_cell2sample_map(dataset):
    if dataset == "all":
        return "Error: Dataset is not specified."

    cell2sample_file = os.path.join(
        "backend", "datasets", dataset, "cell_to_sample.json"
    )
    if os.path.exists(cell2sample_file):
        with open(cell2sample_file, "r") as f:
            data = json.load(f)
        return data
    else:
        return f"Error: cell2sample file not found."


def get_sample_list(dataset, query_str="all"):
    if dataset == "all":
        return "Error: Sample dataset not specified."
    else:
        sample_file = os.path.join("backend", "datasets", dataset, "sample_list.json")

    if os.path.exists(sample_file):
        with open(sample_file, "r") as f:
            data = json.load(f)
        if query_str == "all" or query_str == "":
            return data
        else:
            return [
                sample
                for sample in data
                if sample.lower().startswith(query_str.lower())
            ]
    else:
        print(sample_file + " not found")
        return "Error: Sample list file not found"


def get_meta_list(dataset, query_str="all"):
    if dataset == "all":
        return "Error: Dataset not specified."
    else:
        meta_file = os.path.join("backend", "datasets", dataset, "meta_list.json")

    if os.path.exists(meta_file):
        with open(meta_file, "r") as f:
            data = json.load(f)
        if query_str == "all" or query_str == "":
            return data
        elif query_str == "cell_level":
            cellspot_meta_file = os.path.join(
                "backend", "datasets", dataset, "cellspot_meta_mapping.json"
            )
            if os.path.exists(cellspot_meta_file):
                with open(cellspot_meta_file, "r") as f:
                    cellspot_meta = json.load(f)
                return list(cellspot_meta.keys())
            else:
                print(cellspot_meta_file + " not found")
                return "Error: cellspot_meta_mapping file not found"
        else:
            return [meta for meta in data if meta.lower().startswith(query_str.lower())]
    else:
        print(meta_file + " not found")
        return "Error: Meta list file not found"


def get_config_info(dataset):
    if dataset == "all":
        return "Error: Dataset is not specified."
    else:
        config_file = os.path.join("backend", "datasets", dataset, "dataset_info.toml")

    if os.path.exists(config_file):
        with open(config_file, "r") as f:
            config = toml.load(f)
        return config
    else:
        print(config_file + " not found")
        return "Error: Config info file not found"


def get_cluster_list(dataset):
    if dataset == "all":
        return "Error: Dataset is not specified."
    else:
        cellconuts_file = os.path.join(
            "backend", "datasets", dataset, "clustermarkers", "cluster_cellcounts.json"
        )

    if os.path.exists(cellconuts_file):
        with open(cellconuts_file, "r") as f:
            data = json.load(f)
        return list(data.keys()) if data is not None else data.keys()
    else:
        print(cellconuts_file + " not found")
        return "Error: Meta file not found"


def get_celltype_counts(dataset):
    if dataset == "all":
        return "Error: Dataset is not specified."
    else:
        cellconuts_file = os.path.join(
            "backend", "datasets", dataset, "clustermarkers", "cluster_cellcounts.json"
        )

    if os.path.exists(cellconuts_file):
        with open(cellconuts_file, "r") as f:
            data = json.load(f)
        return data
    else:
        print(cellconuts_file + " not found")
        return "Error: Meta file not found"


def get_marker_genes(dataset):
    if dataset == "all":
        return "Error: Dataset is not specified."
    else:
        markergene_file = os.path.join(
            "backend",
            "datasets",
            dataset,
            "clustermarkers",
            "cluster_markergenes_cellcounts.csv",
        )

    if os.path.exists(markergene_file):
        data_df = pd.read_csv(markergene_file, index_col=None, header=0)
        data = data_df.to_dict(orient="split")
        return data
    else:
        print(markergene_file + " not found")
        return "Error: Marker Genes file not found"


def get_degs_celllevel(dataset, celltype):
    if dataset == "all":
        return "Error: Dataset is not specified."
    else:
        degs_file = os.path.join(
            "backend", "datasets", dataset, "clustermarkers", "cluster_DEGs_topN.csv"
        )

    if os.path.exists(degs_file):
        degs_df = pd.read_csv(degs_file, index_col=None, header=0)
        degs_df = degs_df.loc[
            degs_df["cluster_DE"].str.startswith(celltype),
            ["cluster_DE", "gene", "avg_log2FC", "p_val_adj"],
        ]

        ## keep only 4 digits for avg_log2FC
        degs_df["avg_log2FC"] = degs_df["avg_log2FC"].round(4)
        degs_df["p_val_adj"] = degs_df["p_val_adj"].round(4)

        ## split cluster_DE into cluster name and DE
        degs_df["DE"] = [i.split(".")[1] for i in degs_df["cluster_DE"].tolist()]
        degs_df = degs_df.drop("cluster_DE", axis=1)

        ## group by DE
        degs_groups = (
            degs_df.groupby("DE")
            .apply(lambda g: g.drop("DE", axis=1).to_dict(orient="records"))
            .to_dict()
        )

        ## get gene expression data for each DE,format: [{sampleId: 'cell1/spot1', condition: 'PD', value: 8.1053},...]
        cluster_meta = pd.read_csv(
            os.path.join(
                "backend", "datasets", dataset, "cellspot_metadata_original.csv"
            ),
            index_col=0,
            header=0,
        )
        main_cluster = get_config_info(dataset)["meta_features"]["main_cluster_column"]
        cluster_meta = cluster_meta.loc[cluster_meta[main_cluster] == celltype, :]
        cs_ids = cluster_meta.index.tolist()

        for DE, degs in degs_groups.items():
            for deg in degs:
                expression = []
                gene_name = deg["gene"]
                expr_vals = get_expr_data(dataset, gene_name)

                for cs_i in cs_ids:
                    condation = cluster_meta.loc[cs_i, "Condition"]
                    if condation not in DE:
                        continue
                    expr_val = expr_vals[cs_i] if cs_i in expr_vals else 0
                    expression.append(
                        {"sampleId": cs_i, "condition": condation, "value": expr_val}
                    )
                deg["expression"] = expression

        return degs_groups
    else:
        print(degs_file + " not found")
        return "Error: DEGs file not found"


def get_degs_pseudobulk(dataset, cluster):
    if dataset == "all":
        return "Error: Dataset is not specified."
    else:
        degs_file = os.path.join(
            "backend",
            "datasets",
            dataset,
            "clustermarkers",
            "cluster_pb_DEGs_topN.csv",
        )

    data = {}
    if os.path.exists(degs_file):
        degs_df = pd.read_csv(degs_file, index_col=None, header=0)
        degs_df = degs_df.loc[
            degs_df["cluster_DE"].str.startswith(cluster),
            ["cluster_DE", "gene", "avg_log2FC", "p_val_adj"],
        ]

        ## keep only 4 digits for avg_log2FC
        degs_df["avg_log2FC"] = degs_df["avg_log2FC"].round(4)
        degs_df["p_val_adj"] = degs_df["p_val_adj"].round(4)

        ## split cluster_DE into cluster and DE
        # degs_df["cluster_DE"] = degs_df["cluster_DE"].astype(str)
        # degs_df["cluster"] = [i.split(".")[0] for i in degs_df["cluster_DE"].tolist()]
        degs_df["DE"] = [i.split(".")[1] for i in degs_df["cluster_DE"].tolist()]
        degs_df = degs_df.drop("cluster_DE", axis=1)

        ## group by DE
        degs_groups = (
            degs_df.groupby("DE")
            .apply(lambda g: g.drop("DE", axis=1).to_dict(orient="records"))
            .to_dict()
        )

        ## get gene expression data for each DE,format: [{sampleId: 'sample1', condition: 'PD', value: 8.1053},...]
        sample_calletype_df = pd.read_csv(
            os.path.join(
                "backend",
                "datasets",
                dataset,
                "clustermarkers",
                "metadata_sample_cluster_condition.csv",
            ),
            index_col=0,
            header=0,
        )
        expr_df = pd.read_csv(
            os.path.join(
                "backend",
                "datasets",
                dataset,
                "clustermarkers",
                "pb_expr_matrix_DEGs_topN.csv",
            ),
            index_col=0,
            header=0,
        )
        escaped_cluster = re.escape(cluster)
        pattern = rf"{escaped_cluster}"

        for DE, degs in degs_groups.items():
            for deg in degs:
                expression = []
                gene_name = deg["gene"]
                expr_val_df = expr_df.loc[
                    gene_name, expr_df.columns.str.contains(pattern)
                ]
                samples = expr_val_df.index.tolist()
                for sample_i in samples:
                    condation = sample_calletype_df.loc[sample_i, "condition"]
                    if condation not in DE:
                        continue
                    expr_val = (
                        round(expr_val_df[sample_i], 2)
                        if expr_val_df[sample_i] != 0
                        else expr_val_df[sample_i]
                    )
                    expression.append(
                        {
                            "sampleId": sample_i,
                            "condition": condation,
                            "value": expr_val,
                        }
                    )
                deg["expression"] = expression

        data = degs_groups

        return data
    else:
        print(degs_file + " not found")
        return "Error: DEGs file not found"


def get_umapembedding(dataset):
    if dataset == "all":
        return "Error: Dataset is not specified."

    umap_file = os.path.join("backend", "datasets", dataset, "umap_embeddings_50k.csv")
    if os.path.exists(umap_file):
        data_df = pd.read_csv(umap_file, index_col=None, header=0)
        data = data_df.to_dict(orient="split")
        return data["data"]
    else:
        return "Error: UMAP file not found"


def get_sample_metadata(dataset, samples=["all"], meta="all"):
    if dataset == "all":
        return "Error: Dataset is not specified."

    meta_file = os.path.join("backend", "datasets", dataset, "sample_metadata.csv")
    if os.path.exists(meta_file):
        data_df = pd.read_csv(meta_file, index_col=0, header=0)
        if len(samples) > 0 and samples[0] != "all":
            data_df = data_df.loc[samples, :]
        if meta != "all":
            data_df = data_df[meta]

        data_df.fillna("", inplace=True)
        data = data_df.to_dict(orient="index")
        return data
    else:
        return f"Error: Meta file not found."


def get_metadata_of_sample(dataset, sample="all", features="all"):
    if dataset == "all":
        return "Error: Dataset is not specified."

    meta_file = os.path.join("backend", "datasets", dataset, "cellspot_metadata.csv")
    if os.path.exists(meta_file):
        data_df = pd.read_csv(meta_file, index_col=0, header=0)
        if sample != "all":
            data_df = data_df.loc[data_df.index.str.startswith(sample), :]
        if features != "all":
            data_df = data_df[features]
        cell_metadata = data_df.to_dict(orient="split")

        # get sample metadata
        sample_metadata = get_sample_metadata(dataset, samples=[sample])

        ## get cell_metadata_mapping
        cell_metadata_mapping = get_metadata_mapping(dataset)

        data = {
            "cell_metadata": cell_metadata,
            "cell_metadata_mapping": cell_metadata_mapping,
            "sample_metadata": sample_metadata,
        }
        return data

    else:
        return f"Error: Meta file not found."


def get_metadata_mapping(dataset):
    if dataset == "all":
        return "Error: Dataset is not specified."

    meta_file = os.path.join(
        "backend", "datasets", dataset, "cellspot_meta_mapping.json"
    )
    if os.path.exists(meta_file):
        with open(meta_file, "r") as f:
            data = json.load(f)
        return data
    else:
        return f"Error: cell_metadata_mapping file not found."


def get_all_metadata(dataset, cols=["all"], rows=["all"]):
    if dataset == "all":
        return "Error: Dataset is not specified."

    meta_file = os.path.join("backend", "datasets", dataset, "cellspot_metadata.csv")
    if os.path.exists(meta_file):
        with open(meta_file, "r") as f:
            data_df = pd.read_csv(meta_file, index_col=0, header=0)

            if cols and cols[0] != "all" and cols[0] != "":
                cols = [i for i in cols if i in data_df.columns]
                data_df = data_df.loc[:, cols]

            if rows and rows[0] == "umap":
                uamp_rows = get_umapembedding(dataset)
                data_df = data_df.loc[[r[0] for r in uamp_rows], :]

            data_df = data_df.fillna("")
            cell_metadata = data_df.to_dict(orient="split")

        ## load cell2sample map file (json)
        # cell2sample = get_cell2sample_map(dataset)

        # get sample metadata
        sample_metadata = get_sample_metadata(dataset)

        ## get cell_metadata_mapping
        cell_metadata_mapping = get_metadata_mapping(dataset)

        data = {
            "cell_metadata": cell_metadata,
            "cell_metadata_mapping": cell_metadata_mapping,
            "sample_metadata": sample_metadata,
        }
        return data
    else:
        return "Error: Meta file not found"


def get_expr_data(dataset, gene):
    gene_expr_file = os.path.join(
        "backend", "datasets", dataset, "gene_exprs", gene + ".json"
    )
    if not os.path.exists(gene_expr_file):
        return "Error: Gene expression file not found"

    with open(gene_expr_file, "r") as f:
        cell_expr = json.load(f)

    return cell_expr


def get_pseudoexpr_data(dataset, gene):
    gene_expr_file = os.path.join(
        "backend", "datasets", dataset, "gene_pseudobulk", gene + ".json"
    )
    if not os.path.exists(gene_expr_file):
        return "Error: Pseudobulk expression file not found"

    with open(gene_expr_file, "r") as f:
        sample_expr = json.load(f)

    return sample_expr


def get_visium_coordinates(dataset, sample):
    if dataset == "all":
        return "Error: Dataset is not specified."

    coordinates_folder = os.path.join("backend", "datasets", dataset, "coordinates")
    coordinates_file_ls = os.listdir(coordinates_folder)
    coordinates_file = None
    scales_file = None
    for f in coordinates_file_ls:
        if sample in f and "coordinates" in f:
            coordinates_file = os.path.join(coordinates_folder, f)
        if sample in f and "scalefactors" in f:
            scales_file = os.path.join(coordinates_folder, f)

    if coordinates_file and os.path.exists(coordinates_file):
        with open(coordinates_file, "r") as f:
            coordinates_df = pd.read_csv(coordinates_file, index_col=0, header=0)
            coordinates = coordinates_df.to_dict(orient="index")
    else:
        coordinates = None

    if scales_file and os.path.exists(scales_file):
        with open(scales_file, "r") as f:
            scales = json.load(f)
    else:
        scales = None

    return {"coordinates": coordinates, "scales": scales}



def get_spatial_defaults(dataset):
    if dataset == "all":
        return "Error: Dataset is not specified."

    config_info = get_config_info(dataset)
    if ("Error" not in config_info) and ("spatial_defaults" in config_info):
        data = config_info["spatial_defaults"]
        return data
    else:
        return f"Error: spatial_defaults not found."


def get_bw_data_exists(dataset):
    if dataset == "all":
        return "Error: Dataset is not specified."

    bw_folder = os.path.join("backend", "datasets", dataset,"bigwig")
    if not os.path.exists(bw_folder):
        return False
    return True

@lru_cache(maxsize=128)
def get_cached_bigwig_handle(dataset, celltype, strand=None):
    celltype_mapping_file = os.path.join(
        "backend", "datasets", dataset,"bigwig","celltype_bigwig.json"
    )
    if not os.path.exists(celltype_mapping_file):
        print(celltype_mapping_file + " not found")
        return None

    with open(celltype_mapping_file, "r") as f:
        celltype_mapping = json.load(f)

    entry = celltype_mapping.get(celltype, celltype)

    if isinstance(entry, str):
        celltype_file = entry
    else:
        if strand == "+":
            celltype_file = entry.get("plus")
        elif strand == "-":
            celltype_file = entry.get("minus")
        else:
            celltype_file = entry.get("plus") or entry.get("minus")

        if not celltype_file:
            print(f"No matching bigWig for celltype={celltype}, strand={strand}")
            return None

    bw_path = os.path.join(
        "backend",
        "datasets",
        dataset,
        "bigwig",
        celltype_file,
    )

    try:
        return pyBigWig.open(bw_path)
    except Exception as e:
        print(f"Error: Could not open {bw_path}")
        print(f"{e}")
        return None


def format_signal_value(value, sig_figs=5):
    if value == 0:
        return 0.0

    magnitude = math.floor(math.log10(abs(value))) if value != 0 else 0
    decimal_places = max(0, sig_figs - magnitude - 1)

    return round(value, decimal_places)



def get_region_signal_data(dataset, chromosome, start, end, celltype="", bin_size=1, strand=None):
    if dataset == "all":
        return "Error: Dataset is not specified."

    # check if bigwig is available
    if not get_bw_data_exists(dataset):
        return f"Error: BigWig folder not found"

    try:
        # Read mapping once here to know if we have plus/minus
        celltype_mapping_file = os.path.join(
            "backend", "datasets", dataset, "bigwig", "celltype_bigwig.json"
        )
        if not os.path.exists(celltype_mapping_file):
            print(celltype_mapping_file + " not found")
            return "Error: BigWig mapping file not found"

        with open(celltype_mapping_file, "r") as f:
            celltype_mapping = json.load(f)

        entry = celltype_mapping.get(celltype, celltype)

        if strand in {"+", "-"}:
            bw = get_cached_bigwig_handle(dataset, celltype, strand)
            if bw is None:
                return f"Error: BigWig file not found for the celltype/strand"

            chrom_len = bw.chroms().get(chromosome)
            if chrom_len is None:
                return f"Error: Chromosome not found in the dataset/celltype"

            start = max(0, start)
            end = min(end, chrom_len)
            if start >= end:
                return f"Error: Invalid range input"

            # Binning
            if bin_size > 1:
                num_bins = (end - start) // bin_size
                if (end - start) % bin_size != 0:
                    num_bins += 1

                values = bw.stats(chromosome, start, end, nBins=num_bins, type="mean")
                positions = [start + i * bin_size for i in range(num_bins)]
                values = [v if v is not None else 0 for v in values]

                formatted_values = [
                    format_signal_value(v) if v is not None else 0.0 for v in values
                ]
                return {"position": positions, "value": formatted_values}

            # No binning
            intervals = bw.intervals(chromosome, start, end)
            if not intervals:
                return {"position": [], "value": []}

            positions, values = [], []
            for interval_start, interval_end, value in intervals:
                for pos in range(max(start, interval_start), min(end, interval_end) + 1):
                    positions.append(pos)
                    values.append(format_signal_value(value))

            return {"position": positions, "value": values}

        # If entry is a dict with plus and minus, try to return both
        if isinstance(entry, dict):
            plus_file = entry.get("plus")
            minus_file = entry.get("minus")

            if plus_file and minus_file:
                bw_plus = get_cached_bigwig_handle(dataset, celltype, "+")
                bw_minus = get_cached_bigwig_handle(dataset, celltype, "-")

                if bw_plus is None and bw_minus is None:
                    return "Error: BigWig files not found for both strands"

                def compute_from_bw(bw):
                    if bw is None:
                        return {"position": [], "value": []}

                    chrom_len = bw.chroms().get(chromosome)
                    if chrom_len is None:
                        return {"position": [], "value": []}

                    s = max(0, start)
                    e = min(end, chrom_len)
                    if s >= e:
                        return {"position": [], "value": []}

                    if bin_size > 1:
                        num_bins = (e - s) // bin_size
                        if (e - s) % bin_size != 0:
                            num_bins += 1

                        values = bw.stats(chromosome, s, e, nBins=num_bins, type="mean")
                        positions = [s + i * bin_size for i in range(num_bins)]
                        values = [v if v is not None else 0 for v in values]
                        formatted_values = [format_signal_value(v) for v in values]
                        return {"position": positions, "value": formatted_values}

                    intervals = bw.intervals(chromosome, s, e)
                    if not intervals:
                        return {"position": [], "value": []}

                    positions, values = [], []
                    for interval_start, interval_end, value in intervals:
                        for pos in range(max(s, interval_start), min(e, interval_end) + 1):
                            positions.append(pos)
                            values.append(format_signal_value(value))
                    return {"position": positions, "value": values}

                data_plus = compute_from_bw(bw_plus)
                data_minus = compute_from_bw(bw_minus)

                return {"plus": data_plus, "minus": data_minus}

            # only one of plus/minus exists: fall back to single-track behavior
            chosen_strand = "+" if plus_file else "-"
            bw = get_cached_bigwig_handle(dataset, celltype, chosen_strand)
        else:
            # old string entry
            bw = get_cached_bigwig_handle(dataset, celltype, None)

        if bw is None:
            return f"Error: BigWig file not found for the celltype"

        chrom_len = bw.chroms().get(chromosome)
        if chrom_len is None:
            return f"Error: Chromosome not found in the dataset/celltype"

        start = max(0, start)
        end = min(end, chrom_len)
        if start >= end:
            return f"Error: Invalid range input"

        if bin_size > 1:
            num_bins = (end - start) // bin_size
            if (end - start) % bin_size != 0:
                num_bins += 1

            values = bw.stats(chromosome, start, end, nBins=num_bins, type="mean")
            positions = [start + i * bin_size for i in range(num_bins)]
            values = [v if v is not None else 0 for v in values]

            formatted_values = [
                format_signal_value(v) if v is not None else 0.0 for v in values
            ]
            return {"position": positions, "value": formatted_values}

        intervals = bw.intervals(chromosome, start, end)
        if not intervals:
            return {"position": [], "value": []}

        positions, values = [], []
        for interval_start, interval_end, value in intervals:
            for pos in range(max(start, interval_start), min(end, interval_end) + 1):
                positions.append(pos)
                values.append(format_signal_value(value))

        return {"position": positions, "value": values}

    except Exception as e:
        print(f"Error processing BigWig data: {e}")
        return f"Error processing data: {str(e)}"


def get_gene_annotation_info(dataset):
    if dataset == "all":
        return {}

    ann_file = os.path.join(
        "backend", "datasets", dataset, "gene_locations", "gene_annotations.toml"
    )
    if not os.path.exists(ann_file):
        return {}

    with open(ann_file, "r") as f:
        try:
            cfg = toml.load(f)
        except Exception as e:
            print(f"Error reading {ann_file}: {e}")
            return {}

    return cfg or {}


def get_gencode_version(dataset):
    if dataset == "all":
        return ""
    ann_info = get_gene_annotation_info(dataset)
    return ann_info.get("gene_locations", {}).get("gencode_version", "")


def get_celltype_list(dataset):
    if dataset == "all":
        return "Error: Dataset is not specified."

    celltype_mapping_file = os.path.join(
        "backend", "datasets", dataset,'celltypes', "celltype_parquet.json"
    )
    if not os.path.exists(celltype_mapping_file):
        print(celltype_mapping_file + " not found")
        return f"Error: Celltype mapping file not found for the dataset"

    with open(celltype_mapping_file, "r") as f:
        celltype_mapping = json.load(f)

    return list(celltype_mapping.keys())


def get_bigwig_celltype_list(dataset):
    if dataset == "all":
        return "Error: Dataset is not specified."

    celltype_mapping_file = os.path.join(
        "backend", "datasets", dataset, "bigwig", "celltype_bigwig.json"
    )
    if not os.path.exists(celltype_mapping_file):
        print(celltype_mapping_file + " not found")
        return "Error: BigWig celltype mapping file not found for the dataset"

    with open(celltype_mapping_file, "r") as f:
        celltype_mapping = json.load(f)

    return list(celltype_mapping.keys())


def get_exon_structure_in_chromosome(dataset, chromosome, start, end, max_exons=2000):
    if dataset == "all":
        return "Error: Dataset is not specified."

    # config = get_config_info(dataset)
    # if isinstance(config, str) and config.startswith("Error"):
    #     return "Error: Config info file not found for the specified dataset."

    # annotation_cfg = config.get("annotation", {})
    # bed_rel = annotation_cfg.get("bed_file")
    # if not bed_rel:
    #     return "Error: Annotation BED file not specified for the dataset."
    bed_rel = "transcript_annotation.bed"

    bed_path = os.path.join("backend", "datasets", dataset, bed_rel)
    if not os.path.exists(bed_path):
        print(bed_path + " not found")
        return "Error: Annotation BED file not found for the specified dataset."

    chrom_list = []
    transcript_id_list = []
    gene_id_list = []
    gene_symbol_list = []
    strand_list = []
    biotype_list = []
    tx_start_list = []
    tx_end_list = []
    exon_index_list = []
    exon_start_list = []
    exon_end_list = []
    exon_count_list = []

    total_exons = 0
    truncated = False

    import csv
    with open(bed_path) as f:
      reader = csv.reader(f, delimiter="\t")
      for row in reader:
          if len(row) < 12:
              continue

          bed_chrom = row[0]
          tx_start = int(row[1])
          tx_end = int(row[2])
          name = row[3]
          strand = row[5]
          block_count = int(row[9])
          block_sizes = [int(x) for x in row[10].rstrip(",").split(",")]
          block_starts = [int(x) for x in row[11].rstrip(",").split(",")]

          if bed_chrom != chromosome:
              continue
          if tx_end < start or tx_start > end:
              continue

          parts = name.split("___")
          transcript_id = parts[0] if len(parts) > 0 else name
          gene_id = parts[1] if len(parts) > 1 else ""
          biotype = parts[2] if len(parts) > 2 else ""
          gene_symbol = parts[3] if len(parts) > 3 else gene_id

          for i in range(block_count):
              exon_start = tx_start + block_starts[i]
              exon_end = exon_start + block_sizes[i]
              if exon_end < start or exon_start > end:
                  continue

              chrom_list.append(bed_chrom)
              transcript_id_list.append(transcript_id)
              gene_id_list.append(gene_id)
              gene_symbol_list.append(gene_symbol)
              strand_list.append(strand)
              biotype_list.append(biotype)
              tx_start_list.append(tx_start)
              tx_end_list.append(tx_end)
              exon_index_list.append(i)
              exon_start_list.append(exon_start)
              exon_end_list.append(exon_end)
              exon_count_list.append(block_count)

              total_exons += 1
              if total_exons >= max_exons:
                  truncated = True
                  break

          if truncated:
              break

    if total_exons == 0:
        return "No transcripts found in the region."

    return {
        "chrom": chrom_list,
        "transcript_id": transcript_id_list,
        "gene_id": gene_id_list,
        "gene_symbol": gene_symbol_list,
        "strand": strand_list,
        "biotype": biotype_list,
        "tx_start": tx_start_list,
        "tx_end": tx_end_list,
        "exon_index": exon_index_list,
        "exon_start": exon_start_list,
        "exon_end": exon_end_list,
        "exon_count": exon_count_list,
        "_truncated": truncated,
    }
