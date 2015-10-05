import {RpcError} from "lambda-rpc";
import {omit} from "ramda";

import * as kinesis from "../lib/kinesis";
import * as mongodb from "../lib/mongodb";
import generateUuid from "../lib/generate-uuid";
import {compare} from "../lib/bcrypt";
import {hashedToken} from "../lib/hashed-token";

export function searchUser (address) {
    return mongodb.findOne({
        url: process.env.MONGODB_URL,
        collectionName: "users",
        query: {
            "emails.address": address
        }
    });
}

export function creationLoginToken (password, user) {
    if (!user) {
        throw new RpcError(401, "Login failed: user not found");
    }
    if (!compare(password, user.services.password.bcrypt)) {
        throw new RpcError(401, "Login failed: wrong password");
    }
    var loginToken = generateUuid();
    user.services.resume.loginTokens.push({
        when: Date.now(),
        hashedToken: hashedToken(loginToken)
    });
    return kinesis.putRecord({
        Data: JSON.stringify({
            id: generateUuid(),
            data: {
                element: omit("_id", user),
                id: user._id
            },
            timestamp: Date.now(),
            type: "element replaced in collection users"
        }),
        PartitionKey: "users",
        StreamName: process.env.KINESIS_STREAM_NAME
    }).return(loginToken);
}
