#!/bin/bash

#  - Make ekotlikoff user `sudo useradd ekotlikoff`
#  - Make emmettkotlikoff_cert group `sudo groupadd emmettkotlikoff_cert`
#  - Add ekotlikoff to the group `sudo usermod -a -G emmettkotlikoff_cert ekotlikoff`
#  - Add root to the group `sudo usermod -a -G emmettkotlikoff_cert root`
#  - install go + git + repo or just the emmettkotlikoff.com binary if already
#    built with go build github.com/ekotlikoff/emmettkotlikoff.com/cmd/website
#  - install certbot and configure: https://certbot.eff.org/lets-encrypt/centosrhel8-other
#    - `sudo yum install certbot`
#    - `sudo certbot certonly --webroot` or `sudo certbot certonly --standalone` if
#      you are ok with stopping your webserver
#    - Change the relevant letsencrypt dirs to the group `sudo chgrp -R
#      emmettkotlikoff_cert /etc/letsencrypt/archive; sudo chgrp -R emmettkotlikoff_cert /etc/letsencrypt/live`
#    - Change the relevant letsencrypt directory ownership `sudo chmod -R 750
#      /etc/letsencrypt/live/; sudo chmod -R 750 /etc/letsencrypt/archive/`
#  - Create systemd service with AmbientCapabilities=CAP_NET_BIND_SERVICE, e.g.
#
#```
#[Unit]
#Description=gochess
#ConditionPathExists=/home/ekotlikoff/go/bin/website
#After=network.target
#
#[Service]
#Type=simple
#User=ekotlikoff
#Group=emmettkotlikoff_cert
#WorkingDirectory=/home/ekotlikoff/
#ExecStart=/home/ekotlikoff/go/bin/website
#AmbientCapabilities=CAP_NET_BIND_SERVICE
#Restart=on-failure
#RestartSec=15
#StandardOutput=syslog
#StandardError=syslog
#SyslogIdentifier=gochess
#
#[Install]
#WantedBy=multi-user.target
#```

cd /home/ekotlikoff/go/src/gochess
git pull --ff-only origin main
cd /home/ekotlikoff/go/src/emmettkotlikoff.com
git pull --ff-only origin main
/usr/local/go/bin/go build github.com/Ekotlikoff/emmettkotlikoff.com/cmd/website
cd /home/ekotlikoff/rust/rustchess
git pull --ff-only origin main
cargo build --release
sudo systemctl restart chessengine
sleep 5
sudo systemctl restart gochess
