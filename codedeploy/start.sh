cd /home/ec2-user/app
kill $(ps aux | grep -i app/node_modules/.bin/nodemon | awk '{print $2}')
npm run start:remote
