package main

import (
	"embed"
	_ "embed"
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strconv"

	"github.com/Ekotlikoff/gochess/pkg/chessserver"
)

type Configuration struct {
	Quiet    bool
	TLS      bool
	CertFile string
	KeyFile  string
}

var (
	//go:embed config.json
	config []byte
	//go:embed static
	webStaticFS embed.FS
)

func main() {
	config := loadConfig()
	if config.Quiet {
		log.SetOutput(ioutil.Discard)
	}
	go chessserver.RunServer()
	gatewayURL, _ := url.Parse("http://localhost:" +
		strconv.Itoa(8000))
	gatewayProxy := httputil.NewSingleHostReverseProxy(gatewayURL)
	mux := http.NewServeMux()
	mux.Handle("/", http.HandlerFunc(handleWebRoot))
	mux.Handle("/chess/", gatewayProxy)
	var err error
	if config.TLS {
		err = http.ListenAndServeTLS(
			":"+strconv.Itoa(443), config.CertFile, config.KeyFile, mux,
		)
	} else {
		err = http.ListenAndServe(":"+strconv.Itoa(80), mux)
	}
	if err != nil {
		log.Fatal(err)
	}
}

func handleWebRoot(w http.ResponseWriter, r *http.Request) {
	r.URL.Path = "/static" + r.URL.Path // This is a hack to get the embedded path
	http.FileServer(http.FS(webStaticFS)).ServeHTTP(w, r)
}

func loadConfig() Configuration {
	configuration := Configuration{}
	err := json.Unmarshal(config, &configuration)
	if err != nil {
		log.Println("ERROR:", err)
	}
	return configuration
}
