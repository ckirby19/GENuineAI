import { type Schema } from "./resource";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandInput,
} from "@aws-sdk/client-bedrock-runtime";

export const handler: Schema["GenerateTextResponse"]["functionHandler"] = async (
  event,
  context
) => {
    if (!event.arguments.prompt) {
        throw new Error("Missing prompt");
    }
    if (!event.arguments.model) {
        throw new Error("Missing model");
    }

    console.log('Text Prompt Handler Started - received prompt:', event.arguments.prompt);
    const AWS_REGION = process.env.AWS_REGION || "eu-west-2";

    const client = new BedrockRuntimeClient({
        region: AWS_REGION
    });

    if (event.arguments.model == "mistral.mistral-7b-instruct-v0:2"){
        return await extractResponseFromMistralModel(
            client,
            event.arguments.prompt,
            event.arguments.model);
    }
    else if (event.arguments.model == "amazon.titan-text-express-v1"){
        return await extractResponseFromAmazonModel(
            client,
            event.arguments.prompt,
            event.arguments.model);
    }
    else if (event.arguments.model == "anthropic.claude-3-haiku-20240307-v1:0"){
        return await extractResponseFromAnthropicModel(
            client,
            event.arguments.prompt,
            event.arguments.model);
    }
};

async function extractResponseFromMistralModel(
    client: BedrockRuntimeClient,
    prompt: string,
    model: string) {

    const promptWithContext = 
       `<s>[INST] Task: Fill in the blank with 1-3 words in a funny and creative way.
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
        modelId: model,
    });

    const response = await client.send(command);
    
    const data = JSON.parse(Buffer.from(response.body).toString());

    console.log(`Received answer response from Bedrock model ${model}`, data);

    if (data.outputs[0].stop_reason != "stop"){
        console.warn("AI model did not correctly finish generating response")
    }

    return data.outputs[0].text;
}

async function extractResponseFromAmazonModel(
    client: BedrockRuntimeClient,
    prompt: string,
    model: string) {

    const promptWithContext = 
       `Task: Fill in the blank with 1-3 words in a funny and creative way.
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

        Complete this sentence: ${prompt}`;

    // Prepare the payload for the model.
    const payload = {
        "inputText": `${promptWithContext}`,
        "textGenerationConfig": {
            "maxTokenCount": 150,
            "stopSequences": [],
            "temperature": 1.0,
            "topP": 1.0
        }
    };

    const command = new InvokeModelCommand({
        contentType: "application/json",
        body: JSON.stringify(payload),
        modelId: model,
    });

    const response = await client.send(command);
    
    const data = JSON.parse(Buffer.from(response.body).toString());

    console.log(`Received answer response from Bedrock model ${model}`, data);

    if (data.results[0].completionReason != "FINISH"){
        console.warn("AI model did not correctly finish generating response")
    }

    return data.results[0].outputText;
}

async function extractResponseFromAnthropicModel(
    client: BedrockRuntimeClient,
    prompt: string,
    model: string) {

    const input = {
        modelId: model,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        system:
           `Task: Fill in the blank with 1-3 words in a funny and creative way.
            Context: Party game. The goal is to entertain.
            Format: ONLY provide the missing word(s).
            Tone: Playful and imaginative.
            Rules: 
            - Do NOT repeat the sentence.
            - Do NOT change the wording of the original sentence.
            - Do NOT use quotation marks around your answer.
            - Keep the response very brief.
            - Be as funny and creative as possible.
            - Give a single answer and do not explain it`,
        messages: [
            {
            role: "user",
            content: [
                {
                type: "text",
                text: prompt,
                },
            ],
            },
        ],
        max_tokens: 150,
        temperature: 1.0,
        }),
    } as InvokeModelCommandInput;

    const command = new InvokeModelCommand(input);

    const response = await client.send(command);
    
    const data = JSON.parse(Buffer.from(response.body).toString());

    console.log(`Received answer response from Bedrock model ${model}`, data);

    return data.content[0].text;
}