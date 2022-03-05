package main

import (
	"embed"
	"encoding/json"
	"io/ioutil"
	"log"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"

	"github.com/ekotlikoff/gochess/pkg/chessserver"
	"golang.org/x/mod/semver"
)

//go:generate bash ./../../bin/get_version.sh
//go:embed version.txt
var version string
var Version string = strings.TrimSpace(version)
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
	gatewayURL, _ := url.Parse("http://localhost:" +
		strconv.Itoa(8000))
	gatewayProxy := httputil.NewSingleHostReverseProxy(gatewayURL)
	mux := http.NewServeMux()
	mux.Handle("/", http.HandlerFunc(handleWebRoot))
	mux.Handle("/chess/", gatewayProxy)
	listenVersion()
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

func listenVersion() {
	l, err := net.Listen("unix", "/tmp/emmettkotlikoff_version.sock")
	if err != nil {
		log.Fatal("listen error:", err)
	}
	go func() {
		http.Serve(l, http.HandlerFunc(handleVersion))
	}()

	sigc := make(chan os.Signal, 1)
	signal.Notify(sigc, os.Interrupt, os.Kill, syscall.SIGTERM)
	go func(c chan os.Signal) {
		sig := <-c
		log.Printf("Caught signal %s: shutting down.", sig)
		l.Close()
		os.Exit(0)
	}(sigc)
}

func handleVersion(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte(Version))
}

func loadConfig() Configuration {
	if !semver.IsValid("v" + Version) {
		log.Fatalf("version %s is not a valid semantic version string\n", Version)
	}
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
