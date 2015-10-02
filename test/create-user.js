import BPromise from "bluebird";
import chai, {expect} from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
import {RpcError} from "lambda-rpc";

chai.use(chaiAsPromised);
chai.use(sinonChai);

import * as createUser from "methods/create-user";

describe("`validateParams`", function () {

    it("throws a 400 `RpcError` if the options body is malformed", function () {
        var troublemaker = function () {
            createUser.validateParams({
                email: "Not an email",
                password: "password",
            });
        };
        expect(troublemaker).to.throw(RpcError);
        expect(troublemaker).to.throw("Bad request parameters");
    });

    it("doesn't throws if the option body is correct", function () {
        var peacemaker = function () {
            createUser.validateParams({
                email: "test@email.com",
                password: "password",
            });
        };
        expect(peacemaker).not.to.throw(RpcError);
    });

});

describe("`ensureEmailUniqueness`", function () {

    var mongodb = {};

    before(function () {
        createUser.__Rewire__("mongodb", mongodb);
    });

    after(function () {
        createUser.__ResetDependency__("mongodb");
    });

    it("throws a 401 `RpcError` if the email already exist in db", function () {
        mongodb.findOne = sinon.stub().returns(BPromise.resolve("Not null"));
        var promise = createUser.ensureEmailUniqueness("test@email.com");
        return expect(promise).to.be.rejectedWith("User already registered");
    });

    it("doesn't throws if the email not exist in db", function () {
        mongodb.findOne = sinon.stub().returns(BPromise.resolve(null));
        var promise = createUser.ensureEmailUniqueness("test@email.com");
        return expect(promise).not.be.rejectedWith("User already registered");
    });

});

describe("`putNewUserInKinesis`", function () {

    var id = "110ec58a-a0f2-4ac4-8393-c866d813b8d1";
    var date = 1443694430074;
    var hash = "$2a$12$JbHoP.KA/Fw1sJOlHVQSq.Rc8i5E/O9JOFfZ6gxvyzNCQO8y79iUy";

    var kinesis = {
        putRecord: sinon.spy()
    };

    var generateUuid = sinon.stub().returns(id);
    var hash = sinon.stub().returns(hash);

    beforeEach(function () {
        kinesis.putRecord.reset();
        createUser.__Rewire__("kinesis", kinesis);
        createUser.__Rewire__("generateUuid", generateUuid);
        createUser.__Rewire__("hash", hash);
        process.env.KINESIS_STREAM_NAME = "stream";
        sinon.stub(Date, "now").returns(date);
    });

    afterEach(function () {
        createUser.__ResetDependency__("kinesis");
        createUser.__ResetDependency__("hash");
        createUser.__ResetDependency__("generateUuid");
        Date.now.restore();
    });

    it("should be called with the correct object", function () {
        var options = {
            email: "test@email.com",
            password: "password"
        };
        var element = {
            emails: [{
                address: options.email,
                verified: false
            }],
            profile: options.profile || {},
            services: {
                email: {
                    verificationTokens: [{
                        address: options.email,
                        token: generateUuid()
                    }]
                },
                password: {
                    bcrypt: hash(options.password)
                },
                resume: {
                    loginTokens: []
                }
            }
        };
        var expectedObject = {
            Data: JSON.stringify({
                id: id,
                data: {element, id},
                timestamp: date,
                type: "element inserted in collection users"
            }),
            PartitionKey: "users",
            StreamName: process.env.KINESIS_STREAM_NAME
        };
        createUser.putNewUserInKinesis(options);
        expect(kinesis.putRecord).to.have.been.calledWith(expectedObject);
    });

});
