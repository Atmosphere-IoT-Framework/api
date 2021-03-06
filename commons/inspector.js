const ItemTypes = require('../types/itemTypes.js');
const authorizator = require('../security/authorization.js');

function shouldBeNumber(item) {
    return item.type == ItemTypes.number;
}

function isNumber(value) {
    if(!value) return true;
    if(!Array.isArray(value)) 
        return (typeof value == 'number');
    else 
        return value.every(number => !number || typeof number == 'number');
}

function areSameDimension(value, item) {
    if(!Array.isArray(value)) return item.dimension == 0;
    else if(!Array.isArray(value[0])) return item.dimension == 1;
    else return item.dimension == 2;
}

function areSameTypes(values, feature) {
    for(let[i, value] of values.entries()) {
        if(!areSameDimension(value, feature.items[i])) {
            if(!Array.isArray(value)) {size=0;}
            else if (!Array.isArray(value[0])) {size=1;}
            else {size=2;}
            return 'No match between sample value size and feature items dimension  (' + size + ' != ' +  feature.items[i].dimension + '). Item no. ' + i + ', value: ' + value + ' [' + feature._id+ ']'; // Franz xxx
        }
        if( (isNumber(value) && !shouldBeNumber(feature.items[i])) ||
            (!isNumber(value) && shouldBeNumber(feature.items[i])) )
            return 'No match between sample value type and feature items type  (' + value + ' not of type ' +  feature.items[i].type + '). Item no. ' + i + ', value: ' + value; // Franz xxx
    }
    return true;
}

exports.areCoherent = function(measurement, feature) {
    const lenght = feature.items.length;
    for (let [i, sample] of measurement.samples.entries()) {
        let values = sample.values;
        //if(feature.items.length!=1 && values.length==1 && values.isMongooseArray)
        //    values = values[0];    
        if(values.length != lenght)
            return 'No match between sample values size and feature items size  (' + values.length + ' != ' +  lenght + '). Item no. ' + i; //Franz XXX
        let result = areSameTypes(values, feature); 
        if(result != true) return result;
    }
    return true;
}

exports.hasSamples = function(measurement) { 
    if (measurement.samples.length == 0) return false;
    return true;
}

exports.hasValues =  function(sample) {
    if (!sample.values || sample.values.length == 0) return false;
    return true;
}

exports.isComputable = async function(feature, items, model) {
    feature = await authorizator.isAvailable(feature, null, model);
    if(!feature) return 'A computation needs an existing feature';
    const item_names = feature.items.map(item => item.name);
    if(items) {
        if(!items.every(item => item_names.includes(item))) return 'A computation has to work on items contained on the feature';
        for(let item of feature.items) { 
            if(item_names.includes(item) && item.type!=ItemTypes.number) return 'A computation needs a numeric feature';
            if(item_names.includes(item) && item.dimension!=0) return 'A computation is valid just on 1D feature';
        }
    }
    else {
        for(let item of feature.items) { 
            if(item.type!=ItemTypes.number) return 'A computation needs a numeric feature';
            if(item.dimension!=0) return 'A computation is valid just on 1D feature';
        }
    } 
    return true;
}
