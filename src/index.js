import BPromise from "bluebird";
import LambdaRpc from "lambda-rpc";
import dotenv from "dotenv";
import {partial} from "ramda";

import {validateParams, ensureEmailUniqueness, putNewUserInKinesis} from "./methods/create-user";
import {searchToken, emailVerification} from "./methods/verify-email";
import {searchUser, creationLoginToken} from "./methods/login";

dotenv.load();
var lambdaRpc = new LambdaRpc();

lambdaRpc.methods({
    createUser: function (options) {
        return BPromise.resolve()
            .then(partial(validateParams, options))
            .then(partial(ensureEmailUniqueness, options.email))
            .then(partial(putNewUserInKinesis, options));
    },
    verifyEmail: function (token) {
        return BPromise.resolve()
            .then(partial(searchToken, token))
            .then(partial(emailVerification, token));
    },
    login: function (address, password) {
        return BPromise.resolve()
            .then(partial(searchUser, address))
            .then(partial(creationLoginToken, password));
    }
});

export var handler = lambdaRpc.getRouter();
