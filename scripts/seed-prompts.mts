import { generateClient } from "aws-amplify/data";
import { Amplify } from 'aws-amplify';
import { type Schema } from "@/amplify/data/resource";

Amplify.configure();

const client = generateClient<Schema>({
  authMode: 'apiKey'
});

const samplePrompts = [
  "Never bring a _____ to a pillow fight",
  "The secret ingredient in grandma's cookies is _____",
  "The worst thing to say during a job interview is _____",
  "I knew it was true love when they _____",
  "The most useless superpower would be _____",
  "If I were president, my first action would be to _____",
  "The best way to survive a zombie apocalypse is to _____",
  "The next big trend in fashion will be _____",
  "My autobiography would be titled _____",
  "The worst piece of advice I've ever received was _____",
  "If aliens visited Earth, the first thing they'd do is _____",
  "The most surprising thing you'd find in a time capsule from 2024 would be _____",
  "The real reason dinosaurs went extinct is _____",
  "The next Olympic sport should be _____",
  "If dogs could talk, the first thing they'd say is _____"
];

async function seedPrompts() {
  console.log("Starting to seed prompts...");
  
  try {
    // First check if we already have prompts
    const existingPrompts = await client.models.Prompt.list();
    
    if (existingPrompts.data.length > 0) {
      console.log("Prompts already exist in the database. Skipping seed.");
      return;
    }

    // If no prompts exist, seed them
    for (const promptText of samplePrompts) {
      await client.graphql({
        query: `mutation CreatePrompt($text: String!, $isActive: Boolean!) {
          createPrompt(input: { text: $text, isActive: $isActive }) {
            id
            text
            isActive
          }
        }`,
        variables: {
          text: promptText,
          isActive: true
        }
      });
      // await client.models.Prompt.create({
      //   text: promptText,
      //   isActive: true
      // });
      console.log(`Created prompt: ${promptText}`);
    }
    
    console.log("Successfully seeded all prompts!");
  } catch (error) {
    console.error("Error seeding prompts:", error);
  }
}

// Run the seeding function
seedPrompts();