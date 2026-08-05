const mongoose = require('mongoose');
const dns = require('dns');

try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
    console.log('DNS setServers notice:', e.message);
}

module.exports = function () {
    return mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true }, (error) => {
        if (error) {
            console.error('error.stack:-------', error);
        } else {
            console.log('mongoose connected');
        }
    });
};
