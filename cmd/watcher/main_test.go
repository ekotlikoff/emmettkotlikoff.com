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
var testArtifact = newArtifact("test_artifact", "s3_path/")
var testArtifact2 = newArtifact("test_artifact2", "s3_path/")
var mockServices = []*Service{newMockService("emmettkotlikoff.com", []Artifact{testArtifact, testArtifact2})}
var artifactTSMap map[Artifact]*time.Time = map[Artifact]*time.Time{
	testArtifact:  nil,
	testArtifact2: nil,
}
var restartShouldError, copyShouldError bool
var restarts, copies int

func newMockService(name string, artifacts []Artifact) *Service {
	remove := func(_ Artifact) error {
		return nil
	}
	restart := func() error {
		if restartShouldError {
			return fmt.Errorf("test restart error")
		}
		restarts++
		return nil
	}
	return &Service{
		Name:      name,
		Artifacts: artifacts,
		Remove:    remove,
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
	copies++
	return nil
}

func newTestWatcher(mc MockS3Client) Watcher {
	return Watcher{
		S3Client: mc, Services: mockServices,
		LMCache: MockCache{}, Copier: MockCopier{},
	}
}

func TestWatcher(t *testing.T) {
	now := time.Now()
	oneHourAgo := now.Add(time.Duration(-1) * time.Hour)
	tests := []struct {
		name               string
		cachedLastModified *time.Time
		remoteLastModified *time.Time
		s3Error            bool
		wantRestarts       []int
		wantCopies         []int
	}{
		{"TestNoRestart", &now, &now, false, []int{0}, []int{0}},
		{"TestRestart", &oneHourAgo, &now, false, []int{1, 0}, []int{2, 0}},
		{"TestRestartFromNil", nil, &now, false, []int{1, 0}, []int{2, 0}},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			for k := range artifactTSMap {
				artifactTSMap[k] = tc.cachedLastModified
			}
			mc := MockS3Client{tc.remoteLastModified, tc.s3Error}
			w := newTestWatcher(mc)
			for i, wantRestart := range tc.wantRestarts {
				t.Run(strconv.Itoa(i), func(t *testing.T) {
					restarts, copies = 0, 0
					w.checkForNewVersions()
					if restarts != wantRestart || copies != tc.wantCopies[i] {
						t.Errorf("expected: restart=%v copies=%v, got restart=%v copies=%v",
							wantRestart, tc.wantCopies[i], restarts, copies)
					}
				})
			}
		})
	}
}
