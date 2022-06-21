#!/bin/bash

./bin/configure_ec2.sh
if [[ "$1" == "s3" ]]; then
  ./bin/download_artifacts.sh
else
  ./bin/build_from_source.sh
fi

sudo systemctl restart chessengine
sudo systemctl restart emmettkotlikoff.com
sudo systemctl restart watcher

