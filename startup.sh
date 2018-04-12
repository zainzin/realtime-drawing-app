#! /bin/bash

echo "Starting rethinkdb docker container"
docker run --name rethink -v "$PWD:/data" -d -p 28015:28015 -p 8080:8080 --rm rethinkdb

forever=$(npm list -g --depth=0 | grep forever)

if [ -z "${forever}" ]; then
	echo 'Installing forever to run node process in background'
	npm install forever -g
fi

echo "Building client side"
cd client
yarn install
yarn build
mv build ../server/
cd ../server
echo "Building server side"
yarn install
echo "Starting server"
forever start index.js

function cleanup {
	server_pid=$(forever list | grep index.js | awk '{print $7}')
	echo "Terminating server on PID# $server_pid"
	forever stop $server_pid
	echo "Stoping rethinkdb container"
	docker stop rethink
	# TODO option to delete database files under rethinkdb_data
	exit
}

trap cleanup SIGINT

echo "Page is serving on port 8000. Navigate to localhost:8000"
echo "To Terminate press Ctrl+C"

while `true`
do
	sleep 1
done

