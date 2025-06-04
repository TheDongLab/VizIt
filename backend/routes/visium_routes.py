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
async def getimage(request:Request):
    print("getimage() called================")
    dataset_id = request.query_params.get("dataset")
    sample = request.query_params.get("sample")

    image_file = os.path.join("backend", "datasets", dataset_id, 'images', 'raw_image_slice1_'+sample + ".png")
    if not os.path.exists(image_file):
        raise HTTPException(status_code=404, detail="Image file not found")

    return FileResponse(image_file, media_type="image/png", filename="sliceImage.png")

@router.get("/getvisiumdefaults")
async def getvisiumdefaults(request:Request):
    print("getvisiumdefaults() called================")
    dataset_id = request.query_params.get("dataset")

    response = get_visium_defaults(dataset_id)
    # print (response)
    if "Error" in response:
        raise HTTPException(status_code=404, detail="Error in getting visium defaults.")
    return response


