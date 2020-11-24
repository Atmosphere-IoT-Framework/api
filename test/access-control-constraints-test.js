process.env.ENV = 'test';
process.env.LOG = 'false'; 

// Import test tools
const chai = require('chai');
const chaiHttp = require('chai-http');
const database = require('../database.js');
const Authentication = require('../security/authentication.js');
const server = require('../server.js');
const mongoose = require('mongoose');
const should = chai.should();
const factory = require('../commons/factory.js');
const UserRoles = require('../types/userRoles.js');
const VisibilityTypes = require('../types/visibilityTypes.js'); 
const errors = require('../commons/errors.js');
const RelationshipTypes = require('../types/relationshipTypes.js');
chai.use(chaiHttp);
const before = require('./before-test.js');

// READ LIST
describe('Access read a list of constraints', () => {
    it('it should get all the public/private constraints as admin or analyst', async () => {      
        const user_admin = await factory.createUser("test-username-user", "test-password-user", UserRoles.admin);
        const user_analyst = await factory.createUser("test-username-user", "test-password-user", UserRoles.analyst);
        const owner = await factory.createUser("test-username-owner", "test-password-owner", UserRoles.provider);
        const feature = await factory.createFeature("test-feature", owner);
        const thing_1 = await factory.createThing("test-thing-1", owner);
        const thing_2 = await factory.createThing("test-thing-2", owner);
        const thing_3 = await factory.createThing("test-thing-3", owner);
        const thing_4 = await factory.createThing("test-thing-4", owner);
        const thing_5 = await factory.createThing("test-thing-5", owner);
        const thing_6 = await factory.createThing("test-thing-6", owner);
        const thing_7 = await factory.createThing("test-thing-7", owner);
        const thing_8 = await factory.createThing("test-thing-8", owner);
        const constraint_public_1 = await factory.createConstraint(owner, "Thing", "Feature", thing_1._id, feature._id, RelationshipTypes.dependency, VisibilityTypes.public);
        const constraint_public_2 = await factory.createConstraint(owner, "Thing", "Feature", thing_2._id, feature._id, RelationshipTypes.dependency, VisibilityTypes.public);
        const constraint_public_3 = await factory.createConstraint(owner, "Thing", "Feature", thing_3._id, feature._id, RelationshipTypes.dependency, VisibilityTypes.public);
        const constraint_public_4 = await factory.createConstraint(owner, "Thing", "Feature", thing_4._id, feature._id, RelationshipTypes.dependency, VisibilityTypes.public);
        const constraint_public_5 = await factory.createConstraint(owner, "Thing", "Feature", thing_5._id, feature._id, RelationshipTypes.dependency, VisibilityTypes.public);
        const constraint_private_1 = await factory.createConstraint(owner, "Thing", "Feature", thing_6._id, feature._id, RelationshipTypes.dependency, VisibilityTypes.private);
        const constraint_private_2 = await factory.createConstraint(owner, "Thing", "Feature", thing_7._id, feature._id, RelationshipTypes.dependency, VisibilityTypes.private);
        const constraint_private_3 = await factory.createConstraint(owner, "Thing", "Feature", thing_8._id, feature._id, RelationshipTypes.dependency, VisibilityTypes.private);
        let res = await chai.request(server).keepOpen().get('/v1/constraints/').set("Authorization", await factory.getUserToken(user_admin));
        res.should.have.status(200);
        res.body.docs.should.be.a('array');
        res.body.docs.length.should.be.eql(8);
        res = await chai.request(server).keepOpen().get('/v1/constraints/').set("Authorization", await factory.getUserToken(user_analyst));
        res.should.have.status(200);
        res.body.docs.should.be.a('array');
        res.body.docs.length.should.be.eql(8);
    });

    it('it should get just his own or public constraints as provider', async () => {      
const user_admin = await factory.createUser("test-username-admin", "test-password-admin", UserRoles.admin);
        const user_provider = await factory.createUser("test-username-provider", "test-password-provider", UserRoles.provider);
        const owner = await factory.createUser("test-username-owner", "test-password-owner", UserRoles.provider);
        const feature = await factory.createFeature("test-feature", owner);
        const thing_1 = await factory.createThing("test-thing-1", owner);
        const thing_2 = await factory.createThing("test-thing-2", owner);
        const thing_3 = await factory.createThing("test-thing-3", owner);
        const thing_4 = await factory.createThing("test-thing-4", owner);
        const thing_5 = await factory.createThing("test-thing-5", owner);
        const thing_6 = await factory.createThing("test-thing-6", owner);
        const thing_7 = await factory.createThing("test-thing-7", owner);
        const thing_8 = await factory.createThing("test-thing-8", owner);
        const thing_9 = await factory.createThing("test-thing-9", owner);
        const thing_10 = await factory.createThing("test-thing-10", owner);
        const constraint_public_1 = await factory.createConstraint(owner, "Thing", "Feature", thing_1._id, feature._id, RelationshipTypes.dependency, VisibilityTypes.public);
        const constraint_public_2 = await factory.createConstraint(user_provider, "Thing", "Feature", thing_2._id, feature._id, RelationshipTypes.dependency, VisibilityTypes.public);
        const constraint_public_3 = await factory.createConstraint(owner, "Thing", "Feature", thing_3._id, feature._id, RelationshipTypes.dependency, VisibilityTypes.public);
        const constraint_public_4 = await factory.createConstraint(owner, "Thing", "Feature", thing_4._id, feature._id, RelationshipTypes.dependency, VisibilityTypes.public);
        const constraint_public_5 = await factory.createConstraint(owner, "Thing", "Feature", thing_5._id, feature._id, RelationshipTypes.dependency, VisibilityTypes.public);
        const constraint_private_1 = await factory.createConstraint(owner, "Thing", "Feature", thing_6._id, feature._id, RelationshipTypes.dependency, VisibilityTypes.private);
        const constraint_private_2 = await factory.createConstraint(user_provider, "Thing", "Feature", thing_7._id, feature._id, RelationshipTypes.dependency, VisibilityTypes.private);
        const constraint_private_3 = await factory.createConstraint(user_provider, "Thing", "Feature", thing_8._id, feature._id, RelationshipTypes.dependency, VisibilityTypes.private);
        const constraint_private_4 = await factory.createConstraint(owner, "Thing", "Feature", thing_9._id, feature._id, RelationshipTypes.dependency, VisibilityTypes.private);
        const constraint_private_5 = await factory.createConstraint(owner, "Thing", "Feature", thing_10._id, feature._id, RelationshipTypes.dependency, VisibilityTypes.private);
        let res = await chai.request(server).keepOpen().get('/v1/constraints/').set("Authorization", await factory.getUserToken(user_provider));
        res.should.have.status(200);
        res.body.docs.should.be.a('array');
        res.body.docs.length.should.be.eql(7);
        res = await chai.request(server).keepOpen().get('/v1/constraints/').set("Authorization", await factory.getUserToken(user_admin));
        res.should.have.status(200);
        res.body.docs.should.be.a('array');
        res.body.docs.length.should.be.eql(10);
    });

    it('it should get a filtered list of his own or public measurements as provider', async () => {      
const user_admin = await factory.createUser("test-username-admin", "test-password-admin", UserRoles.admin);
        const user_provider = await factory.createUser("test-username-provider", "test-password-provider", UserRoles.provider);
        const owner = await factory.createUser("test-username-owner", "test-password-owner", UserRoles.provider);
        const feature1 = await factory.createFeature("test-feature-1", owner);
        const feature2 = await factory.createFeature("test-feature-2", owner);
        const feature3 = await factory.createFeature("test-feature-3", owner);
        const tag1 = await factory.createTag("test-tag-1", owner);
        const tag2 = await factory.createTag("test-tag-2", owner);
        const thing_1 = await factory.createThing("test-thing-1-search", owner);
        const thing_2 = await factory.createThing("test-thing-2", owner);
        const thing_3 = await factory.createThing("test-thing-3", owner);
        const thing_4 = await factory.createThing("test-thing-4-search", owner);
        const thing_5 = await factory.createThing("test-thing-5", owner);
        const thing_6 = await factory.createThing("test-thing-6", owner);
        const thing_7 = await factory.createThing("test-thing-7-search", owner);
        const thing_8 = await factory.createThing("test-thing-8", owner);
        const thing_9 = await factory.createThing("test-thing-9-search", owner);
        const thing_10 = await factory.createThing("test-thing-10", owner);
        const constraint_public_1 = await factory.createConstraint(owner, "Thing", "Feature", thing_1._id, feature1._id, RelationshipTypes.dependency, VisibilityTypes.private, [tag1]);
        const constraint_public_2 = await factory.createConstraint(user_provider, "Thing", "Feature", thing_2._id, feature1._id, RelationshipTypes.dependency, VisibilityTypes.public, [tag1]);
        const constraint_public_3 = await factory.createConstraint(owner, "Thing", "Feature", thing_1._id, feature2._id, RelationshipTypes.dependency, VisibilityTypes.public, [tag1]);
        const constraint_public_4 = await factory.createConstraint(owner, "Thing", "Feature", thing_4._id, feature1._id, RelationshipTypes.dependency, VisibilityTypes.public, [tag2]);
        const constraint_public_5 = await factory.createConstraint(owner, "Thing", "Feature", thing_1._id, feature3._id, RelationshipTypes.dependency, VisibilityTypes.public, [tag2]);
        const constraint_private_1 = await factory.createConstraint(owner, "Thing", "Feature", thing_6._id, feature1._id, RelationshipTypes.dependency, VisibilityTypes.private, [tag1]);
        const constraint_private_2 = await factory.createConstraint(user_provider, "Thing", "Feature", thing_7._id, feature1._id, RelationshipTypes.dependency, VisibilityTypes.private, [tag1]);
        const constraint_private_3 = await factory.createConstraint(user_provider, "Thing", "Feature", thing_8._id, feature1._id, RelationshipTypes.dependency, VisibilityTypes.private, [tag1]);
        const constraint_private_4 = await factory.createConstraint(owner, "Thing", "Feature", thing_9._id, feature1._id, RelationshipTypes.dependency, VisibilityTypes.private, [tag2]);
        const constraint_private_5 = await factory.createConstraint(owner, "Thing", "Feature", thing_10._id, feature1._id, RelationshipTypes.dependency, VisibilityTypes.private, [tag1]);
        const filter = '{"element1":"test-thing-1-search","tags": "test-tag-1"}';
        let res = await chai.request(server).keepOpen().get('/v1/constraints?filter=' + filter).set("Authorization", await factory.getUserToken(user_provider));
        res.should.have.status(200);
        res.body.docs.should.be.a('array');
        res.body.docs.length.should.be.eql(1);
        res = await chai.request(server).keepOpen().get('/v1/constraints?filter=' + filter).set("Authorization", await factory.getUserToken(user_admin));
        res.should.have.status(200);
        res.body.docs.should.be.a('array');
        res.body.docs.length.should.be.eql(2);
    });
});
