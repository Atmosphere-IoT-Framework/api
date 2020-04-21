const mongoose = require('mongoose');
const controller = require('./controller');
const checker = require('./checker');
const ObjectId = require('mongoose').Types.ObjectId;
const User = mongoose.model('User');
const Tag = mongoose.model('Tag');
const Feature = mongoose.model('Feature');
const Thing = mongoose.model('Thing');
const Device = mongoose.model('Device');
const Measurement = mongoose.model('Measurement');
const Authorization = require('../security/authorization.js');
const errors = require('../commons/errors.js');
const bcrypt = require('bcryptjs');

exports.get = async (req, res) => { 
    const select = await checker.whatCanSee(req, res, User)
    const result = await checker.isAdminitrator(req, res); if (result != true) return result;
    return await controller.getResourceList(req, res, '{ "timestamp": "desc" }', select, User); 
};

exports.getusernames = async (req, res) => { 
    return await controller.getResourceList(req, res, '{ "timestamp": "desc" }', '{ "type": "0", "_id": "0" }', User); 
};

exports.getone = async (req, res) => {
    const select = await checker.whatCanSee(req, res, User)
    let result = await checker.isAvailable(req, res, User); if (result != true) return result;
    result = await checker.isAdminitrator(req, res); if (result != true) return result;
    return await controller.getResource(req, res, null, User, select);
};

exports.post = async (req, res) => {
    let result = await checker.isAdminitrator(req, res); if (result != true) return result;
    return await controller.postResource(req, res, User);
};

exports.put = async (req, res) => { 
    const fields = ['password', 'fieldmask'];
    let result = await checker.isAvailable(req, res, User); if (result != true) return result;
    result = await checker.isFilled(req, res, fields); if (result != true) return result;
    result = await checker.isHim(req, res); if (result != true) return result; 
    if(req.body.password) if(process.env.PASSWORDHASH == 'true') req.body.password = bcrypt.hashSync(req.body.password, 8); 
    return await controller.updateResource(req, res, fields, User);
};  

exports.delete = async (req, res) => {
    let result = await checker.isAvailable(req, res, User); if (result != true) return result;
    result = await checker.isAdminitrator(req, res); if (result != true) return result;
    result = await checker.isNotUsed(req, res, Measurement, 'owner'); if (result != true) return result;
    result = await checker.isNotUsed(req, res, Device, 'owner'); if (result != true) return result;
    result = await checker.isNotUsed(req, res, Feature, 'owner'); if (result != true) return result;
    result = await checker.isNotUsed(req, res, Thing, 'owner'); if (result != true) return result;
    result = await checker.isNotUsed(req, res, Tag, 'owner'); if (result != true) return result;
    return await controller.deleteResource(req, res, User);
};

