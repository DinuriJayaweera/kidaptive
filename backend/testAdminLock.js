const mongoose = require("mongoose");
const User = require("./dist/models/User").default;
require("dotenv").config();
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const user = await User.findOne({ email: "admin@kidaptive.com" });
  if (!user) console.log("NO USER");
  else {
    try {
      await user.comparePassword("Admin@1234");
      console.log("SUCCESS");
    } catch(e) {
      console.log("ERROR THROWN:", e);
    }
  }
  process.exit(0);
});
