# Install VizIt with Docker

Docker builds and connects the backend and frontend, then serves VizIt from one
port.

For a custom setup, see [the manual installation](manual.md).

## 1. Prerequisites

* <b>Docker Engine 24 or higher</b>
* <b>The Docker Compose plugin</b> (`docker compose version` should print a version)

## 2. Get the code

```bash
git clone https://github.com/TheDongLab/VizIt.git
cd VizIt
```

## 3. Configuration

Copy the example configuration.

```bash
cp .env.example .env
```

Common settings:

| Variable                  | Default                  | What it does                                                                                              |
|---------------------------|--------------------------|-----------------------------------------------------------------------------------------------------------|
| `VIZIT_PORT`              | `8080`                   | Port the portal is served on                                                                              |
| `VIZIT_UID` / `VIZIT_GID` | `1000`                   | The id the backend runs as. Match your host user (`id -u`, `id -g`) so it can write your data directories |
| `VIZIT_DATASETS_DIR`      | `./backend/datasets`     | Where your processed datasets live on the host                                                            |
| `VIZIT_SAMPLESHEETS_DIR`  | `./backend/SampleSheets` | Sample sheet CSVs imported by `refresh_db`                                                                |
| `VITE_APP_TITLE`          | *(empty)*                | Portal name shown in the header                                                                           |
| `VITE_HOME_PAGE`          | *(empty)*                | Folder under `frontend/src/pages/` to use as the home page                                                |

!!! warning "`VITE_*` and `VIZIT_UID`/`VIZIT_GID` are build-time settings"
    These values are built into the images. Apply changes by running
    `docker compose up -d --build`. The rest of the file is read at startup and
    only requires `docker compose up -d`.

## 4. Start the container

```bash
docker compose up -d --build
```

The first build may take a few minutes. When it finishes, open
<http://localhost:8080>, or the port set in `VIZIT_PORT`.

Check on the containers at any time with:

```bash
docker compose ps
docker compose logs -f
```

## 5. Add datasets

Put each processed dataset in its own folder under the datasets directory
(`backend/datasets/` unless you changed `VIZIT_DATASETS_DIR`). See
[Prepare dataset](../prepare_dataset/index.md) for how to produce them.

The folder is mounted into the running container, so new datasets appear without
a rebuild. Register them in the metadata database with:

```bash
docker compose exec backend python -m backend.db_utils.refresh_db
```

Reload the page to see the new datasets.

!!! note "Where the database lives"
    The metadata database is kept in a Docker volume (`vizit_db`), not in the
    repository, so it survives rebuilds. `docker compose down` keeps it, while
    `docker compose down -v` deletes it. Run `refresh_db` to recreate it.

## 6. Common commands

```bash
# Stop the app (keeps data)
docker compose down

# Start it again
docker compose up -d

# Update to the latest code and rebuild
git pull
docker compose up -d --build

# Open a shell in the backend container
docker compose exec backend bash
```

## What is running

| Service   | Image                 | Role                                                                                                                                   |
|-----------|-----------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| `backend` | Python 3.12 + Uvicorn | FastAPI service available only to the `web` container                                                                                  |
| `web`     | Nginx                 | Serves the built frontend and proxies `/api`, `/db`, `/qtl`, `/visium`, `/signal`, `/datasetmanage` and `/serverconfig` to the backend |

Nginx serves the frontend and proxies the API from the same origin. Set
`VITE_BACKEND_URL` only when using a separate backend.

## Troubleshooting

??? failure "`unable to open database file`, or permission errors on your datasets"
    The backend's id does not match the owner of your data directories. Set
    `VIZIT_UID` and `VIZIT_GID` in `.env` to your own (`id -u`, `id -g`) and
    rebuild:

    ```bash
    docker compose up -d --build
    ```

    If the database volume already exists, update its owner:

    ```bash
    docker compose run --rm --user root backend chown -R $(id -u):$(id -g) /data
    ```

??? failure "`Bind for 0.0.0.0:8080 failed: port is already allocated`"
    Something else on the host is using that port. Pick another one in `.env`:

    ```bash
    VIZIT_PORT=8081
    ```

    Then `docker compose up -d`. If the `web` container was left in a restart
    loop by the failed start, recreate it: `docker compose up -d --force-recreate web`.

??? failure "The page loads but every request fails"
    Check that the backend is healthy with `docker compose ps`. If it is
    restarting, read `docker compose logs backend` for more error details.

??? failure "Changing a `VITE_*` value did nothing"
    Those are compiled into the frontend bundle, so you need to rebuild with
    `docker compose up -d --build`.
