const mongoose = require("mongoose");

mongoose
  .connect(
    "mongodb+srv://ashish:ashish@cluster0.fdovbiu.mongodb.net/?retryWrites=true&w=majority"
  )
  .then(() => {
    console.log("Connection SuccessFull");
  })
  .catch((err) => {
    console.log(err);
  });
 