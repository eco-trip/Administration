require('cross-fetch/polyfill');
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');

let userPool;

if (process.env.ENV !== 'test') {
	const poolData = {
		UserPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
		ClientId: process.env.AWS_COGNITO_CLIENT_ID
	};

	userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
}

const attribute = (key, value) => ({
	Name: key,
	Value: value
});

const setCognitoAttributeList = attributes =>
	Object.entries(attributes).map(element => new AmazonCognitoIdentity.CognitoUserAttribute(attribute(...element)));

const signUp = (email, password, attributes) =>
	new Promise((resolve, reject) => {
		userPool.signUp(email, password, setCognitoAttributeList(attributes), null, (err, result) => {
			if (err) return reject(err);

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
				const tokens = {
					accessToken: result.getAccessToken().getJwtToken(),
					accessTokenPayload: result.getAccessToken().payload,
					accessTokenExp: result.getAccessToken().getExpiration(),
					refreshToken: result.getRefreshToken().getToken(),
					refreshTokenExp: process.env.RT_EXPIRES_TIME,
					idToken: result.getIdToken().getJwtToken(),
					idTokenPayload: result.getIdToken().payload,
					idTokenExp: result.getIdToken().getExpiration()
				};
				return resolve(tokens);
			},
			onFailure: err => reject(err)
		});
	});

module.exports = {
	signUp,
	signIn
};
