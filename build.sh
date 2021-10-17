#!/bin/bash

#  - Make ekotlikoff user `sudo useradd ekotlikoff`
#  - Make emmettkotlikoff_cert group `sudo groupadd emmettkotlikoff_cert`
#  - Add ekotlikoff to the group `sudo usermod -a -G emmettkotlikoff_cert ekotlikoff`
#  - Add root to the group `sudo usermod -a -G emmettkotlikoff_cert root`
#  - install go + git + repo or just the emmettkotlikoff.com binary if already
#    built with go build github.com/Ekotlikoff/emmettkotlikoff.com/cmd/website
#  - install certbot and configure: https://certbot.eff.org/lets-encrypt/centosrhel8-other
#    - `sudo yum install certbot`
#    - `sudo certbot certonly --webroot` or `sudo certbot certonly --standalone` if
#      you are ok with stopping your webserver
#    - Change the relevant letsencrypt dirs to the group `sudo chgrp -R
#      emmettkotlikoff_cert /etc/letsencrypt/archive; sudo chgrp -R emmettkotlikoff_cert /etc/letsencrypt/live`
#    - Change the relevant letsencrypt directory ownership `sudo chmod -R 750
#      /etc/letsencrypt/live/; sudo chmod -R 750 /etc/letsencrypt/archive/`
#  - Create systemd service with AmbientCapabilities=CAP_NET_BIND_SERVICE, e.g.

sudo -u ekotlikoff bash
cd ~/go/src/gochess
git pull origin master
cd ~/go/src/emmettkotlikoff.com
git pull origin master
go build github.com/Ekotlikoff/emmettkotlikoff.com/cmd/website
cd ~/rust/rustchess
git pull origin master
cargo build --release
exit
sudo systemctl restart rustchess
sleep 5
sudo systemctl restart gochess
