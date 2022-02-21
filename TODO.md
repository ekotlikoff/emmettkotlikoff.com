### TODO
* [ ] Implement CD
  * [x] Add version into golang binary with embed and generate https://levelup.gitconnected.com/a-better-way-than-ldflags-to-add-a-build-version-to-your-go-binaries-2258ce419d2d
  * [x] Add logic based on ENV environment to use appropriate prod/local config
    file
  * [x] Add version suffix on generated binary in codebuild https://docs.aws.amazon.com/codebuild/latest/userguide/sample-buildspec-artifact-naming.html
  * [x] Expose version on /info
  * [ ] Implement simple agent that checks version of running process and
    compares with binary in s3, pulls and restarts if newer is available
  * [ ] configure codebuild to build on pushes of a tag https://ruddra.com/aws-codebuild-use-git-tags/
* [ ] Refactor configs - have a local and prod config
* [ ] Does the Oscar download actually work?

### Done
* [x] Upgrade to HTTPS
* [x] Setup script
* [x] CodeBuild integration and artifact storage in s3
