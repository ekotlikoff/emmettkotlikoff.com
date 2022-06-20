package main

import (
	"context"
	"fmt"
	"io"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

/*

1. get metadata of s3 object
2. compare metadata against cache
3. either update cache and run function or noop

*/
var now = time.Now()
var testArtifact = newArtifact("test_artifact", "s3_path/", "local_path/")
var mockServices = []*Service{newMockService("emmettkotlikoff.com", []Artifact{testArtifact})}
var artifactTSMap map[Artifact]*time.Time = map[Artifact]*time.Time{testArtifact: nil}
var didRestart, didCopy, restartShouldError, copyShouldError bool

func newMockService(name string, artifacts []Artifact) *Service {
	restart := func() error {
		if restartShouldError {
			return fmt.Errorf("test restart error")
		}
		didRestart = true
		return nil
	}
	return &Service{
		Name:      name,
		Artifacts: artifacts,
		Restart:   restart,
	}
}

type MockCache struct{}

func (_ MockCache) get(artifact Artifact) (*time.Time, error) {
	return artifactTSMap[artifact], nil
}

func (_ MockCache) set(artifact Artifact, time *time.Time) error {
	artifactTSMap[artifact] = time
	return nil
}

type MockS3Client struct {
	t   *time.Time
	err bool
}

func (c MockS3Client) ListObjectsV2(ctx context.Context, params *s3.ListObjectsV2Input, optFns ...func(*s3.Options)) (*s3.ListObjectsV2Output, error) {
	if c.err {
		return nil, fmt.Errorf("test error")
	}
	key := "test_key"
	o := s3.ListObjectsV2Output{
		Contents: []types.Object{{LastModified: c.t, Key: &key}},
	}
	return &o, nil
}

func (c MockS3Client) GetObject(ctx context.Context, params *s3.GetObjectInput, optFns ...func(*s3.Options)) (*s3.GetObjectOutput, error) {
	if c.err {
		return nil, fmt.Errorf("test error")
	}
	o := s3.GetObjectOutput{Body: io.NopCloser(strings.NewReader(""))}
	return &o, nil
}

type MockCopier struct{}

func (_ MockCopier) Copy(a Artifact, r io.Reader) error {
	if copyShouldError {
		return fmt.Errorf("test copy error")
	}
	didCopy = true
	return nil
}

func newTestWatcher(mc MockS3Client) Watcher {
	return Watcher{
		S3Client: mc, Services: mockServices,
		LMCache: MockCache{}, Copier: MockCopier{},
	}
}

func TestWatcher(t *testing.T) {
	tests := []struct {
		name               string
		cachedLastModified *time.Time
		remoteLastModified *time.Time
		s3Error            bool
		want               []bool
	}{
		{"TestNoRestart", &now, &now, false, []bool{false}},
		{"TestRestart", nil, &now, false, []bool{true, false}},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			artifactTSMap[testArtifact] = tc.cachedLastModified
			mc := MockS3Client{tc.remoteLastModified, tc.s3Error}
			w := newTestWatcher(mc)
			for i, want := range tc.want {
				t.Run(strconv.Itoa(i), func(t *testing.T) {
					didRestart = false
					w.checkForNewVersions()
					if didRestart != want {
						t.Errorf("expected: %v, got %v", want, didRestart)
					}
				})
			}
		})
	}
}
