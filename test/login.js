import BPromise from "bluebird";
import chai, {expect} from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
import {RpcError} from "lambda-rpc";

chai.use(chaiAsPromised);
chai.use(sinonChai);

import * as login from "methods/login";

describe("`searchUser`", function () {

    var mongodb = {};
    var expectedUser = {
        emails: [{
            address: "test@email.com",
            verified: true
        }],
        profile: {},
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

    before(function () {
        login.__Rewire__("mongodb", mongodb);
    });

    after(function () {
        login.__ResetDependency__("mongodb");
    });

    it("should return an user if there is a correspondent validationToken in mongodb", function () {
        mongodb.findOne = sinon.stub().returns(BPromise.resolve(expectedUser));
        var promise = login.searchUser("test@email.com");
        return expect(promise).to.become(expectedUser);
    });

    it("should return null if there isn't a correspondent validationToken in mongodb", function () {
        mongodb.findOne = sinon.stub().returns(BPromise.resolve(null));
        var promise = login.searchUser("test@email.com");
        return expect(promise).to.become(null);
    });

});

describe("`creationLoginToken`", function () {

    var id = "110ec58a-a0f2-4ac4-8393-c866d813b8d1";
    var date = 1443694430074;
    var token = "6790ac7c-24ac-4f98-8464-42f6d98a53ae";

    var kinesis = {
        putRecord: sinon.stub().returns(BPromise.resolve({}))
    };

    var hashedToken = sinon.stub().returns(token);

    var generateUuid = sinon.stub().returns(id);

    beforeEach(function () {
        kinesis.putRecord.reset();
        login.__Rewire__("kinesis", kinesis);
        login.__Rewire__("generateUuid", generateUuid);
        login.__Rewire__("hashedToken", hashedToken);
        process.env.KINESIS_STREAM_NAME = "stream";
        sinon.stub(Date, "now").returns(date);
    });

    afterEach(function () {
        login.__ResetDependency__("kinesis");
        login.__ResetDependency__("generateUuid");
        login.__ResetDependency__("compare");
        login.__ResetDependency__("hashedToken");
        Date.now.restore();
    });

    it("should throws a 401 `RpcError` if `searchToken` return `null`", function () {
        var troublemaker = function () {
            login.creationLoginToken("", null);
        };
        expect(troublemaker).to.throw(RpcError);
        expect(troublemaker).to.throw("Login failed");
    });

    it("should throws a 401 `RpcError` if password is wrong", function () {
        var compare = sinon.stub().returns(false);
        login.__Rewire__("compare", compare);
        var expectedUser = {
            emails: [{
                address: "test@email.com",
                verified: true
            }],
            profile: {},
            services: {
                email: {
                    verificationTokens: []
                },
                password: {
                    bcrypt: "password"
                },
                resume: {
                    loginTokens: []
                }
            }
        };
        var troublemaker = function () {
            login.creationLoginToken("password", expectedUser);
        };
        expect(troublemaker).to.throw(RpcError);
        expect(troublemaker).to.throw("Login failed");
    });

    it("should be called with the correct object", function () {
        var compare = sinon.stub().returns(true);
        login.__Rewire__("compare", compare);
        var options = {
            email: "test@email.com",
            password: "password"
        };
        var user = {
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
                    bcrypt: "password"
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
                    bcrypt: "password"
                },
                resume: {
                    loginTokens: [{
                        when: date,
                        hashedToken: token
                    }]
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
        login.creationLoginToken("password", user);
        expect(kinesis.putRecord).to.have.been.calledWith(expectedObject);
    });

});
