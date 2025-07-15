printf "Activating conda environment ...\n"
conda init
conda activate FastAPI || exit

printf "Installing backend dependencies ...\n"
pip install -r backend/requirements.txt

printf "Staring backend ...\n"
bash run_backend.sh

printf "Installing frontend dependencies ...\n"
bash run_frontend.sh

printf "Done ^_^\n"
