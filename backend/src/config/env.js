const path = require('path');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const BASE_URL = process.env.BASE_URL || `http://172.16.16.142:${PORT}`;
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

module.exports = {
	PORT,
	HOST,
	BASE_URL,
	UPLOADS_DIR,
};


