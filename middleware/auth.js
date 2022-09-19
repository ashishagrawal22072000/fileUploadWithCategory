const jwt = require("jsonwebtoken");
const SECRET_KEY = "MYNAMEISASHISH";
const userModel = require('./../model/user')
const cookieParser = require("cookie-parser")
const generateToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      email: user.email,
    },
    SECRET_KEY,
    
  );
};

const isAuth = async (req, res, next) => {
  try {
    const token = req.cookies.owner;
    console.log("Authentica", token)
    const verifytoken = jwt.verify(token, SECRET_KEY);

    const rootUser = await userModel.findOne({
      _id: verifytoken._id,
      "tokens:token": token,
    });

    if (!rootUser) {
      throw new Error("User Not Found");
    }
    req.token = token;
    req.rootUser = rootUser;
    req.userID = rootUser._id;
    next();
  } catch (err) {
    res.status(400).send("Unauthorized :  No Token Provided");
    console.log(err);
  }
};

module.exports = { isAuth, generateToken };