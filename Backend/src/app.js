const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const seekerRoutes = require('./routes/seeker.routes');
const takerRoutes = require('./routes/taker.routes');

const errorHandler = require('./middlewares/error.middleware');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200
}));

app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/seeker', seekerRoutes);
app.use('/api/taker', takerRoutes);

// ❗ errorHandler MUST be a function
app.use(errorHandler);

module.exports = app;
