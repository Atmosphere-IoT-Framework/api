const express = require('express');
const router = express.Router();
const passport = require('passport');

// login
const loginRoute = require('./routes/loginRoute');
router.use('/' + process.env.VERSION + '/login', loginRoute);

// demo
const demoRoute = require('./routes/demoRoute');
router.use('/' + process.env.VERSION + '/demo', passport.authenticate('jwt', {session: false}), demoRoute);

// log
const logRoute = require('./routes/logRoute');
router.use('/' + process.env.VERSION + '/log', passport.authenticate('jwt', {session: false}), logRoute);

// user
const userRoute = require('./routes/userRoute');
router.use('/' + process.env.VERSION + '/users', passport.authenticate('jwt', {session: false}), userRoute);
const usernameRoute = require('./routes/usernameRoute');
router.use('/' + process.env.VERSION + '/usernames', passport.authenticate('jwt', {session: false}), usernameRoute);

// measurement
const measurementsRoute = require('./routes/measurementRoute');
router.use('/' + process.env.VERSION + '/measurements', passport.authenticate('jwt', {session: false}), measurementsRoute);

// tag
const tagsRoute = require('./routes/tagRoute');
router.use('/' + process.env.VERSION + '/tags', passport.authenticate('jwt', {session: false}), tagsRoute);

// device
const devicesRoute = require('./routes/deviceRoute');
router.use('/' + process.env.VERSION + '/devices', passport.authenticate('jwt', {session: false}), devicesRoute);

// script
const scriptsRoute = require('./routes/scriptRoute');
router.use('/' + process.env.VERSION + '/scripts', passport.authenticate('jwt', {session: false}), scriptsRoute);

// thing
const thingsRoute = require('./routes/thingRoute');
router.use('/' + process.env.VERSION + '/things', passport.authenticate('jwt', {session: false}), thingsRoute);

// feature
const featuresRoute = require('./routes/featureRoute');
router.use('/' + process.env.VERSION + '/features', passport.authenticate('jwt', {session: false}), featuresRoute);

// computation
const computationsRoute = require('./routes/computationRoute');
router.use('/' + process.env.VERSION + '/computations', passport.authenticate('jwt', {session: false}), computationsRoute);

// constraint
const constraintsRoute = require('./routes/constraintRoute');
router.use('/' + process.env.VERSION + '/constraints', passport.authenticate('jwt', {session: false}), constraintsRoute);

module.exports = router;
