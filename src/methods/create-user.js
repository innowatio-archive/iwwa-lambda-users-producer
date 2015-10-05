import {validate} from "tcomb-validation";
import {RpcError} from "lambda-rpc";

import generateUuid from "../lib/generate-uuid";
import * as mongodb from "../lib/mongodb";
import {hash} from "../lib/bcrypt";
import * as kinesis from "../lib/kinesis";
import OptionsType from "../lib/options-type";

export function validateParams (options) {
    var validation = validate(options, OptionsType);
    if (!validation.isValid()) {
        throw new RpcError(400, "Bad request parameters");
    }
}

export function ensureEmailUniqueness (email) {
    return mongodb.findOne({
        url: process.env.MONGODB_URL,
        collectionName: "users",
        query: {
            "emails.address": email
        }
    }).then(function (user) {
        if (user) {
            throw new RpcError(401, "User already registered");
        }
    });
}

export function putNewUserInKinesis (options) {
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
    var id = generateUuid();
    // TODO: nel test:
    // - spii kinesis.putRecord e asserisci che venga chiamato con l'oggetto
    //   che ti aspetti
    return kinesis.putRecord({
        Data: JSON.stringify({
            id: generateUuid(),
            data: {element, id},
            timestamp: Date.now(),
            type: "element inserted in collection users"
        }),
        PartitionKey: "users",
        StreamName: process.env.KINESIS_STREAM_NAME
    });
}
