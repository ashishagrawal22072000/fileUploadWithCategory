const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
    email : {
        type: String,
        
    },
    password : {    type: String, },
})

userSchema.pre("save", async function (next) {
    // console.log("hi from user");
    if (this.isModified("password")) {
      this.password = await bcrypt.hashSync(this.password, 10);
    }
    next();
  });


const userModel = mongoose.model('User', userSchema);

module.exports = userModel;