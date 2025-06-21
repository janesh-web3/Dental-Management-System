const { gemini } = require("../gemini/gemini");
const { geminiPhoto } = require("../gemini/gemini.photo");

const geminiRequest = async (req, res) => {
  try {
    const { prompt } = req.body;

    const data = await gemini(prompt);
    res.json({ data: data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to perform gemini request" });
  }
};

const geminiPhotoRequest = async (req, res) => {
  try {
    const file = req.file;
    const { prompt } = req.body;

    if (!file) {
      console.error("File not found");
    }
    const message = await geminiPhoto(file, prompt);
    res.json({ message: message });
  } catch (error) {
    res.status(500).json({ error });
  }
};

const geminiFileRequest = async (req, res) => {
  const file = req.file;
  const { prompt } = req.body;
  console.log(file, prompt);
  if (!file) {
    console.error("File not found");
  }
  const message = await geminiPhoto(file, prompt);
  res.json({ message: message });
};

module.exports = { geminiRequest, geminiPhotoRequest, geminiFileRequest };
