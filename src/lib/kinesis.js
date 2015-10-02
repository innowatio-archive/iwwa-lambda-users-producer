import {Kinesis} from "aws-sdk";
import {promisify} from "bluebird";

var kinesis = new Kinesis({
    apiVersion: "2013-12-02"
});

export var putRecord = promisify(kinesis.putRecord, kinesis);
