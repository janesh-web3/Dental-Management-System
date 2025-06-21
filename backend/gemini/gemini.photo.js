const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");
const path = require("path");

const geminiPhoto = async (image, prompt) => {
  const fileManager = new GoogleAIFileManager(process.env.GEMINI_API);
  const normalizedPath = path.resolve(image.path);

  const uploadResult = await fileManager.uploadFile(normalizedPath, {
    mimeType: image.mimetype,
    displayName: "Photo of File",
  });

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: [
      {
        text: "You are a helpful assistant for a dental management system. Generate reports based on the provided patient data. Focus on clarity, accuracy, and actionable insights. Do not hallucinate or provide medical advice.",
      },
      {
        text: "Ensure all reports are formatted in Markdown.",
      },
      {
        text: "Recognizing patterns to anticipate potential future issues, allowing for proactive preventive care plans that can improve long-term patient outcomes.",
      },
      {
        text: "Automating the analysis of large datasets to reduce manual interpretation time, freeing up dental professionals to focus more on direct patient care and less on tedious data review.",
      },
      {
        text: "Generating comprehensive reports that factor in a patient's unique oral health history, risk factors, and treatment outcomes. This helps dentists formulate highly personalized and effective treatment strategies.",
      },
    ],
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_NONE",
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_NONE",
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_NONE",
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_NONE",
      },
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
  });
  const result = await model.generateContent([
    prompt,
    {
      fileData: {
        fileUri: uploadResult.file.uri,
        mimeType: uploadResult.file.mimeType,
      },
    },
  ]);

  return result.response.text();
};

module.exports = { geminiPhoto };
