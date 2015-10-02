import {createHash} from "crypto";

export function  hashedToken (loginToken) {
    return createHash("sha256").update(loginToken).digest("base64");
}
