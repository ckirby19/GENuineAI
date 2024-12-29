import { type Schema } from "./resource";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

export const handler: Schema["GenerateTextResponse"]["functionHandler"] = async (
  event,
  context
) => {
    console.log('Text Prompt Handler started - received prompt:', event.arguments.prompt);
    const AWS_REGION = process.env.AWS_REGION || "eu-west-2";

    const client = new BedrockRuntimeClient({
        region: AWS_REGION
        // credentials: {
        //     accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        //     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
        //     sessionToken: process.env.AWS_SESSION_TOKEN || "",
        // },
    });

    const TEXT_MODEL_ID = process.env.MODEL_ID;
    if (!TEXT_MODEL_ID) {
        console.error('Missing MODEL_ID environment variable');
        throw new Error("MODEL_ID environment variable is not set");
    }
    
    // User prompt
    const prompt = event.arguments.prompt;
    // "inputText": `User: ${prompt}\nBot:`,

    const promptWithContext = `Task: Generate a funny response for a party game where players try to guess which answer is AI generated
        Context: This is for entertainment purposes. Be creative and humorous.
        Format: Provide only the missing word(s) to complete the sentence. Do not change the full sentence, just provide your answer to fill in ____
        Tone: Playful and imaginative, 
        Rules: 
        - Don't explain or apologize
        - Keep it brief (1-3 words)
        - Be creative
        - Make it funny

        Complete this sentence: ${prompt}
    `

    // Prepare the payload for the model.
    const payload = {
        "inputText": `${promptWithContext}`,
        "textGenerationConfig": {
            "maxTokenCount": 512,
            "stopSequences": [],
            "temperature": 0.9,
            "topP": 1.0
        }
    };

    const command = new InvokeModelCommand({
        contentType: "application/json",
        body: JSON.stringify(payload),
        modelId: TEXT_MODEL_ID,
    });

    const response = await client.send(command);
    
    const data = JSON.parse(Buffer.from(response.body).toString());

    console.log('Received response from Bedrock', data);

    if (data.results[0].completionReason != "FINISH"){
        console.warn("AI model did not correctly finish generating response")
    }
    return data.results[0].outputText;
};