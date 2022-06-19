package main

import (
	"time"
)

/*

1. get metadata of s3 object
2. compare metadata against cache
3. either update cache and run function or noop

*/

var artifactTSMap map[artifact]*time.Time = map[artifact]*time.Time{}

type TestCache struct{}

func (_ TestCache) GetTS(artifact Artifact) *time.Time {
	return artifactTSMap[artifact]
}

func (_ TestCache) SetTS(artifact Artifact, time *time.Time) {
	artifactTSMap[artifact] = time
}

type MockS3API struct{}

// TODO create mocked s3 client
// TODO create mocked cacher
// TODO use the above mocks to verify that the restart function is correctly run
