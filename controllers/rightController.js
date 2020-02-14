const mongoose = require('mongoose');
const controller = require('./controller');
const checker = require('./checker');
const Right = mongoose.model('Right');

exports.get = async (req, res) => { 
    const restriction = await checker.whatCanRead(req, res);
    return await controller.getResourceList(req, res, '{ "timestamp": "desc" }', '{}', Right, restriction);
};

exports.getone = async (req, res) => { 
    let result = await checker.isAvailable(req, res, Right); if (result != true) return result;
    result = await checker.canRead(req, res); if (result != true) return result;
    return res.status(200).json(req.resource);
};

exports.post = async (req, res) => {
    let result = await checker.canCreate(req, res); if (result != true) return result;
    return await controller.postResource(req, res, Right);
};

exports.put = async (req, res) => { 
    const fields = ['tags'];
    let result = await checker.isAvailable(req, res, Right); if (result != true) return result;
    result = await checker.isFilled(req, res, fields); if (result != true) return result;
    result = await checker.isOwned(req, res); if (result != true) return result;
    return await controller.updateResource(req, res, fields, Right);
}

exports.delete = async (req, res) => {
    let result = await checker.isAvailable(req, res, Right); if (result != true) return result;
    result = await checker.canDelete(req, res); if (result != true) return result;
    return await controller.deleteResource(req, res, Right);
};