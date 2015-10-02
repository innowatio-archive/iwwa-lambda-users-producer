import bcrypt from "bcrypt";

export function hash (password) {
    return bcrypt.hashSync(password, 12);
}

export function compare (hash, password) {
    return bcrypt.compareSync(password, hash);
}
