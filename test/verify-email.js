import BPromise from "bluebird";
import chai, {expect} from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
import {RpcError} from "lambda-rpc";

chai.use(chaiAsPromised);
chai.use(sinonChai);

import * as verifyEmail from "methods/verify-email";

describe("`searchToken`", function () {

    var token = "6790ac7c-24ac-4f98-8464-42f6d98a53ae";
    var hash = "$2a$12$JbHoP.KA/Fw1sJOlHVQSq.Rc8i5E/O9JOFfZ6gxvyzNCQO8y79iUy";
    var mongodb = {};
    var user = {
        emails: [{
            address: "test@email.com",
            verified: false
        }],
        profile: {},
        services: {
            email: {
                verificationTokens: [{
                    address: "test@email.com",
                    token: token
                }]
            },
            password: {
                bcrypt: hash
            },
            resume: {
                loginTokens: []
            }
        }
    };

    before(function () {
        verifyEmail.__Rewire__("mongodb", mongodb);
    });

    after(function () {
        verifyEmail.__ResetDependency__("mongodb");
    });

    it("should return an user if there is a correspondent validationToken in mongodb", function () {
        mongodb.findOne = sinon.stub().returns(BPromise.resolve(user));
        var promise = verifyEmail.searchToken(token);
        return expect(promise).to.become(user);
    });

    it("should return null if there isn't a correspondent validationToken in mongodb", function () {
        mongodb.findOne = sinon.stub().returns(BPromise.resolve(null));
        var promise = verifyEmail.searchToken(token);
        return expect(promise).to.become(null);
    });

});

describe("`emailVerification`", function () {

    var token = "6790ac7c-24ac-4f98-8464-42f6d98a53ae";
    var id = "110ec58a-a0f2-4ac4-8393-c866d813b8d1";
    var date = 1443694430074;

    var kinesis = {
        putRecord: sinon.stub().returns(BPromise.resolve({}))
    };

    var generateUuid = sinon.stub().returns(id);

    beforeEach(function () {
        kinesis.putRecord.reset();
        verifyEmail.__Rewire__("kinesis", kinesis);
        verifyEmail.__Rewire__("generateUuid", generateUuid);
        process.env.KINESIS_STREAM_NAME = "stream";
        sinon.stub(Date, "now").returns(date);
    });

    afterEach(function () {
        verifyEmail.__ResetDependency__("kinesis");
        verifyEmail.__ResetDependency__("generateUuid");
        Date.now.restore();
    });

    it("should throws a 401 `RpcError` if `searchToken` return `null`", function () {
        var troublemaker = function () {
            verifyEmail.emailVerification(token, null);
        };
        expect(troublemaker).to.throw(RpcError);
        expect(troublemaker).to.throw("Unauthorized");
    });

    it("should be called with the correct object", function () {
        var options = {
            email: "test@email.com",
            password: "password"
        };
        var user = {
            emails: [{
                address: options.email,
                verified: false
            }],
            profile: options.profile || {},
            services: {
                email: {
                    verificationTokens: [{
                        address: options.email,
                        token: token
                    }]
                },
                password: {
                    bcrypt: ""
                },
                resume: {
                    loginTokens: []
                }
            }
        };
        var userVerificated = {
            emails: [{
                address: options.email,
                verified: true
            }],
            profile: options.profile || {},
            services: {
                email: {
                    verificationTokens: []
                },
                password: {
                    bcrypt: ""
                },
                resume: {
                    loginTokens: []
                }
            }
        };
        var expectedObject = {
            Data: JSON.stringify({
                id: id,
                data: {element: userVerificated},
                timestamp: date,
                type: "element replaced in collection users"
            }),
            PartitionKey: "users",
            StreamName: process.env.KINESIS_STREAM_NAME
        };
        verifyEmail.emailVerification(token, user);
        expect(kinesis.putRecord).to.have.been.calledWith(expectedObject);
    });

});
