conda activate FastAPI
cd backend/
pip3 install -r requirements.txt
cd ../
nohup python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 4 --proxy-headers >> backend.log 2>&1 &
# nohup python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000 --proxy-headers >> backend.log 2>&1 &

# lsof -i:8000
# kill -9 $(lsof -t -i:8000)

# lsof -i:5173
# kill -9 $(lsof -t -i:5173)

## Nginx restart
# sudo nginx reload
#sudo systemctl restart nginx

## Apache restart
# sudo systemctl restart apache2


#ps aux | grep uvicorn

#tar cf - /folder-with-big-files -P | pv -s $(du -sb /folder-with-big-files | awk '{print $1}') | gzip > big-files.tar.gz
#tar -czf - BrainDataPortal | pv -L $(du -sb BrainDataPortal | awk '{print $1}') > BrainDataPortal_pv.tar.gz