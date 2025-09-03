from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.db import create_db_and_tables
from backend.routes import db_routes, api_routes, visium_routes, qtl_routes, dm_routes,signal_routes

from backend.settings import settings

app = FastAPI(debug=settings.debug)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*"
    ],  # Update with your frontend's URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_event_handler("startup", create_db_and_tables)

@app.get("/")
async def root():
    return "Hello, Welcome to BrainDataPortal!"

app.include_router(db_routes.router, prefix="/db")
app.include_router(api_routes.router, prefix="/api")
app.include_router(visium_routes.router, prefix="/visium")
app.include_router(qtl_routes.router, prefix="/qtl")
app.include_router(signal_routes.router, prefix="/signal")
app.include_router(dm_routes.router, prefix="/datasetmanage")

if __name__ == "__main__":
    import uvicorn
    print("Starting FastAPI server on port", settings.uvicorn_port)
    uvicorn.run(app, host=settings.uvicorn_host, port=settings.uvicorn_port)


# Run FastAPI with uvicorn and --reload: When you run the application using uvicorn, include the --reload flag:
# uvicorn main:app --reload
# --main is the name of your Python file (without the .py extension).
# --app is the name of your FastAPI instance.

# Example Command: If your FastAPI application is in a file named app.py:
# uvicorn main:app --host 0.0.0.0 --port 3000 --reload
# --host 0.0.0.0: Makes the app accessible on your local network.
# --port 3000: Specifies the port number (adjust to your needs).
# --reload: Enables automatic reload when files are modified.


# For production deployments we recommend using gunicorn with the uvicorn worker class.
# gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker

# This starts 4 workers, each capable of handling 2 threads, increasing capacity for concurrent requests.
# gunicorn -w 4 --threads 2 -k uvicorn.workers.UvicornWorker main:app

# nohup python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 4 --proxy-headers >> backend.log 2>&1 &
# nohup python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload --proxy-headers >> backend.log 2>&1 &
