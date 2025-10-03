cd frontend || exit

npm install
nohup npm run dev >> frontend.log 2>&1 &

cd ..

# lsof -i:5173
# kill -9 $(lsof -t -i:5173)

## pid: 600619

## Nginx restart
# sudo nginx reload
#sudo systemctl restart nginx

## Apache restart
# sudo systemctl restart apache2

