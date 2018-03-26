jest.setTimeout(30000);

require('../models/User');

const mongoose = require('mongoose');
const { mongoURI } = require('../config/keys');

mongoose.Promise = global.Promise;
mongoose.connect(mongoURI);