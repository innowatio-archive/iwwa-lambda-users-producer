import validator from "validator";
import t from "tcomb-validation";

export default t.struct({
    email: t.refinement(t.String, validator.isEmail),
    password: t.String,
    profile: t.maybe(t.Object)
});
