package main

import (
	"context"
	"fmt"
	"io"
	"log"
	"net"
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
		{"emmettkotlikoff.com", "/tmp/emmettkotlikoff_version.sock"}: {
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
	Name   string
	Socket string
}

func main() {
	ticker := time.NewTicker(time.Duration(watchInterval) * time.Second)
	quit := make(chan struct{})
	for {
		select {
		case <-ticker.C:
			checkForNewVersions()
		case <-quit:
			ticker.Stop()
			return
		}
	}
}

func checkForNewVersions() {
	// Every _ seconds list s3 objects, get version, compare to running version
	// (get /info)
	// If version is newer then copy to correct location and restart website,
	// chess engine, and yourself
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-2"))
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
				log.Printf("ListObject error: %v\n", err)
				return
			}
			if len(listOutput.Contents) != 1 {
				log.Printf("Did not find the expected number of artifacts, found %d\n", len(listOutput.Contents))
				return
			}
			s3Artifact := listOutput.Contents[0]
			artifactName, artifactVersion, err := splitArtifactNameAndVersion(aws.ToString(s3Artifact.Key))
			if err != nil {
				log.Printf("splitArtifactNameAndVersion error: %v\n", err)
				return
			}
			runningVersion := getVersionFromService(service)
			restartNeeded := false
			if !semver.IsValid(artifactVersion) || !semver.IsValid(runningVersion) {
				log.Printf("found invalid semantic versions, %s and/or %s\n",
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
					log.Printf("GetObject error: %v\n", err)
					return
				}
				defer resp.Body.Close()
				outFile, err := os.Create(path.Join(localArtifactDirectory, artifactName))
				defer outFile.Close()
				_, err = io.Copy(outFile, resp.Body)
				if err != nil {
					log.Printf("io.Copy error: %v\n", err)
					return
				}
			}
			if restartNeeded {
				log.Printf("restarting systemd service %s after fetching %v\n", service.Name, artifacts)
				cmd := exec.Command("systemctl", "restart", service.Name)
				err := cmd.Run()
				if err != nil {
					log.Printf("systemctl restart error: %v\n", err)
				}
			}
		}
	}
}

func splitArtifactNameAndVersion(n string) (string, string, error) {
	idx := strings.Index(n, "-")
	if idx == -1 || idx+1 >= len(n) {
		return "", "", fmt.Errorf("getVersionFromName: invalid artifact name %v", n)
	}
	return n[:idx], n[idx+1:], nil
}

func getVersionFromService(s Service) string {
	c, err := net.Dial("unix", s.Socket)
	if err != nil {
		log.Fatal(err)
	}
	defer c.Close()
	buf := make([]byte, 100)
	n, err := c.Read(buf[:])
	if err != nil {
		log.Fatal(err)
	}
	return string(buf[0:n])
}
