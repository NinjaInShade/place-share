const jwt = require("jsonwebtoken");
const HttpError = require("../models/HttpError");

module.exports = function (req, res, next) {
  if (req.method === "OPTIONS") {
    return next();
  }
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      throw new Error("auth failed");
    }

    const decodedToken = jwt.verify(token, "superSecretDontShare");
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (err) {
    return next(new HttpError("invalid token"), 403);
  }
};
