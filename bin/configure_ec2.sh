#!/bin/bash

# Configures a new amazonlinux2 instance to run the website

sudo useradd ekotlikoff
sudo groupadd emmettkotlikoff_cert
sudo usermod -a -G emmettkotlikoff_cert ekotlikoff
sudo usermod -a -G emmettkotlikoff_cert root
sudo yum install git -y

# Install go https://go.dev/doc/install
wget https://dl.google.com/go/go1.17.5.linux-amd64.tar.gz
sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf go1.17.5.linux-amd64.tar.gz

# Install certbot and configure: https://certbot.eff.org/lets-encrypt/centosrhel8-other / https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/SSL-on-amazon-linux-2.html
sudo wget -r --no-parent -A 'epel-release-*.rpm' https://dl.fedoraproject.org/pub/epel/7/x86_64/Packages/e/
sudo rpm -Uvh dl.fedoraproject.org/pub/epel/7/x86_64/Packages/e/epel-release-*.rpm
sudo yum-config-manager --enable epel*
sudo yum install -y certbot
sudo certbot --non-interactive --agree-tos -d emmettkotlikoff.com -m ekotlikoff@gmail.com certonly --standalone
sudo chgrp -R emmettkotlikoff_cert /etc/letsencrypt/archive
sudo chgrp -R emmettkotlikoff_cert /etc/letsencrypt/live
sudo chmod -R 750 /etc/letsencrypt/live/
sudo chmod -R 750 /etc/letsencrypt/archive/
sudo crontab -l | grep -q 'emmettkotlikoff.com.service' || (sudo crontab -l 2>/dev/null; echo "1 0 1,10,20 * * certbot renew && systemctl restart emmettkotlikoff.com.service") | sudo crontab -

# Create systemd services
sudo cat > /etc/systemd/system/chessengine.service << EOF
[Unit]
Description=chessengine
ConditionPathExists=/home/ekotlikoff/bin/chess_engine
After=network.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=/home/ekotlikoff/
ExecStart=/home/ekotlikoff/bin/chess_engine
AmbientCapabilities=CAP_NET_BIND_SERVICE
Restart=on-failure
RestartSec=15
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=chessengine

[Install]
WantedBy=multi-user.target
EOF

sudo cat > /etc/systemd/system/emmettkotlikoff.com.service << EOF
[Unit]
Description=emmettkotlikoff.com
ConditionPathExists=/home/ekotlikoff/bin/website
After=network.target

[Service]
Type=simple
User=ekotlikoff
Group=emmettkotlikoff_cert
WorkingDirectory=/home/ekotlikoff/
ExecStart=/home/ekotlikoff/bin/website
Environment="ENV=prod"
AmbientCapabilities=CAP_NET_BIND_SERVICE
Restart=on-failure
RestartSec=15
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=gochess

[Install]
WantedBy=multi-user.target
EOF

sudo cat > /etc/systemd/system/watcher.service << EOF
[Unit]
Description=watcher
ConditionPathExists=/home/ekotlikoff/bin/watcher
After=network.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=/home/ekotlikoff/
ExecStart=/home/ekotlikoff/bin/watcher
Restart=on-failure
RestartSec=15
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=watcher

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
