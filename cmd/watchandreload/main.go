package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

var (
	artifactBucket string     = "ekotlikoff-codebuild"
	services       []*Service = []*Service{
		newService("emmettkotlikoff.com", []Artifact{
			newArtifact("website", "emmettkotlikoff/", "/home/ekotlikoff/bin"),
			newArtifact("gochessclient.wasm", "emmettkotlikoff/", "/home/ekotlikoff/bin"),
		}),
		newService("chessengine", []Artifact{
			newArtifact("chess_engine", "rustchess/", "/home/ekotlikoff/bin/chess_engine"),
		}),
	}
)

var (
	watchInterval int = 20
)

// Subset of the S3 client interface to make mocking easier
type S3ListAndGetObjectAPI interface {
	ListObjectsV2(ctx context.Context, params *s3.ListObjectsV2Input, optFns ...func(*s3.Options)) (*s3.ListObjectsV2Output, error)
	GetObject(ctx context.Context, params *s3.GetObjectInput, optFns ...func(*s3.Options)) (*s3.GetObjectOutput, error)
}

type Cacher interface {
	GetTS(artifact Artifact) *time.Time
	SetTS(artifact Artifact, time *time.Time)
}

type TSCache struct{}

func (_ TSCache) GetTS(artifact Artifact) *time.Time {
	err := os.MkdirAll(path.Dir(artifact.LastModifiedTSFile), 0700)
	f, err := os.Open(artifact.LastModifiedTSFile)
	if err != nil {
		log.Fatal(err)
	}
	defer f.Close()
	t := &time.Time{}
	err := json.NewDecoder(f).Decode(t)
	if err != nil {
		log.Fatal(err)
	}
	return t
}

func (_ TSCache) SetTS(artifact Artifact, time *time.Time) {
	f, err := os.OpenFile(artifact.LastModifiedTSFile, os.O_TRUNC, os.ModePerm)
	if err != nil {
		log.Fatal(err)
	}
	defer f.Close()
	err := json.NewEncoder(f).Encode(time)
	if err != nil {
		log.Fatal(err)
	}
}

type WatchAndReload struct {
	S3Client S3ListAndGetObjectAPI
	Services []*Service
	TSCache  Cacher
}

func newWatchAndReload(cacher Cacher) {
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-2"))
	if err != nil {
		log.Fatal(err)
	}
	client := s3.NewFromConfig(cfg)
	return WatchAndReload{client, services, cacher}
}

type Service struct {
	Name      string
	Artifacts []Artifact
	Restart   func() error
}

type Artifact struct {
	LastModifiedTSFile string
	S3Path             string
	LocalPath          string
}

func newService(name string, artifacts []Artifact) *Service {
	restart := func() error {
		cmd := exec.Command("systemctl", "restart", name)
		return cmd.Run()
	}
	return &Service{
		Name:      name,
		Artifacts: artifacts,
		Restart:   restart,
	}
}

func newArtifact(aName, s3Path, localPath string) Artifact {
	return Artifact{
		LastModifiedTSFile: fmt.Sprintf("/var/lib/%s/mtime", name),
		S3Path:             filepath.Join(s3Path, aName),
		LocalPath:          filepath.Join(LocalPath, aName),
	}
}

func main() {
	watcher := newWatchAndReload(TSCache{})
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
	// Get modified ts, compare to cached ts
	// If ts is newer then copy to correct location and restart
	for _, service := range services {
		var anyModified bool
		for _, a := range service.Artifacts {
			s3Artifact, err := w.getArtifact(a.S3Path)
			if err != nil {
				log.Fatal(err)
			}
			currentT := w.TSCache.GetTS(a)
			lastModified := s3Artifact.LastModified
			if !lastModified.Equal(currentT) {
				anyModified = true
				w.copyArtifact(a, *s3Artifact.Key)
				w.TSCache.SetTS(a, lastModified)
			}
		}
		if anyModified {
			log.Printf("restarting systemd service %s\n", service.Name)
			err := service.Restart()
			if err != nil {
				log.Printf("systemctl restart error: %v\n", err)
			}
		}
	}
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

func (w WatchAndReload) copyArtifact(artifact Artifact, key string) {
	log.Printf("fetching %s\n", artifact.S3Path)
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
	outFile, err := os.Create(artifact.LocalPath)
	defer outFile.Close()
	_, err = io.Copy(outFile, resp.Body)
	if err != nil {
		log.Printf("io.Copy error: %v\n", err)
		return
	}
}
