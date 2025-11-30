
const fs = require('fs');
const { services } = require('./src/data/services_temp.js');
fs.writeFileSync('data/services.json', JSON.stringify(services, null, 2));
