#!/bin/sh
ssh root@51.124.110.2<<EOF
   cd uniops-node-services
   git pull origin development
   npm install --production
   pm2 restart all
   exit
EOF