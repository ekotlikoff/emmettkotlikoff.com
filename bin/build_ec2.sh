#!/bin/bash

./configure_ec2.sh
if [[ "$1" == "s3" ]]; then
  ./download_artifacts.sh
else
  ./build_from_source.sh
fi

