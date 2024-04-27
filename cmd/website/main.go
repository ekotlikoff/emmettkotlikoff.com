package main

import (
	"embed"
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strconv"

	"github.com/ekotlikoff/gochess/pkg/chessserver"
	"github.com/ekotlikoff/gofit/pkg/fitserver"
)

//go:generate bash ./../../bin/get_version.sh
//go:embed version.txt
var version string
var env string = os.Getenv("ENV")

type Configuration struct {
	Quiet    bool
	TLS      bool
	CertFile string
	KeyFile  string
}

var (
	//go:embed local.json
	localConfig []byte
	//go:embed prod.json
	prodConfig []byte
	//go:embed static
	webStaticFS embed.FS
)

func main() {
	config := loadConfig()
	if config.Quiet {
		log.SetOutput(ioutil.Discard)
	}
	go chessserver.RunServer()
	go fitserver.RunServer()
	chessGatewayURL, _ := url.Parse("http://localhost:" +
		strconv.Itoa(8000))
	fitGatewayURL, _ := url.Parse("http://localhost:" +
		strconv.Itoa(8003))
	chessGatewayProxy := httputil.NewSingleHostReverseProxy(chessGatewayURL)
	fitGatewayProxy := httputil.NewSingleHostReverseProxy(fitGatewayURL)
	mux := http.NewServeMux()
	mux.Handle("/", http.HandlerFunc(handleWebRoot))
	mux.Handle("/info", http.HandlerFunc(handleInfo))
	mux.Handle("/chess/", chessGatewayProxy)
	mux.Handle("/fit/", fitGatewayProxy)
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

func handleInfo(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte(version))
}

func loadConfig() Configuration {
	configuration := Configuration{}
	config := localConfig
	if env == "prod" {
		config = prodConfig
	}
	err := json.Unmarshal(config, &configuration)
	if err != nil {
		log.Println("ERROR:", err)
	}
	return configuration
}
