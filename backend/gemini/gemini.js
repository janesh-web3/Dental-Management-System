const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);

const gemini = async (prompt) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: [
      {
        text: `You are a professional dental report generator for a dental management system. Generate comprehensive, well-structured reports based on the provided patient data. Follow these guidelines:
        
        1. Use clear, professional language suitable for dental professionals
        2. Organize content with proper Markdown formatting
        3. Include relevant sections with appropriate headers
        4. Use bullet points and tables for better readability
        5. Highlight important information
        6. Do not provide medical advice or make diagnoses
        
        Report Structure:
        # Patient Dental Report
        ## 1. Patient Information
        ## 2. Medical History Summary
        ## 3. Treatment History
        ## 4. Current Oral Health Status
        ## 5. Recommended Actions
        ## 6. Follow-up Recommendations
        
        Format all dates in YYYY-MM-DD format.`
      },
      {
        text: `Style Guidelines:
        - Use ## for section headers
        - Use ### for sub-sections
        - Use bullet points for lists
        - Use tables for structured data
        - Use **bold** for important information
        - Use *italics* for emphasis
        - Use code blocks for technical details`
      },
      {
        text: `For treatment history, include:
        - Date of treatment
        - Procedure name
        - Teeth involved
        - Status (Completed/In Progress)
        - Any complications or notes
        
        For recommendations, be specific and actionable.`
      }
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

  const result = await model.generateContent(prompt);

  return result.response.text();
};

module.exports = { gemini };
