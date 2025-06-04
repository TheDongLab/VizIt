#!/bin/bash

set -e

function check_error() {
  if [ $? -ne 0 ]; then
    printf "\n❌ Error: $1\n"
    exit 1
  fi
}

printf "Activating conda environment ...\n"
conda init bash
conda activate FastAPI || { echo "❌ Failed to activate conda environment 'FastAPI'"; exit 1; }

printf "Installing backend dependencies ...\n"
pip install -r backend/requirements.txt
check_error "Failed to install backend dependencies"

printf "Starting backend ...\n"
nohup python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000 >> backend.log 2>&1 &
if [ $? -ne 0 ]; then
  echo "❌ Failed to start backend server"
  exit 1
fi

printf "Installing frontend dependencies ...\n"
cd frontend || { echo "❌ Could not enter frontend directory"; exit 1; }

npm install
check_error "Failed to install frontend dependencies"

printf "Starting frontend ...\n"
nohup npm run dev >> ../frontend.log 2>&1 &
if [ $? -ne 0 ]; then
  echo "❌ Failed to start frontend server"
  exit 1
fi

cd ..

printf "✅ Done ^_^\n"
