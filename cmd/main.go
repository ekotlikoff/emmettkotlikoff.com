package main

import (
	"embed"
	_ "embed"
	"io/ioutil"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strconv"

	"github.com/Ekotlikoff/gochess/pkg/chessserver"
)

var (
	quiet bool = false

	//go:embed static
	webStaticFS embed.FS
)

func main() {
	if quiet {
		log.SetOutput(ioutil.Discard)
	}
	go chessserver.RunServer()
	gatewayURL, _ := url.Parse("http://localhost:" +
		strconv.Itoa(8000))
	gatewayProxy := httputil.NewSingleHostReverseProxy(gatewayURL)
	mux := http.NewServeMux()
	mux.Handle("/", http.HandlerFunc(handleWebRoot))
	mux.Handle("/chess/", gatewayProxy)
	http.ListenAndServe(":"+strconv.Itoa(80), mux)
}

func handleWebRoot(w http.ResponseWriter, r *http.Request) {
	r.URL.Path = "/static" + r.URL.Path // This is a hack to get the embedded path
	http.FileServer(http.FS(webStaticFS)).ServeHTTP(w, r)
}
