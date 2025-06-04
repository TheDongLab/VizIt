printf "Activating conda environment ...\n"
conda init
conda activate FastAPI || exit

printf "Installing backend dependencies ...\n"
pip install -r backend/requirements.txt

printf "Staring backend ...\n"
nohup python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000 >> backend.log 2>&1 &

printf "Installing frontend dependencies ...\n"
cd frontend || exit
npm install

printf "Staring frontend ...\n"
nohup npm run dev >> ../frontend.log 2>&1 &
cd ..

printf "Done ^_^\n"
