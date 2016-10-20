DocuSign Connector for All-In Signing Service.

The connector functionality includes On-Demand signatures with Declaration of Will. Both available step-up methods are supported:
- MobileID
- Password and OTP authentication

NOTE: the connector application server listens on port 8081. Use a proxy to listen on a standard port (e.g 443) and to set-up SSL.

# Instructions:
Install nodejs. For example, on Ubuntu 16.04 LTS: 
- apt-get update
- apt-get install nodejs

Install npm dependencies:
- npm install

# Docker Image
A docker image is available for easy integration in a customer environment.

Usage:
$ docker run -p 8081:8081 -v /myconfigdirectory:/app/config swisscomtds/dsconnector-ais

In 'myconfigdirectory' you need to include:
- A 'ssl' folder with the AIS Account private key and keystore in .pem format (the files must have the extension .pem as well).
- A configuration file 'configuration.js' with the AIS and DS configuration. See config/configuration.js.sample for a configuration sample.

