import openai from './config/open-ai.js';
import readlineSync from 'readline-sync';
import colors from 'colors';

const MAX_RETRIES = 3; // Number of retries
const RETRY_DELAY = 5000; // Delay in milliseconds

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log(colors.bold.green('Welcome, please enter a question to get a response from chatGPT'));

  const chatHistory = []; // Store conversation history

  while (true) {
    const userInput = readlineSync.question(colors.yellow('You: '));

    // Retry loop
    for (let retries = 0; retries < MAX_RETRIES; retries++) {
      try {
        // Construct messages by iterating over the history
        const messages = chatHistory.map(([role, content]) => ({
          role,
          content,
        }));

        // Add latest user input
        messages.push({ role: 'user', content: userInput });

        // Call the API with user input & history
        const completion = await openai.createChatCompletion({
          model: 'gpt-3.5-turbo',
          messages: messages,
        });

        // Get completion text/content
        const completionText = completion.data.choices[0].message.content;

        if (userInput.toLowerCase() === 'exit') {
          console.log(colors.green('Bot: ') + completionText);
          return;
        }

        console.log(colors.green('Bot: ') + completionText);

        // Update history with user input and assistant response
        chatHistory.push(['user', userInput]);
        chatHistory.push(['assistant', completionText]);

        // Break out of the retry loop if successful
        break;
      } catch (error) {
        if (error.response && error.response.status === 429) {
          console.error(colors.red('Rate limit exceeded, retrying in 5 seconds...'));
          await sleep(RETRY_DELAY); // Wait before retrying
        } else {
          console.error(colors.red(error));
          break; // Exit retry loop for other errors
        }
      }
    }
  }
}

main();
