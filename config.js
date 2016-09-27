var config= {};

config.port=8081;
//config.aisUrl='https://ais.swisscom.com/AIS-Server/rs/v1.0/sign';
config.aisUrl='https://ais.pre.swissdigicert.ch/AIS-Server/rs/v1.0/sign';
config.aisUrlPending='https://ais.pre.swissdigicert.ch/AIS-Server/rs/v1.0/pending';
config.claimedIdentity='cartel.ch:OnDemand-Advanced';
config.tokenServiceUrl='https://account-d.docusign.com/oauth/token';
config.redirectUri='https://lab-pki.swisscom.com/dsconnector';
// TODO At the moment the clientId and clientSecret are hard-coded in oauth.js
config.clientId='72c39837-f815-4c60-a86c-b04ab544dad0';
config.clientSecret='3dacc143-d581-4bf8-b433-6b487f33876d';

module.exports=config;
