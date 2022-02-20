#!/bin/bash

# Builds binaries from source

sudo -u ekotlikoff bash -c "/usr/bin/git clone https://github.com/ekotlikoff/emmettkotlikoff.com.git ~/go/src/emmettkotlikoff.com"
# Build the wasm binary TODO look to store in aws codepipeline/codebuild
# (both have a free tier)
sudo -u ekotlikoff bash -c "cd ~/go/src/emmettkotlikoff.com/; GOARCH=wasm GOOS=js /usr/local/go/bin/go build -o ~/bin/gochessclient.wasm -tags webclient github.com/ekotlikoff/gochess/internal/client/web"
# Build the golang binary TODO look to store in aws codepipeline/codebuild
sudo -u ekotlikoff bash -c "cd ~/go/src/emmettkotlikoff.com/; /usr/local/go/bin/go build -o ~/bin/website github.com/ekotlikoff/emmettkotlikoff.com/cmd/website"

# Install rust https://www.rust-lang.org/tools/install
sudo -u ekotlikoff bash -c "cd ~; curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y"
sudo yum install gcc -y
sudo -u ekotlikoff bash -c "/usr/bin/git clone https://github.com/ekotlikoff/rustchess.git ~/rust/rustchess"
sudo -u ekotlikoff bash -c "cd ~/rust/rustchess; ~/.cargo/bin/cargo build --out-dir ~/bin --release"

sudo systemctl restart chessengine
sudo systemctl restart emmettkotlikoff.com
