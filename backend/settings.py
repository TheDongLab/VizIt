from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    uvicorn_port: int = 8000
    uvicorn_host: str = "0.0.0.0"
    debug: bool = False

    class Config:
        env_file = ".env"  # 可选：已手动 load_dotenv 也可以省略

settings = Settings()
