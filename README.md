## DocuSign Connector for All-In Signing Service.

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

For the configuration of the application, following environment variables must be set:
KEY: the private key for authenticating against AIS in PEM format.
CERT: the public certificate for authenticating against AIS in PEM format.
CLAIMED_IDENTITY: the claimed identity provided by Swisscom.
DN_SUFFIX: the Distinguished Name of the on-the-fly generated certificate. For example:
	DN_SUFFIX='o=My Organization, c=My Country, ou=My Organizational Unit'
LANGUAGE (Optional): the AIS language. If not set, it defaults to English.
DTBD (Optional): the text displayed on MobileID / ConsentUrl before the name of the file to be signed and a question mark. It not set, the default is 'Do you want to sign'
TOKEN_SERVICE: the DocuSign OAuth Token Service. If not set, the default is the demo environment:
	https://account-d.docusign.com/oauth/token

# Manual deployment:
Install nodejs. For example, on Ubuntu 16.04 LTS: 
- apt-get update
- apt-get install nodejs

Install npm dependencies:
- npm install

The environment variables listed above must be set. If deploying manually, you can just modify the file dev.env provided with the source code. The environment variables included in this file are automatically set when the application is started.

# Docker Image
A docker image is available for easy integration in a customer environment.

Build the image:
$ docker build -t swisscomtds/dsconnector .

Run the image:
$ docker run -p 8081:8081 -v /myconfigdirectory:/app/config swisscomtds/dsconnector-ais 

The environment variables listed above must be set for the Docker container, using the -e option.

Please take into consideration that for both the manual and the docker ways, the configuration of a reverse-proxy is necessary in order for the application to be accesible over the standard port 443. The connector runs locally on port 8081. An easy way to do this is to use caddy (open-source and easy to install and configure):
https://caddyserver.com



