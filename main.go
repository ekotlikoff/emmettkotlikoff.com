package main

import (
	"embed"
	_ "embed"
	"io/ioutil"
	"log"
	"net/http"
	"strconv"
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
	mux := http.NewServeMux()
	mux.Handle("/", http.HandlerFunc(handleWebRoot))
	http.ListenAndServe(":"+strconv.Itoa(888), mux)
}

func handleWebRoot(w http.ResponseWriter, r *http.Request) {
	r.URL.Path = "/static" + r.URL.Path // This is a hack to get the embedded path
	http.FileServer(http.FS(webStaticFS)).ServeHTTP(w, r)
}
