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
    });

    const TEXT_MODEL_ID = process.env.MODEL_ID;
    if (!TEXT_MODEL_ID) {
        console.error('Missing MODEL_ID environment variable');
        throw new Error("MODEL_ID environment variable is not set");
    }
    
    // User prompt
    const prompt = event.arguments.prompt;

    const promptWithContext = `<s>[INST]
        Task: Fill in the blank with 1-3 words in a funny and creative way.
        Context: Party game. The goal is to entertain.
        Format: ONLY provide the missing word(s).
        Tone: Playful and imaginative.
        Rules: 
        - Do NOT repeat the sentence.
        - Do NOT change the wording of the original sentence.
        - Do NOT use quotation marks around your answer.
        - Keep the response very brief.
        - Be as funny and creative as possible.
        - Give a single answer and do not explain it.

        Complete this sentence: ${prompt} [/INST]`;

    // Prepare the payload for the model.
    const payload = {
        "prompt": promptWithContext,
        "max_tokens": 150,
        "stop": [".", "\n", "!"],
        "temperature": 1.0,
        "top_p": 1.0,
        "top_k": 50
    }

    const command = new InvokeModelCommand({
        body: JSON.stringify(payload),
        modelId: TEXT_MODEL_ID,
    });

    const response = await client.send(command);
    
    const data = JSON.parse(Buffer.from(response.body).toString());

    console.log(`Received answer response from Bedrock model ${TEXT_MODEL_ID}`, data);

    if (data.outputs[0].stop_reason != "stop"){
        console.warn("AI model did not correctly finish generating response")
    }

    return data.outputs[0].text;
};