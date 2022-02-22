package main

import (
	"context"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"golang.org/x/mod/semver"
)

var artifact_bucket string = "ekotlikoff-codebuild"
var artifacts map[string]string = map[string]string{
	"emmettkotlikoff/gochessclient.wasm": Service{443},
	"emmettkotlikoff/website":            Service{443},
	// TODO just need to expose version on /info
	//"rustchess/chess_engine":           Service{"chessengine.service", 8003",
}

type Service struct {
	Port int
}

func main() {
	// Every _ seconds list s3 objects, get version, compare to running version
	// (get /info)
	// If version is newer then copy to correct location and restart website,
	// chess engine, and yourself
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		log.Fatal(err)
	}
	client := s3.NewFromConfig(cfg)

	for a, service := range artifacts {
		output, err := client.ListObjectsV2(context.TODO(), &s3.ListObjectsV2Input{
			Bucket: aws.String(artifact_bucket),
			Prefix: aws.String(a),
		})
		if err != nil {
			log.Fatal(err)
		}
		if len(output.Contents) != 1 {
			log.Println("Did not find the expected number of artifacts, found", len(output.Contents))
		} else {
			artifactVersion := getVersionFromName(aws.ToString(object.Key))
			runningVersion := getVersionFromService(service)
			if !semver.IsValid(artifactVersion) || !semver.IsValid(runningVersion) {
				log.Fatal("found invalid semantic versions, %s and/or %s",
					artifactVersion, runningVersion)
			}
			if semver.Compare(artifactVersion, runningVersion) > 0 {
				// S3 copy artifact
				// TODO Restart service or watcher systemd service for each service that
				// restarts it on change to the binary https://superuser.com/questions/1171751/restart-systemd-service-automatically-whenever-a-directory-changes-any-file-ins
			}
		}
	}
}

func getVersionFromName(n string) string {
	idx := strings.Index(n, "-")
	if idx == -1 {
		return "", fmt.Errorf("getVersionFromName: invalid artifact name %s", n)
	}
	return n[idx+1:]
}

func getVersionFromService(s Service) string {
	resp, err := http.Get(fmt.Sprintf("https://localhost:%d/info", s.Port))
	if err != nil {
		log.Fatal(err)
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Fatal(err)
	}
	return string(body)
}
