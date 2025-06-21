const express = require("express");
const {
  geminiRequest,
  geminiPhotoRequest,
  geminiFileRequest,
} = require("../controller/geminiController");
const { upload } = require("../middleware/multer");
const router = express.Router();

router.post("/get-response", geminiRequest);
router.post("/upload-photo", upload.single("photo"), geminiPhotoRequest);
router.post("/upload-file", upload.single("file"), geminiFileRequest);

module.exports = router;
