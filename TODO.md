### TODO
* [ ] Setup script?
  - Make ekotlikoff user
  - install go + git + repo or just the emmettkotlikoff.com binary
  - install certbot and configure: https://certbot.eff.org/lets-encrypt/centosrhel8-other
    - `sudo yum install certbot`
    - `sudo certbot certonly --webroot` or `sudo certbot certonly --standalone` if
      you are ok with stopping your webserver
  - Create systemd service with AmbientCapabilities=CAP_NET_BIND_SERVICE
  - Start systemd service
* [ ] Does the Oscar download actually work?

### Done
* [x] Upgrade to HTTPS
