/* eslint-disable no-promise-executor-return */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
const fs = require('fs');
const path = require('path');

const { Forbidden, InvalidRole, ForbiddenResources } = require('./response');

const grantPath = `${__dirname}/../roles/`;
const grants = fs
	.readdirSync(grantPath)
	.filter(file => file.split('.')[1] === 'json')
	.reduce((acc, file) => {
		const f = path.parse(file).name;
		acc[f] = require(`${grantPath}${f}.json`);
		return acc;
	}, {});

exports.check = (role, resources, action) =>
	new Promise((resolve, reject) => {
		if (!grants[role]) return reject(InvalidRole());
		if (!grants[role][resources]) return reject(ForbiddenResources());

		const permit = Object.keys(grants[role][resources]).find(k => k.indexOf(action) >= 0);

		if (permit) {
			const value = permit.split(':');

			if (action.indexOf(':') >= 0) {
				const actionSplit = action.split(':');
				if (actionSplit[0] !== value[0] && actionSplit[1] !== value[1]) return reject(Forbidden());
			}

			const ret = {
				action: value[0],
				type: value[1],
				attributes: grants[role][resources][permit]
			};

			return resolve(ret);
		}

		return reject(Forbidden());
	});
