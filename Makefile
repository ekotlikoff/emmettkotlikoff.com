run_local_package := github.com/ekotlikoff/emmettkotlikoff.com/cmd/website
webclient_package := github.com/ekotlikoff/gochess/internal/client/web

all:
	GOARCH=wasm GOOS=js go build \
				 -o ~/bin/gochessclient.wasm \
				 -tags webclient $(webclient_package)
	go run $(run_local_package)

build_ec2:
	./bin/build_ec2.sh s3

build_ec2_source:
	./bin/build_ec2.sh source

.PHONY: \
	all \
	build_ec2 \
	build_ec2_source \
