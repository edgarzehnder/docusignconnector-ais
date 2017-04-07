## DocuSign Connector for All-In Signing Service.
The connector functionality includes On-Demand signatures with Declaration of Will. Both available step-up methods are supported:
- MobileID
-  Password and OTP authentication

# What do you need before starting
- An All-In Signing account (claimed-identity provided by Swisscom).
- A DocuSign account linked to the URL where you plan to deploy the connector. Contact DocuSign in order to register the URL and link it to the account.
- The URL where you plan to deploy the connector needs a public IP and a valid DNS Name.

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

Creating app dsconnector in org ENT-DES-MIO-MSC-AEN / space PROD as eva.ramonsalinas@swisscom.com...
OK

Using route ais-docusign.scapp.io
Binding ais-docusign.scapp.io to dsconnector...
OK

The application will start automatically after the deployment is finished. The connector is now available under https://ais-docusign.scapp.io/dsconnector. This URL must be configured as callback URL on your DocuSign account.

The SSL configuration including the creation and future renewal of the certificate takes place automatically.

For the configuration of the application, following environment variables must be set:
- TSP_URL: URL hosting the customer's connector instance.
- INTEGRATOR_KEY: provided by DocuSign and unique for each TSP connector.
- SECRET_KEY: provided by DocuSign and unique for each TSP connector.
- KEY: the private key for authenticating against AIS in PEM format. (*)
- CERT: the public certificate for authenticating against AIS in PEM format. (*)
- CA: the public certificate of the CA issuing the signing certificates (Swisscom Sapphire CA 2). (*)
- CLAIMED_IDENTITY: the claimed identity provided by Swisscom.
- DN_SUFFIX: which fields to include in the Distinguished Name of the on-the-fly generated certificate. 
For example:
DN_SUFFIX='o=My Organization, c=My Country, ou=My Organizational Unit'
- CN_PREFIX (Optional): as common name, the name of the user will be set. A CN_PREFIX can optionally be defined.
- STEP_UP_LANG (Optional): the AIS language (MobileID/PwdOTP texts displayed to the user). If not set, it defaults to English.
- DTBD (Optional): the text displayed on MobileID / ConsentUrl before the name of the file to be signed and a question mark. It not set, the default is 'Do you want to sign'

(*) In order to correctly set the certificate and key values as environment variables for CloudFoundry (new lines must be correctly placed), you can use the following commands:
cf set-env dsconnector CERT "$(openssl x509 -in mycert.pem -inform pem)"
cf set-env dsconnector CA "$(openssl x509 -in myca.pem -inform pem)"
cf set-env dsconnector KEY "$(openssl rsa -in mycert.key -inform pem)"

# Manual deployment:
Install nodejs. For example, on Ubuntu 16.04 LTS: 
- apt-get update
- apt-get install nodejs

Install npm dependencies:
- npm install

The environment variables listed above must be set. If deploying manually you can create a .env file and configure the environment variables inside. These variables are automatically set when the application is started. 

# Docker Image
A docker image is publicily available in Dockerhub for easy integration in a customer environment.

Run the image, mapping the port and setting the environment variables. For example:

$ docker run -p 8081:8081 \
	-e INTEGRATOR_KEY=<your integrator key> \
        -e SECRET_KEY=<your secret key> \
        -e TSP_URL="https://lab-pki.swisscom.com" \
        -e CLAIMED_IDENTITY="AP_ID:OnDemand-Advanced" \
        -e CN_PREFIX="TEST" \
        -e DN_SUFFIX="o=My Organization, c=My Country, ou=My Organizational Unit" \
        -e KEY="$(openssl rsa -in ssl/mycert.key -inform pem)" \
        -e CERT="$(openssl x509 -in ssl/mycert.pem -inform pem)" \
        -e CA="$(openssl x509 -in ssl/myca.pem -inform pem)" \
        swisscomtds/dsconnector

The environment variables listed above must be set for the Docker container, using the -e option.

Please take into consideration that for both the manual and the docker ways, the configuration of a reverse-proxy is necessary in order for the application to be accesible over the standard port 443. The connector runs locally on port 8081. An easy way to do this is to use caddy (open-source and easy to install and configure):
https://caddyserver.com



