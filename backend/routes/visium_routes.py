from fastapi import APIRouter, HTTPException
from fastapi import Request
from fastapi.responses import JSONResponse, FileResponse


from backend.db import SessionDep
from backend.db_utils.crud import *
from backend.funcs.get_data import *

import os

router = APIRouter()

@router.get("/")
async def read_root():
    return {"Message": "Hello Visium."}


@router.get("/getcoordinates")
async def getcoordinates(request:Request):
    print("getcoordinates() called================")
    dataset_id = request.query_params.get("dataset")
    sample = request.query_params.get("sample")
    results = get_visium_coordinates(dataset_id, sample)

    # if "Error" in results:
    #     raise HTTPException(status_code=404, detail="Error in getting coordinates.")

    response = {"coordinates": results["coordinates"], "scales": results["scales"]}
    return response


@router.get("/getimage")
async def getimage(request: Request):
    print("getimage() called================")
    dataset_id = request.query_params.get("dataset")
    sample = request.query_params.get("sample")

    # Validate required parameters
    if not dataset_id or not sample:
        return JSONResponse(status_code=400,content={"success": False, "message": "Missing dataset or sample parameter"})

    try:
        image_folder = os.path.join("backend", "datasets", dataset_id, 'images')
        if not os.path.exists(image_folder):
            return JSONResponse(status_code=404,content={"success": False, "message": "Image folder not found"})

        image_file_ls = os.listdir(image_folder)
        # More robust filtering - exact match or contains
        matching_files = [f for f in image_file_ls if sample in f]
        if not matching_files:
            return JSONResponse(status_code=404,content={"success": False, "message": f"No image found for sample"})

        # Use the first matching file
        image_file = os.path.join(image_folder, matching_files[0])
        if not os.path.exists(image_file):
            return JSONResponse(status_code=404,content={"success": False, "message": "Image file not found"})

        # Determine media type based on file extension
        file_extension = os.path.splitext(image_file)[1].lower()
        media_types = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.tiff': 'image/tiff',
            '.tif': 'image/tiff',
        }
        media_type = media_types.get(file_extension, 'image/png')
        return FileResponse(image_file,media_type=media_type,filename=os.path.basename(image_file))

    except Exception as e:
        print(f"Error serving image: {e}")
        return JSONResponse(status_code=500,content={"success": False, "message": "Internal server error"})

@router.get("/getvisiumdefaults")
async def getvisiumdefaults(request:Request):
    print("getvisiumdefaults() called================")
    dataset_id = request.query_params.get("dataset")

    response = get_spatial_defaults(dataset_id)
    # print (response)
    if "Error" in response:
        raise HTTPException(status_code=404, detail="Error in getting visium defaults.")
    return response


