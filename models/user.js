const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose").default;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    default: null,
  },
  role: {
    type: String,
    enum: ["traveller", "owner"],
    default: "traveller",
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  isPhoneVerified: {
    type: Boolean,
    default: false,
  },
  wishlist: [
    {
      type: Schema.Types.ObjectId,
      ref: "Listing",
    }
  ],
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);