const mongoose = require('mongoose');
const UserRoles = require('../types/userRoles.js');
const Fieldmask = mongoose.model('Fieldmask');
const bcrypt = require('bcryptjs');
const UserStatusTypes = require('../types/userStatusTypes.js');

mongoose.Promise = global.Promise;

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, index: true },
    password: { type: String, required: true, select: false },
    email: { type: String, index: true },
    type: { type: String, required: true },
    fieldmask: { type: String, ref: 'Fieldmask' },
    status: { type: String, default: 'enabled' },
    timestamp: {type: Date, default: Date.now, select: false },
    lastmod: {type: Date, default: Date.now, select: false }
});

//userSchema.set('toJSON', { versionKey: false });

userSchema.plugin(require('mongoose-autopopulate'));
userSchema.plugin(require('mongoose-paginate-v2'));

// check if already exists a similar user (idempotent): same useraname
userSchema.pre('save', async function() {
    const res = await this.constructor.findOne( { username: this.username });
    if(res) throw new Error('User validation failed: a user with the same username already exists (' + this.username + ')');                       
});

// check if already exists a similar user (idempotent): same email
userSchema.pre('save', async function() {
    if(this.email){
        const res = await this.constructor.findOne( { email: this.email });
        if(res) throw new Error('User validation failed: a user with the same email already exists (' + this.email + ')');   
    }                    
});

// hash password
userSchema.pre('save', async function() {
    if(process.env.PASSWORDHASH == 'true') this.password = bcrypt.hashSync(this.password, 8);                      
});

// check type
userSchema.pre('save', async function() {
    if(!this.type) throw new Error('User validation failed: please specify the user type');  
    if(!Object.values(UserRoles).includes(this.type)) throw new Error('User validation failed: unrecognized type');                      
});

// check status
userSchema.pre('save', async function() {
    if(this.status) if(!Object.values(UserStatusTypes).includes(this.status)) throw new Error('User validation failed: unrecognized status');                      
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
