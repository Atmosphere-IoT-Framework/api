const mongoose = require('mongoose');
const manager = require('./manager');
const checker = require('./checker');
const Computation = mongoose.model('Computation');
const ObjectId = require('mongoose').Types.ObjectId;
const Authorization = require('../security/authorization.js');
const errors = require('../commons/errors.js');
const runner = require('../computations/runner.js'); 
const ComputationStatusTypes = require('../types/computationStatusTypes.js'); 

exports.get = async (req, res) => { 
    const restriction = await checker.whatCanRead(req, res);
    return await manager.getResourceList(req, res, '{ "timestamp": "desc" }', '{}', Computation, restriction); 
};

exports.getone = async (req, res) => { 
    let result = await checker.isAvailable(req, res, Computation); if (result != true) return result;
    result = await checker.canRead(req, res); if (result != true) return result;
    return res.status(200).json(req.resource);
};

exports.post = async (req, res) => {
    // TBD
    if(!req.body.code) return res.status(errors.computation_code_required.status).json(errors.computation_code_required.message);
    if(!req.body.filter) return res.status(errors.computation_filter_required.status).json(errors.computation_filter_required.message);
    req.body.owner = req.user._id;
    req.body.status = ComputationStatusTypes.running;
    const filter = JSON.parse(req.body.filter);
    const computation = new Computation(req.body);
    if(runner.go(filter, computation)) {
        await computation.save();
        return res.status(200).json(computation);
    }
    else return res.status(errors.computation_code_unknown.status).json(errors.computation_code_unknown.message);
}

exports.put = async (req, res) => { 
    const fields = ['tags'];
    let result = await checker.isAvailable(req, res, Computation); if (result != true) return result;
    result = await checker.isFilled(req, res, fields); if (result != true) return result;
    result = await checker.canModify(req, res); if (result != true) return result;
    return await manager.updateResource(req, res, fields, Computation);
};

exports.delete = async (req, res) => {
    let result = await checker.isAvailable(req, res, Computation); if (result != true) return result;
    result = await checker.canDelete(req, res); if (result != true) return result;
    return await manager.deleteResource(req, res, Computation);
}
