### TODO
* [ ] Does the Oscar download actually work?

### Done
* [x] Implement CD
  * [x] Add version into golang binary with embed and generate https://levelup.gitconnected.com/a-better-way-than-ldflags-to-add-a-build-version-to-your-go-binaries-2258ce419d2d
  * [x] Add logic based on ENV environment to use appropriate prod/local config
    file
  * [x] Implement simple agent that, pulls and restarts the binary if a new one is available (caches upload timestamp locally, and if a new one is found download and restart)
* [x] Refactor configs - have a local and prod config
* [x] Upgrade to HTTPS
* [x] Setup script
* [x] CodeBuild integration and artifact storage in s3
