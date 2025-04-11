# AI Setup Guide

This guide will help you set up the AI features in Budget Buddy, which include personalized financial insights using various AI providers and a financial assistant chat feature.

## 1. Set up the Database Tables

Before using the AI features, you need to set up the required database tables in your Supabase project.

1. Go to your [Supabase dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to the SQL Editor (in the left sidebar)
4. Create a new query
5. Copy and paste the contents of the `setup-ai-tables.sql` file from this project:

```sql
-- Add ai_settings column to profiles table if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS ai_settings JSONB DEFAULT '{"google_api_key":"", "mistral_api_key":"", "anthropic_api_key":"", "groq_api_key":"", "deepseek_api_key":"", "llama_api_key":"", "cohere_api_key":"", "gemini_api_key":"", "qwen_api_key":"", "openrouter_api_key":"", "enabled":false, "defaultModel":{"provider":"mistral", "model":"mistral-small"}}'::jsonb;

-- Create ai_conversations table
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL, 
    last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for faster queries by user_id
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);

-- Create row level security policies
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- Policy to only allow users to see their own conversations
CREATE POLICY "Users can view their own conversations" ON ai_conversations
    FOR SELECT USING (auth.uid() = user_id);

-- Policy to only allow users to insert their own conversations
CREATE POLICY "Users can insert their own conversations" ON ai_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to only allow users to update their own conversations
CREATE POLICY "Users can update their own conversations" ON ai_conversations
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy to only allow users to delete their own conversations
CREATE POLICY "Users can delete their own conversations" ON ai_conversations
    FOR DELETE USING (auth.uid() = user_id);
```

6. Click "Run" to execute the query
7. You should see a success message indicating the tables were created

## 2. Get API Keys for AI Providers

Budget Buddy supports multiple AI providers for the chat assistant feature. You can choose which provider(s) you want to use based on your preferences.

### Gemini (Google AI) API - For Financial Insights & Chat

1. Go to [Google AI Studio](https://ai.google.dev/)
2. Sign in with your Google account
3. Click on "Get API key" in the top right corner
4. Create a new API key or use an existing one
5. Copy the API key for later use

### Mistral AI API

1. Go to [Mistral AI Platform](https://console.mistral.ai/)
2. Create an account or sign in
3. Navigate to the API section
4. Generate a new API key
5. Copy the API key for later use

### Claude (Anthropic) API

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create an account or sign in
3. Navigate to the API Keys section
4. Generate a new API key
5. Copy the API key for later use

### Groq API

1. Go to [Groq Cloud](https://console.groq.com/)
2. Create an account or sign in
3. Navigate to the API Keys section
4. Generate a new API key
5. Copy the API key for later use

### DeepSeek API

1. Go to [DeepSeek AI Platform](https://platform.deepseek.ai/)
2. Create an account or sign in
3. Navigate to the API Keys section
4. Generate a new API key
5. Copy the API key for later use

### Llama API

1. Go to the Llama API provider website
2. Create an account or sign in
3. Navigate to the API Keys section
4. Generate a new API key
5. Copy the API key for later use

### Cohere API

1. Go to [Cohere Platform](https://dashboard.cohere.com/)
2. Create an account or sign in
3. Navigate to the API Keys section
4. Generate a new API key
5. Copy the API key for later use

### Qwen API

1. Go to [Alibaba Cloud Dashscope](https://dashscope.aliyun.com/)
2. Create an account or sign in
3. Navigate to the API Key Management section
4. Generate a new API key
5. Copy the API key for later use

### OpenRouter API

1. Go to [OpenRouter](https://openrouter.ai/)
2. Create an account or sign in
3. Navigate to the API Keys section
4. Generate a new API key
5. Copy the API key for later use
6. This service lets you access multiple AI models with a single API key

## 3. Configure in the App

1. Log in to your Budget Buddy application
2. Navigate to Settings
3. Scroll down to the "AI Assistant Settings" section
4. Enable the AI Assistant
5. Choose your preferred AI provider and model from the dropdown
6. Enter the API keys for the providers you want to use
7. Save your changes

## 4. Using AI Features

Once configured, you can access AI features by:

1. Navigate to the "AI Insights" section in the sidebar
2. View personalized financial insights generated by Google AI
3. Chat with the financial assistant powered by your chosen AI provider
4. Get personalized advice, suggestions, and predictions based on your financial data
5. **Change AI Providers and Models on the Fly**: Select a different provider or model using the dropdowns in the chat interface to adjust for your current needs

## About AI Providers and Models

Different AI providers have different strengths and capabilities:

### Mistral AI Models
- **Mistral Tiny**: Best for simple questions, fastest response time, lowest token usage
- **Mistral Small**: Good for general financial questions and advice
- **Mistral Medium**: Better for complex financial analysis and detailed explanations
- **Mistral Large**: Best for sophisticated financial planning and in-depth analysis

### Claude (Anthropic) Models
- **Claude 3 Haiku**: Fast responses, good for simple financial questions
- **Claude 3 Sonnet**: Balanced performance for most financial tasks
- **Claude 3 Opus**: Most powerful Claude model, best for complex analysis

### Groq Models
- **Llama 3 8B**: Extremely fast processing, good for general questions
- **Llama 3 70B**: More powerful with deeper reasoning capabilities
- **Mixtral 8x7B**: Balanced performance with good reasoning

### DeepSeek Models
- **DeepSeek Chat**: General purpose chat model for financial advice
- **DeepSeek Coder**: Specialized for budget calculations and financial formulas

### Llama Models
- **Llama 2** (various sizes): Older generation models with good performance
- **Llama 3** (various sizes): Newer generation with improved reasoning

### Cohere Models
- **Command**: Balanced performance for most tasks
- **Command Light**: Faster, more efficient version
- **Command R/R+**: More advanced reasoning capabilities

### Gemini Models
- **Gemini Pro**: Google's versatile model for general financial advice
- **Gemini 1.5 Pro**: More advanced with better understanding of complex questions
- **Gemini 1.5 Flash**: Faster model with good balance of speed and quality

### Qwen Models
- **Qwen Turbo**: Fast, efficient model good for everyday financial questions
- **Qwen Plus**: Enhanced capabilities for more detailed financial analysis
- **Qwen Max**: Most powerful Qwen model for complex financial planning

### OpenRouter
- OpenRouter provides access to models from various providers through a single API
- You can select from models like Claude, Gemini, Llama, and more
- Useful for comparing different models or accessing premium models more easily

## How to Choose a Model

- For quick questions and simple advice, choose smaller/faster models
- For detailed financial planning or complex analysis, choose larger/more powerful models
- Different providers may excel at different types of financial tasks
- You can switch between models at any time to compare responses

## Troubleshooting

If you encounter issues:

1. Ensure your API keys are correct and have not expired
2. Verify you've run the SQL setup script in your Supabase project successfully
3. Check your browser console for any error messages
4. Try refreshing the page or signing out and back in
5. Ensure your account has sufficient credits/quota for the AI APIs you're using

## Privacy Notice

Your financial data is processed by the AI models to provide personalized insights. All processing happens through secure API calls, and your API keys are stored securely in your user profile. The AI providers do not store your financial data after processing.

## Chat Assistant

Budget Buddy supports multiple AI providers for the chat assistant feature. You can choose which provider(s) you want to use based on your preferences.

## Testing the AI Features

1. Log in to your Budget Buddy application
2. Navigate to the "AI Insights" section in the sidebar
3. View personalized financial insights generated by Google AI
4. Chat with the financial assistant powered by your chosen AI provider
5. Get personalized advice, suggestions, and predictions based on your financial data
6. **Change AI Providers and Models on the Fly**: Select a different provider or model using the dropdowns in the chat interface to adjust for your current needs 