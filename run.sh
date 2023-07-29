#!/bin/bash

# forever start /usr/bin/nodemon --exitcrash scr/index.ts

while true; do
    npm start prod
    sleep 0.1
done