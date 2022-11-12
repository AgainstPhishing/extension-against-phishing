#!/bin/bash
cd browserextension
[ -e ../no-phishing-here.xpi ] && rm ../no-phishing-here.xpi
zip -r ../no-phishing-here.xpi ./*
