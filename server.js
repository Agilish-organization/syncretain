'use strict';
require('dotenv').config();
const express = require('express');

const app = express();
app.use(express.json());

// Route groups — each file exports an express.Router()
app.use('/', require('./routes/dashboard'));
app.use('/customers', require('./routes/customers'));
app.use('/events', require('./routes/events'));
app.use('/metrics', require('./routes/metrics'));
app.use('/seed', require('./routes/seed'));

const PORT = process.env.PORT || 8080;

/* Only listen when run directly — tests import app without binding a port */
if (require.main === module) {
  app.listen(PORT, () => console.log(`SyncRetain listening on :${PORT}`));
}

module.exports = app;
