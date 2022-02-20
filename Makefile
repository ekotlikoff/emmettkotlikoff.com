run_local_package := github.com/ekotlikoff/emmettkotlikoff.com/cmd/website
webclient_package := github.com/ekotlikoff/gochess/internal/client/web

all:
	GOARCH=wasm GOOS=js go build \
				 -o ~/bin/gochessclient.wasm \
				 -tags webclient $(webclient_package)
	go run $(run_local_package)

configure_ec2:
	./bin/configure_ec2.sh s3

pull_latest_artifacts:
	./bin/download_artifacts.sh

.PHONY: \
	all \
	configure_ec2 \
	pull_latest_artifacts \
