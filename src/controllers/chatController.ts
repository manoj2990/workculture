
import { Request, Response } from 'express';
import { callLLM } from '@/utils/azureOpenAI';
import { textToSpeech } from '@/utils/azureTTS';

// export const chatwithAI = async (req: Request, res: Response) => {
//   try {
//     console.log("entring into chatwithAI--->")
//     const { question } = req.body;
//     if (!question) {
//         return res.status(400).json({ error: 'Question is required' });
//     }
//     console.log("question--->",question)

//     // Call Azure OpenAI to get text response
//     const textResponse = await callLLM(question);
//     console.log("textResponse inside controler-->",textResponse)
//     // Convert text to speech using Azure TTS
//     const audioUrl = await textToSpeech(req,res,textResponse);
//     console.log("audio buffer inside controller--->",audioUrl)
//     // Return both text and audio URL
//     res.status(200).json({ text: textResponse, audioUrl });
//   } catch (error) {
//     console.error('Error in askQuestion:', error);
//     res.status(500).json({ error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') });
//   }
// };






/////////////

export const chatwithAI = async (req: Request, res: Response) => {
  try {
    console.log("entring into chatwithAI--->");
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }
    console.log("question--->", question);

    // Call Azure OpenAI to get text response
    const textResponse = await callLLM(question);
    console.log("textResponse inside controller-->", textResponse);

    // Convert text to speech using Azure TTS and get base64 audio
    const audioBase64 = await textToSpeech(textResponse, { outputFormat: 'base64' });
    console.log("audio base64 inside controller--->", audioBase64 ? 'Generated' : 'Failed');

    // Return both text and audio base64
    res.status(200).json({ text: textResponse, audioBase64 });
  } catch (error) {
    console.error('Error in askQuestion:', error);
    res.status(500).json({ error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') });
  }
};