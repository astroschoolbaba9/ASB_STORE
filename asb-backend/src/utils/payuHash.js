const crypto = require("crypto");

function sha512(s) {
  return crypto.createHash("sha512").update(String(s), "utf8").digest("hex");
}

// Request hash for Hosted Checkout :contentReference[oaicite:9]{index=9}
function makePayuRequestHash({
  key, salt, txnid, amount, productinfo, firstname, email,
  udf1 = "", udf2 = "", udf3 = "", udf4 = "", udf5 = ""
}) {
  const str = [
    key,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    udf1, udf2, udf3, udf4, udf5,
    "", "", "", "", "", // 5 empty pipes
    salt
  ].join("|");
  return sha512(str);
}

// Response hash verification :contentReference[oaicite:10]{index=10}
function makePayuResponseHash({
  salt, status,
  udf1 = "", udf2 = "", udf3 = "", udf4 = "", udf5 = "",
  email, firstname, productinfo, amount, txnid, key
}) {
  const str = [
    salt,
    status,
    "", "", "", "", "", // 5 empty pipes
    udf5, udf4, udf3, udf2, udf1,
    email,
    firstname,
    productinfo,
    amount,
    txnid,
    key
  ].join("|");
  return sha512(str);
}

module.exports = { makePayuRequestHash, makePayuResponseHash };
