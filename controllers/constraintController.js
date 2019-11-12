const mongoose = require('mongoose');
const manager = require('./manager');
const checker = require('./checker');
const Constraint = mongoose.model('Constraint');
const Authorization = require('../security/authorization.js');
const ObjectId = require('mongoose').Types.ObjectId;
const errors = require('../commons/errors.js');

exports.get = async (req, res) => { 
    const restriction = await checker.whatCanRead(req, res);
    return await manager.getResourceList(req, res, '{ "timestamp": "desc" }', '{}', Constraint, restriction); 
};

exports.getone = async (req, res) => { 
    let result = await checker.isAvailable(req, res, Constraint); if (result != true) return result;
    result = await checker.canRead(req, res); if (result != true) return result;
    return res.status(200).json(req.resource);
};

exports.post = async (req, res) => {
    let result = await checker.canCreate(req, res); if (result != true) return result;
    return await manager.postResource(req, res, Constraint);
};

exports.put = async (req, res) => { 
    const fields = ['tags'];
    let result = await checker.isAvailable(req, res, Constraint); if (result != true) return result;
    result = await checker.isFilled(req, res, fields); if (result != true) return result;
    result = await checker.canModify(req, res); if (result != true) return result;
    return await manager.updateResource(req, res, fields, Constraint);
}; 

exports.delete = async (req, res) => {
    let result = await checker.isAvailable(req, res, Constraint); if (result != true) return result;
    result = await checker.canDelete(req, res); if (result != true) return result;
    return await manager.deleteResource(req, res, Constraint);
};

