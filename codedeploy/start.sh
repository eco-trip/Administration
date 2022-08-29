cd /home/ec2-user/app
port=${PORT:=3000}
lsof -i :$port -t | xargs kill 2>&1
npm run start:remote
