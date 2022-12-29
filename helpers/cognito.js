require('cross-fetch/polyfill');
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const { ListUsersCommand, CognitoIdentityProviderClient } = require('@aws-sdk/client-cognito-identity-provider');

const {
	ENV,
	AWS_COGNITO_USER_POOL_ID,
	AWS_COGNITO_CLIENT_ID,
	AWS_ACCESS_KEY_ID,
	AWS_SECRET_ACCESS_KEY,
	AWS_DEFAULT_REGION,
	RT_EXPIRES_TIME
} = process.env;

let userPool;
let cognitoClient;

if (ENV !== 'test') {
	const poolData = {
		UserPoolId: AWS_COGNITO_USER_POOL_ID,
		ClientId: AWS_COGNITO_CLIENT_ID
	};

	userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

	if (ENV === 'dev') {
		cognitoClient = new CognitoIdentityProviderClient({
			credentials: {
				accessKeyId: AWS_ACCESS_KEY_ID,
				secretAccessKey: AWS_SECRET_ACCESS_KEY
			},
			region: AWS_DEFAULT_REGION
		});
	} else {
		cognitoClient = new CognitoIdentityProviderClient({
			region: AWS_DEFAULT_REGION
		});
	}
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
					refreshTokenExp: RT_EXPIRES_TIME,
					idToken: result.getIdToken().getJwtToken(),
					idTokenPayload: result.getIdToken().payload,
					idTokenExp: result.getIdToken().getExpiration()
				};
				return resolve(tokens);
			},
			onFailure: err => reject(err)
		});
	});

const search = async userSub => {
	try {
		const command = new ListUsersCommand({
			UserPoolId: AWS_COGNITO_USER_POOL_ID,
			AttributesToGet: ['email', 'name', 'family_name'],
			Filter: `sub = "${userSub}"`,
			Limit: 1
		});

		const res = await cognitoClient.send(command);
		return Promise.resolve(res.Users);
	} catch (e) {
		return Promise.reject(e);
	}
};

module.exports = {
	signUp,
	signIn,
	search
};
