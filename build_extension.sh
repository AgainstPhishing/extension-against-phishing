#!/bin/bash

{
if [ -f extension-building.lock ]; then
    echo "Building locked! Aborted..."
    exit 0
fi
}
# Add lock
touch extension-building.lock

# Prepare
cd src

# build Firefox
[ -e ../build/extension-against-phishing-build-firefox.xpi ] && rm ../build/extension-against-phishing-build-firefox.xpi
zip -r ../build/extension-against-phishing-build-firefox.xpi ./* -x manifests/\* manifest.json
cd manifests/firefox
zip ../../../build/extension-against-phishing-build-firefox.xpi manifest.json
cd ../../

echo "Firefox build finished!";

# build Chrome
[ -e ../build/extension-against-phishing-build-chrome.zip ] && rm ../build/extension-against-phishing-build-chrome.zip
zip -r ../build/extension-against-phishing-build-chrome.zip ./* -x manifests/\* manifest.json
cd manifests/chromium
zip ../../../build/extension-against-phishing-build-chrome.zip manifest.json
cd ../../

cp manifests/chromium/manifest.json manifest.json

echo "Chromium build finished!";


# clean
cd ..

# remove lock
rm extension-building.lock
