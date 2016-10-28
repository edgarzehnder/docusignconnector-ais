DocuSign Connector for All-In Signing Service.

The connector functionality includes On-Demand signatures with Declaration of Will. Both available step-up methods are supported:
- MobileID
- Password and OTP authentication

NOTE: the connector application server listens on port 8081. Use a proxy to listen on a standard port (e.g 443) and to set-up SSL.

# Deploy on the Swisscom Application Cloud:
Register on the Swisscom Developer / Swisscom Application Cloud and create an Organization and a Space. Further information:
https://developer.swisscom.com/
https://www.swisscom.ch/en/business/enterprise/offer/cloud-data-center-services/paas/application-cloud.html

You can easily push the application in the cloud either using the Web Console or using the Cloud Foundry Command Line Interface. Example for the Swisscom Developer Cloud:
cf login -a https://api.lyra-836.appcloud.swisscom.com -u eva.ramonsalinas@swisscom.com

You will be prompted to provide your password and to choose the organization.

Clone the dsconnector code from the Swisscom git repository and cd into the directory containing the code.

Push the application into the cloud:
cf push dsconnector -m 128M -n ais-docusign

Creating app dsconnector-2 in org ENT-DES-MIO-MSC-AEN / space PROD as eva.ramonsalinas@swisscom.com...
OK

Using route ais-docusign.scapp.io
Binding ais-docusign.scapp.io to dsconnector...
OK

The application will start automatically after the deployment is finished. The connector is now available under https://ais-docusign.scapp.io/dsconnector. This URL must be configured as callback URL on your DocuSign account.

The SSL configuration including the creation and future renewal of the certificate takes place automatically.

# Manual deployment:
Install nodejs. For example, on Ubuntu 16.04 LTS: 
- apt-get update
- apt-get install nodejs

Install npm dependencies:
- npm install

Please take into consideration that the configuration of a proxy or reverse-proxy will be necessary in order for the application to be accesible over the standard port 443. The connector runs locally on port 8081. An easy way to do this is to use caddy:


# Docker Image
A docker image is available for easy integration in a customer environment.

Build the image:
$ docker build -t swisscomtds/dsconnector .

Run the image:
$ docker run -p 8081:8081 -v /myconfigdirectory:/app/config swisscomtds/dsconnector-ais

In 'myconfigdirectory' you need to include:
- A 'ssl' folder with the AIS Account private key and keystore in .pem format (the files must have the extension .pem as well).
- A configuration file 'configuration.js' with the AIS and DS configuration. See config/configuration.js.sample for a configuration sample.


Please take into consideration that for both the manual and the docker ways, the configuration of a reverse-proxy is necessary in order for the application to be accesible over the standard port 443. The connector runs locally on port 8081. An easy way to do this is to use caddy (open-source and easy to install and configure):
https://caddyserver.com



