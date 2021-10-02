run_local_package := github.com/Ekotlikoff/emmettkotlikoff.com/cmd
webclient_package := github.com/Ekotlikoff/gochess/internal/client/web

all:
	GOARCH=wasm GOOS=js go build \
				 -o ~/bin/gochessclient.wasm \
				 -tags webclient $(webclient_package)
	go run $(run_local_package)
