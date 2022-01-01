#!/bin/bash
# Configures a new amazonlinux2 instance to run the website. Currently may need
# some human interaction, needs testing.

sudo useradd ekotlikoff
sudo groupadd emmettkotlikoff_cert
sudo usermod -a -G emmettkotlikoff_cert ekotlikoff
sudo usermod -a -G emmettkotlikoff_cert root
sudo yum install git -y

# Install go https://go.dev/doc/install
wget https://dl.google.com/go/go1.17.5.linux-amd64.tar.gz
sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf go1.17.5.linux-amd64.tar.gz

sudo -u ekotlikoff bash -c "/usr/bin/git clone https://github.com/ekotlikoff/emmettkotlikoff.com.git ~/go/src/emmettkotlikoff.com"
# Build the wasm binary TODO look to store in aws codepipeline/codebuild
# (both have a free tier)
sudo -u ekotlikoff bash -c "cd ~/go/src/emmettkotlikoff.com/; GOARCH=wasm GOOS=js /usr/local/go/bin/go build -o ~/bin/gochessclient.wasm -tags webclient github.com/Ekotlikoff/gochess/internal/client/web"
# Build the golang binary TODO look to store in aws codepipeline/codebuild
sudo -u ekotlikoff bash -c "cd ~/go/src/emmettkotlikoff.com/; /usr/local/go/bin/go build github.com/Ekotlikoff/emmettkotlikoff.com/cmd/website"

# Install rust https://www.rust-lang.org/tools/install
sudo -u ekotlikoff bash -c "cd ~; curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y"
sudo yum install gcc -y
sudo -u ekotlikoff bash -c "/usr/bin/git clone https://github.com/ekotlikoff/rustchess.git ~/rust/rustchess"
sudo -u ekotlikoff bash -c "cd ~/rust/rustchess; ~/.cargo/bin/cargo build --release"

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

# Create systemd services
sudo cat > /etc/systemd/system/chessengine.service << EOF
[Unit]
Description=chessengine
ConditionPathExists=/home/ekotlikoff/rust/rustchess/target/release/chess_engine
After=network.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=/home/ekotlikoff/
ExecStart=/home/ekotlikoff/rust/rustchess/target/release/chess_engine
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
ConditionPathExists=/home/ekotlikoff/go/bin/website
After=network.target

[Service]
Type=simple
User=ekotlikoff
Group=emmettkotlikoff_cert
WorkingDirectory=/home/ekotlikoff/
ExecStart=/home/ekotlikoff/go/bin/website
AmbientCapabilities=CAP_NET_BIND_SERVICE
Restart=on-failure
RestartSec=15
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=gochess

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl restart chessengine
sudo systemctl restart emmettkotlikoff.com
