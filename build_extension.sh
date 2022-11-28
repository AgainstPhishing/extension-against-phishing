#!/bin/bash
cd browserextension

[ -e ../extension-against-phishing-build.xpi ] && rm ../extension-against-phishing-build.xpi
zip -r ../extension-against-phishing-build.xpi ./*
