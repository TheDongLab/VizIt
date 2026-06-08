from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    uvicorn_port: int = 8000
    uvicorn_host: str = "0.0.0.0"
    debug: bool = False

    allow_remote_datasets: bool = True
    remote_dataset_allowed_hosts: str = ""
    remote_dataset_allow_private: bool = False

    class Config:
        env_file = ".env"  # 可选：已手动 load_dotenv 也可以省略

settings = Settings()
