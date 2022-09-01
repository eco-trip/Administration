require('cross-fetch/polyfill');
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');

const poolData = {
	UserPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
	ClientId: process.env.AWS_COGNITO_CLIENT_ID
};

const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

const attribute = (key, value) => ({
	Name: key,
	Value: value
});

const setCognitoAttributeList = attributes =>
	Object.entries(attributes).map(element => new AmazonCognitoIdentity.CognitoUserAttribute(attribute(...element)));

const signUp = (email, password, attributes) =>
	new Promise((resolve, reject) => {
		userPool.signUp(email, password, setCognitoAttributeList(attributes), null, (err, result) => {
			if (err) {
				console.log(err);
				return reject(err);
			}

			return resolve(result);
		});
	});

const signIn = (email, password) =>
	new Promise((resolve, reject) => {
		const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
			Username: email,
			Password: password
		});

		const cognitoUser = new AmazonCognitoIdentity.CognitoUser({
			Username: email,
			Pool: userPool
		});

		cognitoUser.authenticateUser(authenticationDetails, {
			onSuccess: result => {
				const token = {
					accessToken: result.getAccessToken().getJwtToken(),
					idToken: result.getIdToken().getJwtToken(),
					refreshToken: result.getRefreshToken().getToken()
				};
				console.log('LOGIN OK', token);
				return resolve(token);
			},

			onFailure: err => {
				console.log('LOGIN ERR', err);
				return reject(err);
			}
		});
	});

module.exports = {
	signUp,
	signIn
};
