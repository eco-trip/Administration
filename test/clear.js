const { Hotel } = require('../model/Hotel');

exports.clear = async () => {
	try {
		const items = await Hotel.scan().exec();
		await Promise.all(items.map(row => row.delete()));
	} catch (error) {
		console.error('DynamnoDB clear error!', error);
	}
};
