package main

import (
	"context"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	"golang.org/x/mod/semver"
)

var (
	artifactBucket string                = "ekotlikoff-codebuild"
	services       map[*Service][]string = map[*Service][]string{
		makeServiceFromSocket("emmettkotlikoff.com",
			"/tmp/emmettkotlikoff_version.sock"): {
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

// Subset of the S3 client interface to make mocking easier
type S3ListAndGetObjectAPI interface {
	ListObjectsV2(ctx context.Context, params *s3.ListObjectsV2Input, optFns ...func(*s3.Options)) (*s3.ListObjectsV2Output, error)
	GetObject(ctx context.Context, params *s3.GetObjectInput, optFns ...func(*s3.Options)) (*s3.GetObjectOutput, error)
}

type WatchAndReload struct {
	S3Client           S3ListAndGetObjectAPI
	ServiceArtifactMap map[*Service][]string
}

type Service struct {
	Name          string
	VersionClient *http.Client
	VersionURL    string
	Restart       func() error
}

func makeServiceFromSocket(name, socket string) *Service {
	client := &http.Client{
		Transport: &http.Transport{
			DialContext: func(_ context.Context, _, _ string) (net.Conn, error) {
				return net.Dial("unix", socket)
			},
		},
	}
	restart := func() error {
		cmd := exec.Command("systemctl", "restart", name)
		return cmd.Run()
	}
	return &Service{name, client, "http://unix", restart}
}

func main() {
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-2"))
	if err != nil {
		log.Fatal(err)
	}
	client := s3.NewFromConfig(cfg)
	watcher := WatchAndReload{client, services}
	ticker := time.NewTicker(time.Duration(watchInterval) * time.Second)
	quit := make(chan struct{})
	for {
		select {
		case <-ticker.C:
			watcher.checkForNewVersions()
		case <-quit:
			ticker.Stop()
			return
		}
	}
}

func (w WatchAndReload) checkForNewVersions() {
	// Every _ seconds list s3 objects, get version, compare to running version
	// (get /info)
	// If version is newer then copy to correct location and restart website,
	// chess engine, and yourself
	for service, artifacts := range services {
		for _, a := range artifacts {
			s3Artifact, err := w.getArtifact(a)
			if err != nil {
				log.Fatal(err)
			}
			aName, aVersion, err := splitArtifactNameAndVersion(aws.ToString(s3Artifact.Key))
			if err != nil {
				log.Fatal(err)
			}
			runningVersion, err := w.getVersionFromService(service)
			if err != nil {
				log.Fatal(err)
			}
			r, err := isRestartNeeded(aVersion, runningVersion)
			if err != nil {
				log.Fatal(err)
			}
			if r {
				w.copyArtifact(aName, *s3Artifact.Key)
				log.Printf("restarting systemd service %s after fetching %v\n", service.Name, artifacts)
				err := service.Restart()
				if err != nil {
					log.Printf("systemctl restart error: %v\n", err)
				}
			}
		}
	}
}

func isRestartNeeded(artifactVersion, runningVersion string) (bool, error) {
	aV := fmt.Sprintf("v%s", artifactVersion)
	rV := fmt.Sprintf("v%s", runningVersion)
	if !semver.IsValid(aV) || !semver.IsValid(rV) {
		e := "isRestartNeeded: invalid semantic version, artifact %s and/or running %s"
		return false, fmt.Errorf(e, artifactVersion, runningVersion)
	}
	return semver.Compare(aV, rV) > 0, nil
}

func (w WatchAndReload) getArtifact(a string) (*types.Object, error) {
	listOutput, err := w.S3Client.ListObjectsV2(context.TODO(), &s3.ListObjectsV2Input{
		Bucket: aws.String(artifactBucket),
		Prefix: aws.String(a),
	})
	if err != nil {
		return nil, fmt.Errorf("getArtifact: %w", err)

	}
	if len(listOutput.Contents) != 1 {
		e := "getArtifact: unexpected len output for %s, found %d"
		return nil, fmt.Errorf(e, a, len(listOutput.Contents))
	}
	return &listOutput.Contents[0], nil
}

func (w WatchAndReload) copyArtifact(name, key string) {
	resp, err := w.S3Client.GetObject(context.TODO(),
		&s3.GetObjectInput{
			Bucket: &artifactBucket,
			Key:    &key,
		},
	)
	if err != nil {
		log.Printf("GetObject error: %v\n", err)
		return
	}
	defer resp.Body.Close()
	outFile, err := os.Create(path.Join(localArtifactDirectory, name))
	defer outFile.Close()
	_, err = io.Copy(outFile, resp.Body)
	if err != nil {
		log.Printf("io.Copy error: %v\n", err)
		return
	}
}

func splitArtifactNameAndVersion(n string) (string, string, error) {
	n = path.Base(n)
	idx := strings.Index(n, "-")
	if idx == -1 || idx+1 >= len(n) {
		e := "splitArtifactNameAndVersion: invalid artifact name %v"
		return "", "", fmt.Errorf(e, n)
	}
	return n[:idx], n[idx+1:], nil
}

func (w WatchAndReload) getVersionFromService(s *Service) (string, error) {
	resp, err := s.VersionClient.Get(s.VersionURL)
	if err != nil {
		return "", fmt.Errorf("getVersionFromService: %w", err)
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("getVersionFromService: %w", err)
	}
	return string(body), nil
}
