import {RpcError} from "lambda-rpc";
import {complement, find, omit, pipe, prop, propEq} from "ramda";

import * as kinesis from "../lib/kinesis";
import * as mongodb from "../lib/mongodb";
import generateUuid from "../lib/generate-uuid";

export function searchToken (token) {
    return mongodb.findOne({
        url: process.env.MONGODB_URL,
        collectionName: "users",
        query: {
            "services.email.verificationTokens.token": token
        }
    });
}

export function emailVerification (token, user) {
    if (!user) {
        throw new RpcError(401, "Unauthorized");
    }
    var address = pipe(
        find(propEq("token", token)),
        prop("address")
    )(user.services.email.verificationTokens);
    // Modify the user object to mark the email address as verified
    user.emails = user.emails.map(email => {
        if (email.address === address) {
            email.verified = true;
        }
        return email;
    });
    user.services.email.verificationTokens = user.services.email.verificationTokens.filter(complement(propEq("token", token)));
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
    });
}
