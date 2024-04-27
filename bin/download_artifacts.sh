#!/bin/bash

# Downloads artifacts from artifact repo

mkdir -p /home/ekotlikoff/bin/

sudo aws s3 cp s3://ekotlikoff-codebuild/emmettkotlikoff/website /home/ekotlikoff/bin/
sudo aws s3 cp s3://ekotlikoff-codebuild/emmettkotlikoff/gochessclient.wasm /home/ekotlikoff/bin/
sudo aws s3 cp s3://ekotlikoff-codebuild/rustchess/chess_engine /home/ekotlikoff/bin/

sudo chown ekotlikoff:ekotlikoff /home/ekotlikoff/bin/
sudo sh -c 'chown ekotlikoff:ekotlikoff /home/ekotlikoff/bin/*'
sudo sh -c 'chmod +x /home/ekotlikoff/bin/*'
