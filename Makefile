run_local_package := github.com/ekotlikoff/emmettkotlikoff.com/cmd/website
webclient_package := github.com/ekotlikoff/gochess/internal/client/web

all:
	GOARCH=wasm GOOS=js go build \
				 -o ~/bin/gochessclient.wasm \
				 -tags webclient $(webclient_package)
	go run $(run_local_package)
