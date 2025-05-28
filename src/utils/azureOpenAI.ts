

import { AzureOpenAI } from "openai";

import { 
    endpoint,
    apiKey,
    deployment,
    apiVersion,
    modelName
} from '@/config/env.config';

const options = { endpoint, apiKey, deployment, apiVersion };
const client = new AzureOpenAI(options);

export const callLLM = async (question: string,persona_prompt:string | undefined): Promise<string> => {
  try {
    console.log("emtrimg into LLM--->")
    console.log(`[LLM] Received question: ${question}`);
    // Log that we're starting the API call
    console.log(`[LLM] Calling Azure OpenAI API with model: ${modelName}, deployment: ${deployment}`);
    const systemPrompt = "Your name is Jasy. You are a helpful, friendly, and concise AI assistant. Always provide short, clear, and simple answers to user questions. Speak in a polite and easy-to-understand tone. Stay on topic and avoid unnecessary details"
    const response = await client.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt || `${systemPrompt} + ${persona_prompt}` },
        { role: "user", content: question },
      ],
      max_tokens: 4096,
      temperature: 1,
      top_p: 1,
      model: modelName,
    });

    // // Check for errors (as per your sample)
    // if (response?.error !== undefined && response.status !== "200") {
    //   throw new Error(response.error.message || "Failed to get response from Azure OpenAI");
    // }
 // Log the raw API response
 console.log("[LLM] Azure OpenAI API response:", JSON.stringify(response, null, 2));

    if(!response){
        throw new Error("Failed to get response from Azure OpenAI");
    }

    // Return the first choice's content
    const textResponse = response.choices[0]?.message?.content;
    if (!textResponse) {
      throw new Error("No response content received from Azure OpenAI");
    }

   console.log(`[LLM] Extracted response text: ${textResponse}`);
    return textResponse;
  } catch (error) {
    console.error("Error calling Azure OpenAI:", error);
    throw error; // Let the controller handle the error
  }
};

