const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email:{
        type:String,
        require:true,
    },
    password:{
        type:String,
        require:true,
        minLength:[5,"Minimum 5 characters required"]
    },
}
);

const User = mongoose.model("User", userSchema);

module.exports = Register;