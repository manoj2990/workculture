
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';


import {subscriptionKey,serviceRegion} from '@/config/env.config'


interface ConvertToSpeechOptions {
  outputFormat?: 'base64' | 'buffer';
}

export const textToSpeech = async (text: string, options: ConvertToSpeechOptions = { outputFormat: 'base64' }): Promise<string | Buffer | null> => {
  if (!text) {
    return null;
  }

  try {
    const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
    speechConfig.speechSynthesisVoiceName = 'en-IN-KunalNeural';
    speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

    const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

    const ssml = `
      <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>
        <voice name='en-US-JessaNeural'>${text}</voice>
      </speak>
    `;

    return new Promise((resolve, reject) => {
      synthesizer.speakSsmlAsync(
        ssml,
        (result) => {
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            const audioBuffer = Buffer.from(result.audioData);
            synthesizer.close();
            if (options.outputFormat === 'base64') {
              resolve(audioBuffer.toString('base64'));
            } else {
              console.log("audio buffer---->")
              resolve(audioBuffer);
            }
          } else {
            synthesizer.close();
            resolve(null);
          }
        },
        (err) => {
          synthesizer.close();
          console.error('Speech synthesis error:', err);
          resolve(null);
        }
      );
    });
  } catch (error) {
    console.error('TTS error:', error);
    return null;
  }
};



// export const textToSpeech = async (req: Request, res: Response, text: string): Promise<string | null> => {
//     console.log("entring inside textToSpeech----------->");
//     console.log("text ----------->", text);
  
//     if (!text) {
//       res.status(400).json({ success: false, message: "Text is required" });
//       return null;
//     }
  
//     try {
//       const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
//       speechConfig.speechSynthesisVoiceName = 'en-US-JessaNeural';
  
//       const synthesizer = new sdk.SpeechSynthesizer(speechConfig);
  
//       const ssml = `
//         <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>
//           <voice name='en-US-JessaNeural'>${text}</voice>
//         </speak>
//       `;
  
//       return new Promise((resolve, reject) => {
//         synthesizer.speakSsmlAsync(
//           ssml,
//           (result) => {
//             if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
//               const audioBuffer = Buffer.from(result.audioData);
//               const audioBase64 = audioBuffer.toString('base64'); // Convert to base64
//               synthesizer.close();
//               resolve(audioBase64);
//             } else {
//               synthesizer.close();
//               resolve(null);
//               res.status(500).json({ success: false, message: 'Speech synthesis failed' });
//             }
//           },
//           (err) => {
//             synthesizer.close();
//             console.error('Speech synthesis error:', err);
//             res.status(500).json({ success: false, message: 'TTS error occurred' });
//             resolve(null);
//           }
//         );
//       });
//     } catch (error) {
//       console.error('TTS controller error:', error);
//       res.status(500).json({ success: false, message: 'Internal server error' });
//       return null;
//     }
//   };





// export const textToSpeech = async (text: string): Promise<string> => {
//     console.log("entering into tts--->");
    
//     const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
//     speechConfig.speechSynthesisVoiceName = 'en-US-JessaNeural';

//     console.log(`[TTS] speechConfig : ${speechConfig}`);

//     const synthesizer = new sdk.SpeechSynthesizer(speechConfig);
//     const ssml = `
//         <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>
//             <voice name='en-US-JessaNeural'>
//                 ${text}
//             </voice>
//         </speak>
//     `;

//     console.log(`[TTS] synthesizer : ${synthesizer}`);

//     return new Promise((resolve, reject) => {
//         synthesizer.speakSsmlAsync(
//             ssml,
//             (result) => {
//                 if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
//                     console.log(`[TTS] entering into result`);
//                     const audioBuffer = Buffer.from(result.audioData);
//                     console.log(`[TTS] audioBuffer --->`);
                    
//                     // Define the audio directory relative to the project root
//                     const audioDir = path.join(__dirname, '..','..', 'public', 'audio');
//                     const fileName = `response-${Date.now()}.mp3`;
//                     const filePath = path.join(audioDir, fileName);

//                     console.log(`[TTS] filePath : ${filePath}`);

//                     // Create directory if it doesn't exist
//                     try {
//                         fs.mkdirSync(audioDir, { recursive: true });
//                         fs.writeFileSync(filePath, audioBuffer);
//                         console.log(`Audio file saved at: ${filePath}`);

//                         const audioUrl = `http://localhost:4000/api/v1/audio/${fileName}`;
//                         console.log(`[TTS] audioUrl : ${audioUrl}`);
//                         synthesizer.close();
//                         console.log("audio file created successfully--->");
//                         resolve(audioUrl);
//                     } catch (error) {
//                         synthesizer.close();
//                         reject(new Error(`Failed to save audio file: ${error}`));
//                     }
//                 } else {
//                     synthesizer.close();
//                     reject(new Error('Speech synthesis failed'));
//                 }
//             },
//             (err) => {
//                 console.log(`[TTS] promise is rejected : ${err}`);
//                 synthesizer.close();
//                 reject(err);
//             }
//         );
//     });
// };







// export const textToSpeech = async (text: string): Promise<string> => {
//     console.log("entring into tts--->")
    
//   const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
//   speechConfig.speechSynthesisVoiceName = 'en-US-JessaNeural';

//   console.log(`[TTS] speechConfig : ${speechConfig}`);

//   const synthesizer = new sdk.SpeechSynthesizer(speechConfig);
//   const ssml = `
//     <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>
//       <voice name='en-US-JessaNeural'>
//         ${text}
//       </voice>
//     </speak>
//   `;

//   console.log(`[TTS] synthesizer : ${synthesizer}`);

//   return new Promise((resolve, reject) => {
//     synthesizer.speakSsmlAsync(
//       ssml,
//       (result) => {
//         if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
//             console.log(`[TTS] entring into resilt`);
//           const audioBuffer = Buffer.from(result.audioData);
//           console.log(`[TTS] audioBuffer : ${audioBuffer}`);
//           const fileName = `response-${Date.now()}.mp3`;
//           console.log(`[TTS] fileName : ${fileName}`);
//           const filePath = path.join(__dirname, 'audio', fileName);
//           // const filePath = path.join(__dirname, '..', '..', 'public', 'audio')
//           // if (!fs.existsSync(filePath)) {
//           //           fs.mkdirSync(filePath, { recursive: true });
//           //         }
//           console.log(`[TTS] filePath : ${filePath}`);
//           fs.mkdirSync(path.dirname(filePath), { recursive: true });
//           fs.writeFileSync(filePath, audioBuffer);
//           console.log(`Audio file saved at: ${filePath}`);

//           const audioUrl = `http://localhost:4000/audio/${fileName}`;
//           console.log(`[TTS] audioUrl : ${audioUrl}`);
//           synthesizer.close();
//           console.log("audio file created succesfully--->")
//           resolve(audioUrl);
//         } else {
//           synthesizer.close();
//           reject(new Error('Speech synthesis failed'));
//         }
//       },
//       (err) => {
//         console.log(`[TTS] promise is rejected : ${err}`);
//         synthesizer.close();
//         reject(err);
//       }
//     );
//   });


// };




// // Serve audio files (for demo purposes)
// import express from 'express';
// const app = express();
// app.use('/audio', express.static(path.join(__dirname, 'audio')));




///////////////////////////////


// import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
// import * as fs from 'fs';
// import * as path from 'path';

// // Replace with your Azure credentials
// const subscriptionKey = '94ffc6ef-690a-4925-b7e2-865d949d84a8';
// const serviceRegion = 'centralindia'; 

// // Validate subscription key and region upfront
// if (!subscriptionKey) {
//   console.error("[TTS] Error: AZURE_SUBSCRIPTION_KEY is not set in environment variables");
//   throw new Error("AZURE_SUBSCRIPTION_KEY is required");
// }
// console.log(`[TTS] Using subscription key: ${subscriptionKey.slice(0, 4)}... (hidden for security)`);
// console.log(`[TTS] Using service region: ${serviceRegion}`);

// export const textToSpeech = async (text: string): Promise<string> => {
//   console.log("[TTS] Entering textToSpeech function...");
//   console.log(`[TTS] Input text: ${text}`);

//   // Create speech configuration
//   let speechConfig: sdk.SpeechConfig;
//   try {
//     speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
//     speechConfig.speechSynthesisVoiceName = 'en-US-JessaNeural';
//     console.log(`[TTS] SpeechConfig created: Voice=${speechConfig.speechSynthesisVoiceName}, Region=${serviceRegion}`);
//   } catch (error) {
//     console.error("[TTS] Error creating SpeechConfig:", error instanceof Error ? error.message : error);
//     throw error;
//   }

//   // Create synthesizer
//   const synthesizer = new sdk.SpeechSynthesizer(speechConfig);
//   console.log("[TTS] Synthesizer created successfully");

//   const ssml = `
//     <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>
//       <voice name='en-US-JessaNeural'>
//         ${text}
//       </voice>
//     </speak>
//   `;
//   console.log(`[TTS] Generated SSML: ${ssml}`);

//   // Add a timeout for the synthesis request
//   const TIMEOUT_MS = 20000; // 10 seconds
//   const timeoutPromise = new Promise<never>((_, reject) => {
//     setTimeout(() => {
//       reject(new Error(`Speech synthesis timed out after ${TIMEOUT_MS / 1000} seconds`));
//     }, TIMEOUT_MS);
//   });

//   const synthesisPromise = new Promise<string>((resolve, reject) => {
//     console.log("[TTS] Starting speech synthesis...");
//     synthesizer.speakSsmlAsync(
//       ssml,
//       (result) => {
//         console.log(`[TTS] Synthesis result received: Reason=${result.reason}`);
//         if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
//           console.log("[TTS] Speech synthesis completed successfully");
//           const audioBuffer = Buffer.from(result.audioData);
//           console.log(`[TTS] Audio buffer size: ${audioBuffer.length} bytes`);

//           const fileName = `response-${Date.now()}.mp3`;
//           const filePath = path.join(__dirname, 'audio', fileName);
//           console.log(`[TTS] Saving audio file to: ${filePath}`);

//           try {
//             fs.mkdirSync(path.dirname(filePath), { recursive: true });
//             fs.writeFileSync(filePath, audioBuffer);
//             console.log(`[TTS] Audio file saved successfully: ${filePath}`);
//           } catch (error) {
//             console.error("[TTS] Error saving audio file:", error instanceof Error ? error.message : error);
//             synthesizer.close();
//             reject(error);
//             return;
//           }

//           const audioUrl = `http://localhost:3000/audio/${fileName}`;
//           console.log(`[TTS] Generated audio URL: ${audioUrl}`);
//           console.log("[TTS] Audio file created successfully");

//           synthesizer.close();
//           resolve(audioUrl);
//         } else {
//           console.error(`[TTS] Speech synthesis failed: Reason=${result.reason}, ErrorDetails=${result.errorDetails || 'N/A'}`);
//           synthesizer.close();
//           reject(new Error(`Speech synthesis failed: ${result.errorDetails || result.reason}`));
//         }
//       },
//       (err:any) => {
//         console.error("[TTS] Synthesis error:", err.message);
//         synthesizer.close();
//         reject(err);
//       }
//     );
//   });

//   // Use Promise.race with proper typing
//   return Promise.race([synthesisPromise, timeoutPromise]);
// };

// // Serve audio files (for demo purposes)
// import express from 'express';
// const app = express();
// app.use('/audio', express.static(path.join(__dirname, 'audio')));




// /////////////////////////////

// // Import the Node.js shim first
// import "openai/shims/node";

// // Now import other openai modules
// import { AzureOpenAI } from "openai";
// import type { SpeechCreateParams } from "openai/resources/audio/speech";

// // Other imports
// import { writeFile } from "fs/promises";
// import * as path from "path";

// // Azure OpenAI configuration (reuse the same endpoint and key as callLLM)
// const endpoint = "https://work-cultur.openai.azure.com/"; // Same as in llm.ts
// const apiKey = process.env.AZURE_OPENAI_API_KEY || "";
// const apiVersion = process.env.OPENAI_API_VERSION || "2025-04-01-preview";
// const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "tts";

// // Validate environment variables
// if (!apiKey) {
//   console.error("[TTS] Error: AZURE_OPENAI_API_KEY is not set in environment variables");
//   throw new Error("AZURE_OPENAI_API_KEY is required");
// }
// if (!deploymentName) {
//   console.error("[TTS] Error: AZURE_OPENAI_DEPLOYMENT_NAME is not set in environment variables");
//   throw new Error("AZURE_OPENAI_DEPLOYMENT_NAME is required");
// }

// console.log(`[TTS] Using endpoint: ${endpoint}`);
// console.log(`[TTS] Using API version: ${apiVersion}`);
// console.log(`[TTS] Using deployment: ${deploymentName}`);

// function getClient(): AzureOpenAI {
//   return new AzureOpenAI({
//     endpoint,
//     apiKey,
//     apiVersion,
//     deployment: deploymentName,
//   });
// }

// async function generateAudioStream(
//   client: AzureOpenAI,
//   params: SpeechCreateParams
// ): Promise<NodeJS.ReadableStream> {
//   console.log("[TTS] Generating audio stream...");
//   console.log(`[TTS] Speech params: ${JSON.stringify(params, null, 2)}`);

//   const response = await client.audio.speech.create(params);
//   if (response.ok) {
//     console.log("[TTS] Audio stream generated successfully");
//     return response.body;
//   }

//   const errorText = await response.text();
//   console.error(`[TTS] Failed to generate audio stream: Status=${response.status}, Error=${errorText}`);
//   throw new Error(`Failed to generate audio stream: ${errorText}`);
// }

// export const textToSpeech = async (text: string): Promise<string> => {
//   console.log("[TTS] Entering textToSpeech function...");
//   console.log(`[TTS] Input text: ${text}`);

//   const client = getClient();

//   // Generate audio stream
//   const params: SpeechCreateParams = {
//     model: deploymentName,
//     voice: "alloy", // Use a supported voice (alloy, echo, fable, onyx, nova, shimmer)
//     input: text,
//   };

//   let streamToRead: NodeJS.ReadableStream;
//   try {
//     streamToRead = await generateAudioStream(client, params);
//   } catch (error) {
//     console.error("[TTS] Error generating audio stream:", error instanceof Error ? error.message : error);
//     throw error;
//   }

//   // Save the audio stream to a file
//   const fileName = `response-${Date.now()}.mp3`;
//   const filePath = path.join(__dirname, 'audio', fileName);
//   console.log(`[TTS] Saving audio file to: ${filePath}`);

//   try {
//     await writeFile(filePath, streamToRead);
//     console.log(`[TTS] Audio file saved successfully: ${filePath}`);
//   } catch (error) {
//     console.error("[TTS] Error saving audio file:", error instanceof Error ? error.message : error);
//     throw error;
//   }

//   const audioUrl = `http://localhost:3000/audio/${fileName}`;
//   console.log(`[TTS] Generated audio URL: ${audioUrl}`);
//   console.log("[TTS] Audio file created successfully");

//   return audioUrl;
// };

// // Serve audio files (for demo purposes)
// import express from 'express';
// const app = express();
// app.use('/audio', express.static(path.join(__dirname, 'audio')));




/////////////////

// // utils/azureTTS.ts
// import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
// import * as fs from 'fs';
// import * as path from 'path';

// const subscriptionKey ='Cu7icOBTQvoJFVwSeSnri1TtqjmUfTxasfgDceko1UZcZFyenhmlJQQJ99BEAC8vTInXJ3w3AAAYACOG3xTj';
// const serviceRegion ='centralindia';

// if (!subscriptionKey) throw new Error('AZURE_SPEECH_KEY is not set');
// if (!serviceRegion) throw new Error('AZURE_SPEECH_REGION is not set');

// export const textToSpeech = async (text: string): Promise<string> => {
//   const start = Date.now();
//   console.log(`[TTS] Starting synthesis at ${new Date().toISOString()}`);

//   const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
//   speechConfig.speechSynthesisVoiceName = 'en-US-JessaNeural';
//   speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

//   const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

//   const ssml = `
//     <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>
//       <voice name='en-US-JessaNeural'>${text}</voice>
//     </speak>
//   `;

//   return new Promise<string>((resolve, reject) => {
//     console.log(`[TTS] Calling Azure TTS at ${new Date().toISOString()}`);

//     synthesizer.speakSsmlAsync(
//       ssml,
//       (result) => {
//         const t1 = Date.now();
//         console.log(`[TTS] TTS API returned at ${new Date().toISOString()} after ${(t1 - start)}ms`);

//         if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
//           const buffer = Buffer.from(result.audioData);
//           const fileName = `response-${Date.now()}.mp3`;
//           const audioDir = path.join(__dirname, '..', 'public', 'audio');
//           const filePath = path.join(audioDir, fileName);

//           try {
//             const t2 = Date.now();
//             fs.mkdirSync(audioDir, { recursive: true });
//             fs.writeFileSync(filePath, buffer);
//             const t3 = Date.now();
//             console.log(`[TTS] Audio saved at ${new Date().toISOString()} (mkdir+write took ${t3 - t2}ms)`);

//             const audioUrl = `/audio/${fileName}`;
//             synthesizer.close();
//             resolve(audioUrl);
//           } catch (err) {
//             synthesizer.close();
//             console.error("[TTS] Error saving audio:", err);
//             reject(err);
//           }
//         } else {
//           synthesizer.close();
//           console.error("[TTS] Error: synthesis failed with reason", result.reason);
//           reject(new Error("TTS synthesis failed: " + result.errorDetails));
//         }
//       },
//       (err) => {
//         synthesizer.close();
//         console.error("[TTS] Error during synthesis:", err);
//         reject(err);
//       }
//     );
//   });
// };


////const 
// const speechKey ='94ffc6ef-690a-4925-b7e2-865d949d84a8';
// const region ='centralindia';

// import {
//   SpeechConfig,
//   SpeechSynthesizer,
//   AudioConfig,
//   ResultReason,
// } from 'microsoft-cognitiveservices-speech-sdk';
// import { v4 as uuidv4 } from 'uuid';
// import path from 'path';
// import fs from 'fs';

// const speechKey ='5i6ItgDbwJ2bocE0nbNrW62OKWZ9rsKUiIyTKaJ3BeLv3d0HZ1UEJQQJ99BEAC8vTInXJ3w3AAAYACOGOxAR';
// const region ='westus2';

// export const textToSpeech = async (text: string): Promise<string> => {
//   console.log("⚙️ Entering TTS function");

//   return new Promise((resolve, reject) => {
//     if (!text || text.trim().length === 0) {
//       return reject(new Error("🚫 Provided text is empty"));
//     }
//     if (!speechKey || !region) {
//       return reject(new Error("🚫 Missing speech key or region in environment variables"));
//     }

//     try {
//       const speechConfig = SpeechConfig.fromSubscription(speechKey, region);
//       speechConfig.speechSynthesisVoiceName = "en-US-AriaNeural";
//       speechConfig.speechSynthesisOutputFormat = 5; // Audio16Khz128KBitRateMonoMp3

//       const audioDir = path.join(__dirname, '..', '..', 'public', 'audio');
//       if (!fs.existsSync(audioDir)) {
//         fs.mkdirSync(audioDir, { recursive: true });
//       }

//       const filename = `audio_${uuidv4()}.mp3`;
//       const filePath = path.join(audioDir, filename);

//       const audioConfig = AudioConfig.fromAudioFileOutput(filePath);
//       const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);

//       console.log(`📁 File path to save audio: ${filePath}`);
//       console.log("🔊 Starting text synthesis...");

//       synthesizer.speakTextAsync(
//         text,
//         result => {
//           synthesizer.close();
      
//           if (result.reason === ResultReason.SynthesizingAudioCompleted) {
//             const stats = fs.statSync(filePath);
//             if (stats.size === 0) return reject(new Error("🚫 Synthesized file is empty"));
      
//             return resolve(`/audio/${filename}`);
//           } else {
//             return reject(new Error("❌ Synthesizing failed: " + result.errorDetails));
//           }
//         },
//         error => {
//           synthesizer.close();
//           return reject(new Error("❌ speakTextAsync failed: " + error));
//         }
//       );
      

      
//     } catch (err) {
//       console.error("❌ Unexpected error in TTS:", err);
//       reject(err);
//     }
//   });
// };





// Serve audio files (for demo purposes)
// import express from 'express';
// const app = express();
// app.use('/audio', express.static(path.join(__dirname, '..', 'public', 'audio')));
