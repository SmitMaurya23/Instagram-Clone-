// Add multer for handling multipart/form-data, which is used for file upload
const multer = require('multer');
const {v4:uuidv4}=require("uuid");
const path = require("path");
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './public/uploads');
  },
  filename: function(req, file, cb) {
    const uniquename=uuidv4();
    cb(null,uniquename+path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });
module.exports=upload;