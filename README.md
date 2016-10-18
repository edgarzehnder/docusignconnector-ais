DocuSign Connector for All-In Signing Service.

# Instructions:
Install nodejs. For example, on Ubuntu 16.04 LTS: 
apt-get update
apt-get install nodejs

Install npm dependencies:
npm install --save date-format express promise request sleep-async

# Docker Image
A docker image is available for easy integration in a customer environment.

Usage:
$ docker run -v /myconfigdirectory:/opt/work/config swisscomtds/dsconnector-ais

In 'myconfigdirectory' you need to include:
- A 'ssl' folder with the AIS Account private key and keystore in .pem format. The files must have the extension .pem.
- A configuration file 'configuration.js' with the AIS and DS configuration. 

See config/configuration.js.sample for a configuration sample.

