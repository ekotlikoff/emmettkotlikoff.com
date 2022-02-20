#!/bin/bash

./configure_machine.sh
if [[ "$1" == "s3" ]]; then
  ./download_artifacts.sh
else
  ./build_from_source.sh
fi

