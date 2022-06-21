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

// Watcher watches artifacts in s3 and downloads/restarts when new ones are
// detected.

var (
	artifactBucket string     = "ekotlikoff-codebuild"
	localPath      string     = "/home/ekotlikoff/bin"
	services       []*Service = []*Service{
		newService("emmettkotlikoff.com", []Artifact{
			newArtifact("website", "emmettkotlikoff/"),
			newArtifact("gochessclient.wasm", "emmettkotlikoff/"),
		}),
		newService("watcher", []Artifact{newArtifact("watcher", "emmettkotlikoff/")}),
		newService("chessengine", []Artifact{newArtifact("chess_engine", "rustchess/")}),
	}
	watchInterval int = 60
)

// Subset of the S3 client interface to make mocking easier
type S3ListAndGetObjectAPI interface {
	ListObjectsV2(ctx context.Context, params *s3.ListObjectsV2Input,
		optFns ...func(*s3.Options)) (*s3.ListObjectsV2Output, error)
	GetObject(ctx context.Context, params *s3.GetObjectInput,
		optFns ...func(*s3.Options)) (*s3.GetObjectOutput, error)
}

type Watcher struct {
	S3Client S3ListAndGetObjectAPI
	Services []*Service
	LMCache  Cacher
	Copier   Copier
}

func newWatcher() Watcher {
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-east-2"))
	if err != nil {
		log.Fatal(err)
	}
	client := s3.NewFromConfig(cfg)
	return Watcher{
		S3Client: client, Services: services, LMCache: LMCache{}, Copier: FCopier{},
	}
}

type Copier interface {
	Copy(Artifact, io.Reader) error
}

type FCopier struct{}

func (_ FCopier) Copy(a Artifact, r io.Reader) error {
	outFile, err := os.Create(a.LocalPath)
	if err != nil {
		log.Print(err)
		return err
	}
	defer outFile.Close()
	_, err = io.Copy(outFile, r)
	if err != nil {
		log.Printf("Copy: %v\n", err)
		return err
	}
	err = os.Chmod(a.LocalPath, 0700)
	if err != nil {
		log.Printf("Copy: %v\n", err)
		return err
	}
	return nil
}

type Cacher interface {
	get(Artifact) (*time.Time, error)
	set(Artifact, *time.Time) error
}

type LMCache struct{}

func (_ LMCache) get(a Artifact) (*time.Time, error) {
	err := os.MkdirAll(path.Dir(a.LastModifiedFile), 0601)
	if err != nil {
		return nil, err
	}
	t := &time.Time{}
	b, err := os.ReadFile(a.LastModifiedFile)
	if err != nil {
		return nil, err
	}
	err = json.Unmarshal(b, t)
	if err != nil {
		return nil, err
	}
	return t, nil
}

func (_ LMCache) set(a Artifact, t *time.Time) error {
	b, err := json.Marshal(t)
	if err != nil {
		return err
	}
	return os.WriteFile(a.LastModifiedFile, b, 0701)
}

type Service struct {
	Name      string
	Artifacts []Artifact
	Remove    func(Artifact) error
	Restart   func() error
}

func newService(name string, artifacts []Artifact) *Service {
	remove := func(a Artifact) error {
		return os.Remove(a.LocalPath)
	}
	restart := func() error {
		cmd := exec.Command("systemctl", "restart", name)
		return cmd.Run()
	}
	return &Service{
		Name:      name,
		Artifacts: artifacts,
		Remove:    remove,
		Restart:   restart,
	}
}

type Artifact struct {
	LastModifiedFile string
	S3Path           string
	LocalPath        string
}

func newArtifact(name, s3Path string) Artifact {
	return Artifact{
		LastModifiedFile: fmt.Sprintf("/var/lib/%s/mtime", name),
		S3Path:           filepath.Join(s3Path, name),
		LocalPath:        filepath.Join(localPath, name),
	}
}

func main() {
	watcher := newWatcher()
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

func (w Watcher) checkForNewVersions() {
	// Get modified ts, compare to cached ts
	// If ts is newer then copy to correct location and restart
	for _, service := range w.Services {
		var anyModified bool
		for _, a := range service.Artifacts {
			s3Artifact, err := w.listArtifact(a.S3Path)
			if err != nil {
				log.Fatal(err)
			}
			lastModified := s3Artifact.LastModified
			currentT, err := w.LMCache.get(a)
			if err != nil {
				log.Println(err)
			}
			if currentT == nil || !(*lastModified).Equal(*currentT) {
				log.Printf("lastModified changed to %s for service=%s artifact=%s\n",
					lastModified.Format(time.Stamp), service.Name, a.S3Path)
				err := service.Remove(a)
				if err != nil {
					log.Fatal(err)
				}
				if w.copyArtifact(a, *s3Artifact.Key) == nil {
					w.LMCache.set(a, lastModified)
					anyModified = true
				} else {
					log.Printf("service %v is now missing a binary: %v\n",
						service.Name, a.LocalPath)
				}
			}
		}
		if anyModified {
			log.Printf("restarting service=%s\n", service.Name)
			err := service.Restart()
			if err != nil {
				log.Printf("restart error: %v\n", err)
			}
		}
	}
}

func (w Watcher) listArtifact(a string) (*types.Object, error) {
	listOutput, err := w.S3Client.ListObjectsV2(context.TODO(), &s3.ListObjectsV2Input{
		Bucket: aws.String(artifactBucket),
		Prefix: aws.String(a),
	})
	if err != nil {
		return nil, fmt.Errorf("listArtifact: %w", err)

	}
	if len(listOutput.Contents) != 1 {
		e := "listArtifact: unexpected len output for %s, found %d"
		return nil, fmt.Errorf(e, a, len(listOutput.Contents))
	}
	return &listOutput.Contents[0], nil
}

func (w Watcher) copyArtifact(artifact Artifact, key string) error {
	log.Printf("fetching %s\n", artifact.S3Path)
	resp, err := w.S3Client.GetObject(context.TODO(),
		&s3.GetObjectInput{
			Bucket: &artifactBucket,
			Key:    &key,
		},
	)
	if err != nil {
		log.Printf("copyArtifact: %v\n", err)
	}
	defer resp.Body.Close()
	return w.Copier.Copy(artifact, resp.Body)
}
