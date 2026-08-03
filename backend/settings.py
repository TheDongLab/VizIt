from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    uvicorn_port: int = 8000
    uvicorn_host: str = "0.0.0.0"
    debug: bool = False

    allow_remote_datasets: bool = True
    remote_dataset_allowed_hosts: str = ""
    remote_dataset_allow_private: bool = False

    # Resolve the SQLite path from the repository root
    database_url: str = "sqlite:///./backend/bdp_db.db"

    class Config:
        env_file = ".env"  # Load local settings

settings = Settings()
