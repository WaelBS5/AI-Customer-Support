import { NextResponse } from "next/server";
import OpenAI from "openai";

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = `
You are a highly skilled software engineering interviewer. Your role is to simulate a mock technical interview for software engineering candidates. 
Your responses should be clear, precise, and professional, and you should aim to challenge the candidate while also providing constructive feedback. 
Ask questions related to algorithms, data structures, system design, coding practices, and other relevant topics in software engineering interviews. 
If the candidate's response is incomplete or incorrect, offer hints or guide them towards the correct approach. 
Always encourage the candidate to explain their thought process and to write code where necessary. 
Be friendly, but maintain a focus on preparing the candidate for real-world technical interviews.`

// POST function to handle incoming requests
export async function POST(req) {
    const openai = new OpenAI() // Create a new instance of the OpenAI client
    const data = await req.json() // Parse the JSON body of the incoming request
  
    // Create a chat completion request to the OpenAI API
    const completion = await openai.chat.completions.create({
      messages: [{role: 'system', content: systemPrompt}, ...data], // Include the system prompt and user messages
      model: 'gpt-4o', // Specify the model to use
      stream: true, // Enable streaming responses
    })
  
    // Create a ReadableStream to handle the streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder() // Create a TextEncoder to convert strings to Uint8Array
        try {
          // Iterate over the streamed chunks of the response
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content // Extract the content from the chunk
            if (content) {
              const text = encoder.encode(content) // Encode the content to Uint8Array
              controller.enqueue(text) // Enqueue the encoded text to the stream
            }
          }
        } catch (err) {
          controller.error(err) // Handle any errors that occur during streaming
        } finally {
          controller.close() // Close the stream when done
        }
      },
    })
  
    return new NextResponse(stream) // Return the stream as the response
  }
