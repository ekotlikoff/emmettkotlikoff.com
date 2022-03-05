#!/bin/bash

tag=`git describe --tags --abbrev=0 2>/dev/null`
RESULT=$?
if [ "$RESULT" -eq 0 ]; then
  echo "$tag" > version.txt
else
  echo "0.1.0" > version.txt
fi

