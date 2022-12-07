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
[ -e ../extension-against-phishing-build-firefox.xpi ] && rm ../extension-against-phishing-build-firefox.xpi
zip -r ../extension-against-phishing-build-firefox.xpi ./* -x manifests/\* manifest.json lib/browser-polyfill.js lib/resemble.js
cd manifests/firefox
zip ../../../extension-against-phishing-build-firefox.xpi manifest.json
cd ../../

echo "Firefox build finished!";

# build Chrome
[ -e ../extension-against-phishing-build-chrome.xpi ] && rm ../extension-against-phishing-build-chrome.xpi
zip -r ../extension-against-phishing-build-chrome.xpi ./* -x manifests/\* manifest.json lib/browser-polyfill.js lib/resemble.js
cd manifests/chromium
zip ../../../extension-against-phishing-build-chrome.xpi manifest.json
cd ../../

cp manifests/chromium/manifest.json manifest.json

echo "Chromium build finished!";


# clean
cd ..

# remove lock
rm extension-building.lock
