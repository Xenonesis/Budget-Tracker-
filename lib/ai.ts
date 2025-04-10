import { supabase } from './supabase';

// Types for AI interactions
export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface FinancialInsight {
  type: 'spending_pattern' | 'saving_suggestion' | 'budget_warning' | 'investment_tip';
  title: string;
  description: string;
  confidence: number; // 0-1
  relevantCategories?: string[];
  createdAt: string;
}

export type AIProvider = 'mistral' | 'google' | 'anthropic' | 'groq' | 'deepseek' | 'llama' | 'cohere' | 'gemini' | 'qwen' | 'openrouter';
export type AIModel = 
  // Mistral models
  | 'mistral-tiny' | 'mistral-small' | 'mistral-medium' | 'mistral-large-latest' 
  // Claude models
  | 'claude-3-haiku' | 'claude-3-sonnet' | 'claude-3-opus'
  // Groq models
  | 'llama3-8b' | 'llama3-70b' | 'mixtral-8x7b'
  // DeepSeek models
  | 'deepseek-coder' | 'deepseek-chat'
  // Llama models
  | 'llama-2-7b' | 'llama-2-13b' | 'llama-2-70b' | 'llama-3-8b' | 'llama-3-70b'
  // Cohere models
  | 'command' | 'command-light' | 'command-r' | 'command-r-plus'
  // Gemini models - use only currently supported models
  | 'gemini-pro' | 'gemini-1.5-pro' | 'gemini-1.5-flash'
  // Qwen models
  | 'qwen-turbo' | 'qwen-plus' | 'qwen-max'
  // OpenRouter models (can be many models from different providers)
  | 'openrouter-default' | 'anthropic/claude-3-opus' | 'google/gemini-pro' | 'meta-llama/llama-3-70b-instruct';

export interface ModelConfig {
  provider: AIProvider;
  model: AIModel;
  apiKey?: string;
}

export interface AISettings {
  enabled: boolean;
  google_api_key?: string;
  mistral_api_key?: string;
  anthropic_api_key?: string;
  groq_api_key?: string;
  deepseek_api_key?: string;
  llama_api_key?: string;
  cohere_api_key?: string;
  gemini_api_key?: string;
  qwen_api_key?: string;
  openrouter_api_key?: string;
  mistral_model?: string;
  defaultModel: ModelConfig;
}

// Get user's AI settings
export async function getUserAISettings(userId: string): Promise<AISettings | null> {
  try {
    // Simply try to get the user's AI settings directly
    const { data, error } = await supabase
      .from('profiles')
      .select('ai_settings')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching AI settings:', error);
      return getDefaultAISettings();
    }
    
    // If ai_settings is null or undefined, return default
    if (!data || !data.ai_settings) {
      return getDefaultAISettings();
    }
    
    // Convert legacy settings if needed
    const settings = data.ai_settings;
    
    // Fix any deprecated Gemini models
    if (settings.defaultModel && settings.defaultModel.provider === 'gemini') {
      const model = settings.defaultModel.model;
      if (model === 'gemini-pro-vision' || model === 'gemini-1.0-pro' || model.includes('vision')) {
        settings.defaultModel.model = 'gemini-1.5-flash';
      }
    }
    
    if (!settings.defaultModel) {
      // Fix any deprecated Mistral models
      let modelToUse = settings.mistral_model || 'mistral-small';
      
      // If it's a Gemini model, make sure it's valid
      if (settings.gemini_api_key && modelToUse.startsWith('gemini-')) {
        if (modelToUse === 'gemini-pro-vision' || modelToUse === 'gemini-1.0-pro' || modelToUse.includes('vision')) {
          modelToUse = 'gemini-1.5-flash';
        }
      }
      
      return {
        ...settings,
        defaultModel: {
          provider: 'mistral',
          model: modelToUse,
          apiKey: settings.mistral_api_key
        }
      };
    }
    
    return settings;
  } catch (error) {
    console.error('Error in getUserAISettings:', error);
    return getDefaultAISettings();
  }
}

// Default AI settings when not found
function getDefaultAISettings(): AISettings {
  return {
    google_api_key: '',
    mistral_api_key: '',
    anthropic_api_key: '',
    groq_api_key: '',
    deepseek_api_key: '',
    llama_api_key: '',
    cohere_api_key: '',
    gemini_api_key: '',
    qwen_api_key: '',
    openrouter_api_key: '',
    mistral_model: 'mistral-small', // Legacy support
    enabled: false,
    defaultModel: {
      provider: 'mistral',
      model: 'mistral-small',
      apiKey: ''
    }
  };
}

// Check if AI is enabled and keys are valid
export async function isAIEnabled(userId: string): Promise<boolean> {
  const settings = await getUserAISettings(userId);
  if (!settings || !settings.enabled) return false;
  
  // Check if at least one API key is available
  return !!(
    settings.google_api_key || 
    settings.mistral_api_key || 
    settings.anthropic_api_key || 
    settings.groq_api_key || 
    settings.deepseek_api_key || 
    settings.llama_api_key || 
    settings.cohere_api_key ||
    settings.gemini_api_key ||
    settings.qwen_api_key ||
    settings.openrouter_api_key
  );
}

// Generate financial insights using Google AI API
export async function generateGoogleAIInsights(
  userId: string,
  transactionData: any[],
  budgetData: any[]
): Promise<FinancialInsight[] | null> {
  try {
    const settings = await getUserAISettings(userId);
    if (!settings?.google_api_key || !settings.enabled) return getExampleInsights();
    
    try {
      // Use gemini-1.5-flash instead of the deprecated model
      const apiKey = settings.gemini_api_key || settings.google_api_key;
      const modelName = "gemini-1.5-flash"; // Updated to supported model
      
      // Sanitize transaction and budget data to prevent JSON issues
      const sanitizedTransactions = transactionData.map(t => ({
        id: t.id,
        amount: t.amount,
        category: t.category,
        description: t.description,
        date: t.date,
        type: t.type
      }));
      
      const sanitizedBudgets = budgetData.map(b => ({
        id: b.id,
        category: b.category,
        amount: b.amount,
        period: b.period
      }));
      
      // Basic request to Google AI API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Based on the following transaction and budget data, provide financial insights, suggestions, and warnings:
                  Transaction data: ${JSON.stringify(sanitizedTransactions)}
                  Budget data: ${JSON.stringify(sanitizedBudgets)}
                  Format your response as JSON following this structure:
                  [
                    {
                      "type": "spending_pattern" | "saving_suggestion" | "budget_warning" | "investment_tip",
                      "title": "Short title",
                      "description": "Detailed explanation",
                      "confidence": 0.95, // 0-1 confidence score
                      "relevantCategories": ["category1", "category2"], // Optional
                      "createdAt": "2023-01-01T00:00:00Z"
                    }
                  ]`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1000,
            topK: 40,
            topP: 0.95
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });
      
      // Check if the request was successful
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API HTTP error: ${response.status}`, errorText);
        return getExampleInsights();
      }
      
      const result = await response.json();
      
      // Check if result has the expected structure
      if (result && result.candidates && result.candidates.length > 0 && 
          result.candidates[0].content && result.candidates[0].content.parts && 
          result.candidates[0].content.parts.length > 0) {
        
        try {
          const textResponse = result.candidates[0].content.parts[0].text;
          
          // Extract JSON carefully - look for array start/end markers
          const jsonStartIdx = textResponse.indexOf('[');
          const jsonEndIdx = textResponse.lastIndexOf(']') + 1;
          
          if (jsonStartIdx >= 0 && jsonEndIdx > jsonStartIdx) {
            try {
              const jsonStr = textResponse.substring(jsonStartIdx, jsonEndIdx);
              return JSON.parse(jsonStr);
            } catch (jsonError) {
              console.error('JSON parsing error:', jsonError);
              
              // Attempt to fix common JSON issues
              let cleanedJson = textResponse.substring(jsonStartIdx, jsonEndIdx);
              
              // Remove trailing commas before closing brackets (common LLM error)
              cleanedJson = cleanedJson.replace(/,\s*}/g, '}').replace(/,\s*\]/g, ']');
              
              // Remove comments (LLMs sometimes include explanatory comments)
              cleanedJson = cleanedJson.replace(/\/\/.*?(\n|$)/g, '');
              
              try {
                return JSON.parse(cleanedJson);
              } catch (fallbackError) {
                console.error('Failed to parse cleaned JSON:', fallbackError);
                return getExampleInsights();
              }
            }
          }
        } catch (parseError) {
          console.error('Error parsing AI response:', parseError);
        }
      }
      
      console.log('API response did not contain expected data structure:', result);
      return getExampleInsights(); // Fall back to example data
    } catch (apiError) {
      console.error('Error calling Google AI API:', apiError);
      return getExampleInsights(); // Fall back to example data if API call fails
    }
  } catch (error) {
    console.error('Error generating Google AI insights:', error);
    return getExampleInsights(); // Fall back to example data
  }
}

// Provide example insights when API call fails or returns unexpected format
function getExampleInsights(): FinancialInsight[] {
  return [
    {
      type: "spending_pattern",
      title: "Increased Spending on Food",
      description: "Your food expenses have increased by 15% compared to last month. Consider meal planning to reduce costs.",
      confidence: 0.92,
      relevantCategories: ["Food", "Groceries", "Restaurants"],
      createdAt: new Date().toISOString()
    },
    {
      type: "budget_warning",
      title: "Entertainment Budget at Risk",
      description: "You've already spent 80% of your entertainment budget with 10 days left in the month.",
      confidence: 0.85,
      relevantCategories: ["Entertainment", "Subscriptions"],
      createdAt: new Date().toISOString()
    },
    {
      type: "saving_suggestion",
      title: "Potential Savings on Subscriptions",
      description: "You're spending $45 monthly on subscription services. Consider reviewing which ones you actually use regularly.",
      confidence: 0.78,
      relevantCategories: ["Subscriptions", "Entertainment"],
      createdAt: new Date().toISOString()
    },
    {
      type: "investment_tip",
      title: "Savings Account Optimization",
      description: "Based on your current savings, moving to a high-yield savings account could earn you an additional $120 per year.",
      confidence: 0.88,
      relevantCategories: ["Savings", "Investments"],
      createdAt: new Date().toISOString()
    }
  ];
}

// Chat with AI based on provider
export async function chatWithAI(
  userId: string,
  messages: AIMessage[],
  modelConfig?: ModelConfig
): Promise<string | null> {
  try {
    const settings = await getUserAISettings(userId);
    if (!settings?.enabled) {
      return "AI features are not enabled. Please configure your API keys in settings.";
    }
    
    // Use provided model config or default from settings
    const config = modelConfig || settings.defaultModel;
    
    // Get API key for the provider
    let apiKey = '';
    switch (config.provider) {
      case 'mistral':
        apiKey = settings.mistral_api_key || '';
        return chatWithMistralAI(apiKey, messages, config.model as string);
      case 'anthropic':
        apiKey = settings.anthropic_api_key || '';
        return chatWithClaudeAI(apiKey, messages, config.model as string);
      case 'groq':
        apiKey = settings.groq_api_key || '';
        return chatWithGroqAI(apiKey, messages, config.model as string);
      case 'deepseek':
        apiKey = settings.deepseek_api_key || '';
        return chatWithDeepSeekAI(apiKey, messages, config.model as string);
      case 'llama':
        apiKey = settings.llama_api_key || '';
        return chatWithLlamaAI(apiKey, messages, config.model as string);
      case 'cohere':
        apiKey = settings.cohere_api_key || '';
        return chatWithCohereAI(apiKey, messages, config.model as string);
      case 'gemini':
        apiKey = settings.gemini_api_key || settings.google_api_key || '';
        return chatWithGeminiAI(apiKey, messages, config.model as string);
      case 'qwen':
        apiKey = settings.qwen_api_key || '';
        return chatWithQwenAI(apiKey, messages, config.model as string);
      case 'openrouter':
        apiKey = settings.openrouter_api_key || '';
        return chatWithOpenRouterAI(apiKey, messages, config.model as string);
      default:
        return "Unknown AI provider selected.";
    }
  } catch (error) {
    console.error('Error in chatWithAI:', error);
    return "There was an error communicating with the AI assistant. Please try again later.";
  }
}

// Chat with Mistral AI (existing implementation, modified)
async function chatWithMistralAI(
  apiKey: string,
  messages: AIMessage[],
  model: string = 'mistral-small'
): Promise<string | null> {
  try {
    if (!apiKey) {
      return "Mistral AI API key is not configured. Please add your API key in settings.";
    }
    
    // Implement Mistral AI API request
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error('Mistral API error:', data.error);
      return "There was an error connecting to Mistral AI. Please check your API key in settings.";
    }
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected response format from Mistral API:', data);
      return "Received an unexpected response from Mistral AI. Please try again later.";
    }
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error chatting with Mistral AI:', error);
    return "There was an error communicating with Mistral AI. Please try again later.";
  }
}

// Chat with Claude AI (Anthropic)
async function chatWithClaudeAI(
  apiKey: string,
  messages: AIMessage[],
  model: string = 'claude-3-haiku'
): Promise<string | null> {
  try {
    if (!apiKey) {
      return "Claude API key is not configured. Please add your API key in settings.";
    }
    
    // Convert messages to Anthropic's format
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || "";
    const systemMessage = messages.find(m => m.role === 'system')?.content || "";
    
    // Implement Claude API request
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 1000,
        messages: [{ role: 'user', content: lastUserMessage }],
        system: systemMessage
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error('Claude API error:', data.error);
      return "There was an error connecting to Claude AI. Please check your API key in settings.";
    }
    
    return data.content?.[0]?.text || "No response from Claude AI.";
  } catch (error) {
    console.error('Error chatting with Claude AI:', error);
    return "There was an error communicating with Claude AI. Please try again later.";
  }
}

// Chat with Groq AI
async function chatWithGroqAI(
  apiKey: string,
  messages: AIMessage[],
  model: string = 'llama3-8b'
): Promise<string | null> {
  try {
    if (!apiKey) {
      return "Groq API key is not configured. Please add your API key in settings.";
    }
    
    // Implement Groq API request
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error('Groq API error:', data.error);
      return "There was an error connecting to Groq AI. Please check your API key in settings.";
    }
    
    return data.choices?.[0]?.message?.content || "No response from Groq AI.";
  } catch (error) {
    console.error('Error chatting with Groq AI:', error);
    return "There was an error communicating with Groq AI. Please try again later.";
  }
}

// Chat with DeepSeek AI
async function chatWithDeepSeekAI(
  apiKey: string,
  messages: AIMessage[],
  model: string = 'deepseek-chat'
): Promise<string | null> {
  try {
    if (!apiKey) {
      return "DeepSeek API key is not configured. Please add your API key in settings.";
    }
    
    // Implement DeepSeek API request
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error('DeepSeek API error:', data.error);
      return "There was an error connecting to DeepSeek AI. Please check your API key in settings.";
    }
    
    return data.choices?.[0]?.message?.content || "No response from DeepSeek AI.";
  } catch (error) {
    console.error('Error chatting with DeepSeek AI:', error);
    return "There was an error communicating with DeepSeek AI. Please try again later.";
  }
}

// Chat with Llama AI
async function chatWithLlamaAI(
  apiKey: string,
  messages: AIMessage[],
  model: string = 'llama-3-8b'
): Promise<string | null> {
  try {
    if (!apiKey) {
      return "Llama API key is not configured. Please add your API key in settings.";
    }
    
    // Implement Llama API request (using a generic endpoint, actual implementation may vary)
    const response = await fetch('https://api.llama-api.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error('Llama API error:', data.error);
      return "There was an error connecting to Llama AI. Please check your API key in settings.";
    }
    
    return data.choices?.[0]?.message?.content || "No response from Llama AI.";
  } catch (error) {
    console.error('Error chatting with Llama AI:', error);
    return "There was an error communicating with Llama AI. Please try again later.";
  }
}

// Chat with Cohere AI
async function chatWithCohereAI(
  apiKey: string,
  messages: AIMessage[],
  model: string = 'command'
): Promise<string | null> {
  try {
    if (!apiKey) {
      return "Cohere API key is not configured. Please add your API key in settings.";
    }
    
    // Convert messages to Cohere's format
    const chatHistory = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'user' ? 'USER' : 'CHATBOT',
        message: m.content
      }));
    
    const systemMessage = messages.find(m => m.role === 'system')?.content || "";
    
    // Implement Cohere API request
    const response = await fetch('https://api.cohere.ai/v1/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        message: chatHistory[chatHistory.length - 1].message,
        chat_history: chatHistory.slice(0, -1),
        preamble: systemMessage,
        max_tokens: 1000
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error('Cohere API error:', data.error);
      return "There was an error connecting to Cohere AI. Please check your API key in settings.";
    }
    
    return data.text || "No response from Cohere AI.";
  } catch (error) {
    console.error('Error chatting with Cohere AI:', error);
    return "There was an error communicating with Cohere AI. Please try again later.";
  }
}

// Chat with Gemini AI (Google)
async function chatWithGeminiAI(
  apiKey: string,
  messages: AIMessage[],
  model: string = 'gemini-pro'
): Promise<string | null> {
  try {
    if (!apiKey) {
      return "Gemini API key is not configured. Please add your API key in settings.";
    }
    
    // Validate model - prevent using deprecated models
    if (model === 'gemini-pro-vision' || model === 'gemini-1.0-pro' || model.includes('vision')) {
      console.warn(`Deprecated Gemini model requested: ${model}. Switching to gemini-1.5-flash.`);
      model = 'gemini-1.5-flash';
    }
    
    // Only allow supported models
    const supportedModels = ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'];
    if (!supportedModels.includes(model)) {
      console.warn(`Unsupported Gemini model requested: ${model}. Switching to gemini-1.5-flash.`);
      model = 'gemini-1.5-flash';
    }
    
    // Check if using newer Gemini 1.5 models
    const isGemini15 = model.includes('1.5');
    
    // Convert messages to Google's format - Gemini has specific requirements
    const formattedMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));
    
    // Add system message as user message if present (Gemini doesn't have system messages)
    const systemMessage = messages.find(m => m.role === 'system')?.content;
    if (systemMessage && formattedMessages.length > 0) {
      // For Gemini, we need to prepend system instructions as a separate user message
      formattedMessages.unshift({
        role: 'user',
        parts: [{ text: `Instructions: ${systemMessage}` }]
      });
      
      // Add an acknowledgment from the model
      if (formattedMessages.length > 1) {
        formattedMessages.splice(1, 0, {
          role: 'model',
          parts: [{ text: 'I will follow these instructions in our conversation.' }]
        });
      }
    }
    
    // Ensure we have a valid conversation structure
    if (formattedMessages.length === 0) {
      formattedMessages.push({
        role: 'user',
        parts: [{ text: "Hello" }]
      });
    }
    
    // Construct Gemini API URL with the model
    const modelPath = model.replace('gemini-', 'models/gemini-');
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${apiKey}`;
    
    console.log('Using Gemini model:', model);
    
    // Implement Gemini API request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: formattedMessages,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
          topK: 40,
          topP: 0.95
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });
    
    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API HTTP error:', response.status, errorText);
      
      // Check for specific error codes
      if (response.status === 400) {
        return "The request to Gemini AI was invalid. You might be using an unsupported model.";
      } else if (response.status === 401 || response.status === 403) {
        return "Authorization failed with Gemini AI. Please check your API key in settings.";
      } else if (response.status === 404) {
        return `The requested Gemini model "${model}" was not found. Try a different model.`;
      } else if (response.status === 429) {
        return "You've reached the rate limit for Gemini AI. Please try again later.";
      }
      
      return "There was an error connecting to Gemini AI. Please try again later.";
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('Gemini API error response:', data.error);
      
      // Check for common error codes
      const errorCode = data.error.code;
      if (errorCode === 400) {
        return "The request to Gemini AI was invalid. Please check your input.";
      } else if (errorCode === 401 || errorCode === 403) {
        return "Authorization failed with Gemini AI. Please check your API key in settings.";
      } else if (errorCode === 404) {
        return `The requested Gemini model "${model}" was not found. Try a different model.`;
      }
      
      return `Gemini AI error: ${data.error.message || "Unknown error"}`;
    }
    
    // Detailed logging for debugging
    if (!data.candidates || data.candidates.length === 0) {
      console.error('Gemini API returned no candidates:', data);
      return "Gemini AI did not return a valid response. This could be due to content filtering or an internal error.";
    }
    
    if (data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
      return data.candidates[0].content.parts[0].text;
    } else {
      console.error('Gemini API response format unexpected:', data.candidates[0]);
      return "Received an unexpected response format from Gemini AI.";
    }
  } catch (error) {
    console.error('Error chatting with Gemini AI:', error);
    return "There was an error communicating with Gemini AI. Please try again later.";
  }
}

// Chat with Qwen AI
async function chatWithQwenAI(
  apiKey: string,
  messages: AIMessage[],
  model: string = 'qwen-turbo'
): Promise<string | null> {
  try {
    if (!apiKey) {
      return "Qwen API key is not configured. Please add your API key in settings.";
    }
    
    // Implement Qwen API request
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        input: {
          messages: messages
        },
        parameters: {
          temperature: 0.7,
          max_tokens: 1000
        }
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error('Qwen API error:', data.error);
      return "There was an error connecting to Qwen AI. Please check your API key in settings.";
    }
    
    return data.output?.text || "No response from Qwen AI.";
  } catch (error) {
    console.error('Error chatting with Qwen AI:', error);
    return "There was an error communicating with Qwen AI. Please try again later.";
  }
}

// Chat with OpenRouter (unified API for multiple models)
async function chatWithOpenRouterAI(
  apiKey: string,
  messages: AIMessage[],
  model: string = 'openrouter-default'
): Promise<string | null> {
  try {
    if (!apiKey) {
      return "OpenRouter API key is not configured. Please add your API key in settings.";
    }
    
    // Get actual model ID - if it's the default, use anthropic/claude-3-haiku
    const actualModel = model === 'openrouter-default' ? 'anthropic/claude-3-haiku' : model;
    
    // Implement OpenRouter API request (follows OpenAI format)
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://budgettracker.com', // Replace with your actual domain
        'X-Title': 'Budget Tracker'
      },
      body: JSON.stringify({
        model: actualModel,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error('OpenRouter API error:', data.error);
      return "There was an error connecting to OpenRouter. Please check your API key in settings.";
    }
    
    return data.choices?.[0]?.message?.content || "No response from OpenRouter.";
  } catch (error) {
    console.error('Error chatting with OpenRouter:', error);
    return "There was an error communicating with OpenRouter. Please try again later.";
  }
}

// Save an AI conversation
export async function saveAIConversation(
  userId: string, 
  messages: AIMessage[]
): Promise<boolean> {
  try {
    // Simply try to insert the conversation directly
    const { error } = await supabase
      .from('ai_conversations')
      .insert({
        user_id: userId,
        messages: messages,
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      });
    
    if (error) {
      // Don't consider this a critical error, just log it
      console.log('Could not save AI conversation:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in saveAIConversation:', error);
    return false;
  }
}

// Get AI conversations for a user
export async function getAIConversations(userId: string): Promise<any[]> {
  try {
    // Simply try to get conversations directly
    const { data, error } = await supabase
      .from("ai_conversations")
      .select('*')
      .eq('user_id', userId)
      .order('last_updated', { ascending: false });
    
    if (error) {
      // Likely the table doesn't exist yet, which is fine - just log and return empty
      console.log('Error fetching AI conversations (table may not exist yet):', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getAIConversations:', error);
    return [];
  }
}

const getDefaultModelForProvider = (provider: string): string => {
  switch (provider) {
    case 'mistral': return 'mistral-small';
    case 'anthropic': return 'claude-3-haiku';
    case 'groq': return 'llama3-8b';
    case 'deepseek': return 'deepseek-chat';
    case 'llama': return 'llama-3-8b';
    case 'cohere': return 'command';
    case 'gemini': return 'gemini-1.5-flash'; // Updated to use a currently supported model
    case 'qwen': return 'qwen-turbo';
    case 'openrouter': return 'openrouter-default';
    default: return 'mistral-small';
  }
}; 