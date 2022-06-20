website_package := github.com/ekotlikoff/emmettkotlikoff.com/cmd/website
watcher_package := github.com/ekotlikoff/emmettkotlikoff.com/cmd/watcher
webclient_package := github.com/ekotlikoff/gochess/internal/client/web

all:
	GOARCH=wasm GOOS=js go build \
				 -o ~/bin/gochessclient.wasm \
				 -tags webclient $(webclient_package)
	go test $(watcher_package)
	go generate $(website_package)
	go run $(website_package)

configure_ec2:
	./bin/build_ec2.sh s3

pull_latest_artifacts:
	./bin/download_artifacts.sh

.PHONY: \
	all \
	configure_ec2 \
	pull_latest_artifacts \
