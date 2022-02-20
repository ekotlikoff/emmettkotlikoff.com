#!/bin/bash

# Downloads artifacts from artifact repo

mkdir -p /home/ekotlikoff/bin/

sudo aws s3 cp s3://ekotlikoff-codebuild/emmettkotlikoff/website /home/ekotlikoff/bin/
sudo aws s3 cp s3://ekotlikoff-codebuild/emmettkotlikoff/gochessclient.wasm /home/ekotlikoff/bin/
sudo aws s3 cp s3://ekotlikoff-codebuild/rustchess/chess_engine /home/ekotlikoff/bin/

sudo chown ekotlikoff:ekotlikoff /home/ekotlikoff/bin/
sudo chmod +x /home/ekotlikoff/bin/

sudo systemctl restart chessengine
sudo systemctl restart emmettkotlikoff.com
