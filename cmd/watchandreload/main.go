package main

import (
	"context"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"golang.org/x/mod/semver"
)

var (
	artifactBucket string               = "ekotlikoff-codebuild"
	services       map[Service][]string = map[Service][]string{
		{443, "emmettkotlikoff.com"}: {
			"emmettkotlikoff/gochessclient.wasm",
			"emmettkotlikoff/website",
		},
		// TODO just need to expose version on /info
		// {8003, "chessengine"}: {"rustchess/chess_engine"}
	}
)

var (
	watchInterval          int    = 20
	localArtifactDirectory string = "/home/ekotlikoff/bin"
)

type Service struct {
	Port int
	Name String
}

func main() {
	ticker := time.NewTicker(watchInterval * time.Second)
	quit := make(chan struct{})
	go func() {
		for {
			select {
			case <-ticker.C:
				checkForNewVersions()
			case <-quit:
				ticker.Stop()
				return
			}
		}
	}()
}

func checkForNewVersions() {
	// Every _ seconds list s3 objects, get version, compare to running version
	// (get /info)
	// If version is newer then copy to correct location and restart website,
	// chess engine, and yourself
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		log.Fatal(err)
	}
	client := s3.NewFromConfig(cfg)
	for service, artifacts := range services {
		for _, a := range artifacts {
			listOutput, err := client.ListObjectsV2(context.TODO(), &s3.ListObjectsV2Input{
				Bucket: aws.String(artifactBucket),
				Prefix: aws.String(a),
			})
			if err != nil {
				log.Printf("ListObject error: %v", err)
				return
			}
			if len(listOutput.Contents) != 1 {
				log.Printf("Did not find the expected number of artifacts, found %d", len(listOutput.Contents))
				return
			}
			s3Artifact := listOutput.Contents[0]
			artifactName, artifactVersion := splitArtifactNameAndVersion(aws.ToString(s3Artifact.Key))
			runningVersion := getVersionFromService(service)
			restartNeeded := false
			if !semver.IsValid(artifactVersion) || !semver.IsValid(runningVersion) {
				log.Printf("found invalid semantic versions, %s and/or %s",
					artifactVersion, runningVersion)
				return
			}
			if semver.Compare(artifactVersion, runningVersion) > 0 {
				restartNeeded = true
				// S3 copy artifact
				resp, err := client.GetObject(context.TODO(),
					&s3.GetObjectInput{
						Bucket: listOutput.Name,
						Key:    s3Artifact.Key,
					},
				)
				if err != nil {
					log.Printf("GetObject error: %v", err)
					return
				}
				defer resp.Body.Close()
				outFile, err := os.Create(path.Join(localArtifactDirectory, artifactName))
				defer outFile.Close()
				_, err = io.Copy(outFile, res.Body)
				if err != nil {
					log.Printf("io.Copy error: %v", err)
					return
				}
			}
			if restartNeeded {
				log.Printf("restarting systemd service %s after fetching %v", service.Name, artifacts)
				cmd := exec.Command("systemctl", "restart", service.Name)
				err := cmd.Run()
				if err != nil {
					log.Printf("systemctl restart error: %v", err)
				}
			}
		}
	}
}

func splitArtifactNameAndVersion(n string) string {
	idx := strings.Index(n, "-")
	if idx == -1 || idx+1 >= len(n) {
		return "", fmt.Errorf("getVersionFromName: invalid artifact name %s", n)
	}
	return n[:idx], n[idx+1:]
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
