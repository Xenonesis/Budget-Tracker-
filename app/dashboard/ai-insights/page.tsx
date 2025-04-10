"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUserPreferences } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { 
  isAIEnabled, 
  generateGoogleAIInsights, 
  chatWithAI,
  AIMessage, 
  FinancialInsight, 
  getAIConversations, 
  saveAIConversation,
  getUserAISettings,
  AIProvider,
  AIModel,
  ModelConfig
} from "@/lib/ai";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  PiggyBank,
  Send,
  MessageCircle,
  LucideIcon,
  RefreshCw,
  Settings
} from "lucide-react";

// Icons for different insight types
const InsightIcons: Record<string, LucideIcon> = {
  spending_pattern: TrendingUp,
  saving_suggestion: PiggyBank,
  budget_warning: AlertTriangle,
  investment_tip: Lightbulb,
};

export default function AIInsightsPage() {
  const router = useRouter();
  const { userId } = useUserPreferences();
  const [aiEnabled, setAiEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [insights, setInsights] = useState<FinancialInsight[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<AIMessage[]>([
    { role: "system", content: "I'm your financial assistant. How can I help you with your budget and finances today?" }
  ]);
  const [userMessage, setUserMessage] = useState<string>("");
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [insightLoading, setInsightLoading] = useState<boolean>(false);
  const [setupNeeded, setSetupNeeded] = useState<boolean>(false);
  const [aiSettings, setAiSettings] = useState<any>(null);
  const [currentModelConfig, setCurrentModelConfig] = useState<ModelConfig>({
    provider: 'mistral',
    model: 'mistral-small'
  });
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);

  useEffect(() => {
    if (userId) {
      checkAIEnabled();
      fetchInsightsAndChats();
      fetchAISettings();
    }
  }, [userId]);

  const fetchAISettings = async () => {
    if (!userId) return;
    
    try {
      const settings = await getUserAISettings(userId);
      setAiSettings(settings);
      
      // Initialize current model from settings
      if (settings?.defaultModel) {
        setCurrentModelConfig(settings.defaultModel);
      } else if (settings?.mistral_model) {
        // Legacy support
        setCurrentModelConfig({
          provider: 'mistral',
          model: settings.mistral_model as AIModel
        });
      }
      
      // Always provide all providers, even if API keys aren't configured yet
      // This allows users to see what options are available
      const allProviders = ['mistral', 'anthropic', 'groq', 'deepseek', 'llama', 'cohere', 'gemini', 'qwen', 'openrouter'];
      
      // Check which providers have API keys (for the "available" badge/indicator)
      const configuredProviders: string[] = [];
      if (settings?.mistral_api_key) configuredProviders.push('mistral');
      if (settings?.anthropic_api_key) configuredProviders.push('anthropic');
      if (settings?.groq_api_key) configuredProviders.push('groq');
      if (settings?.deepseek_api_key) configuredProviders.push('deepseek');
      if (settings?.llama_api_key) configuredProviders.push('llama');
      if (settings?.cohere_api_key) configuredProviders.push('cohere');
      if (settings?.gemini_api_key || settings?.google_api_key) configuredProviders.push('gemini');
      if (settings?.qwen_api_key) configuredProviders.push('qwen');
      if (settings?.openrouter_api_key) configuredProviders.push('openrouter');
      
      setAvailableProviders(configuredProviders);
    } catch (error) {
      console.error("Error fetching AI settings:", error);
    }
  };

  const checkAIEnabled = async () => {
    if (!userId) return;
    
    try {
      const enabled = await isAIEnabled(userId);
      setAiEnabled(enabled);
      
      if (!enabled) {
        toast.info("AI features are not enabled. Please configure your API keys in settings.");
      }
    } catch (error) {
      console.error("Error checking AI enabled status:", error);
      setSetupNeeded(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchInsightsAndChats = async () => {
    if (!userId) return;
    
    setLoading(true);
    
    try {
      // Fetch transactions and budgets for AI analysis
      const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(100);
        
      const { data: budgets } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", userId);
      
      // Generate insights
      if (transactions && budgets) {
        try {
          const generatedInsights = await generateGoogleAIInsights(
            userId, 
            transactions, 
            budgets
          );
          
          if (generatedInsights) {
            setInsights(generatedInsights);
          }
        } catch (error) {
          console.error("Error generating insights:", error);
          toast.error("Failed to generate AI insights");
        }
      }
      
      // Fetch past AI conversations
      try {
        const pastConversations = await getAIConversations(userId);
        setConversations(pastConversations);
      } catch (error) {
        console.error("Error fetching conversations:", error);
        // This is not critical, so just log it
      }
      
    } catch (error) {
      console.error("Error fetching AI data:", error);
      toast.error("Failed to load data for AI analysis");
      setSetupNeeded(true);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeModelConfig = async (provider?: string, model?: string) => {
    const newConfig = { ...currentModelConfig };
    
    if (provider) {
      newConfig.provider = provider as AIProvider;
      // Set default model for the provider if not specified
      if (!model) {
        newConfig.model = getDefaultModelForProvider(provider);
      }
    }
    
    if (model) {
      newConfig.model = model as AIModel;
    }
    
    setCurrentModelConfig(newConfig);
    
    // Save the setting if we have a user ID
    if (userId && aiSettings) {
      try {
        const updatedSettings = {
          ...aiSettings,
          defaultModel: newConfig
        };
        
        // Update in Supabase
        const { error } = await supabase
          .from("profiles")
          .update({
            ai_settings: updatedSettings
          })
          .eq("id", userId);
          
        if (error) {
          console.error("Error updating AI settings:", error);
          toast.error("Failed to save model preference");
        } else {
          setAiSettings(updatedSettings);
          toast.success(`Switched to ${getModelDisplayName(newConfig)}`);
        }
      } catch (error) {
        console.error("Error updating model:", error);
      }
    }
  };

  const getDefaultModelForProvider = (provider: string): AIModel => {
    switch (provider) {
      case 'mistral': return 'mistral-small';
      case 'anthropic': return 'claude-3-haiku';
      case 'groq': return 'llama3-8b';
      case 'deepseek': return 'deepseek-chat';
      case 'llama': return 'llama-3-8b';
      case 'cohere': return 'command';
      case 'gemini': return 'gemini-1.5-flash';
      case 'qwen': return 'qwen-turbo';
      case 'openrouter': return 'openrouter-default';
      default: return 'mistral-small';
    }
  };
  
  const getModelDisplayName = (config: ModelConfig): string => {
    const providerName = getProviderDisplayName(config.provider);
    const modelName = config.model.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    return `${providerName} - ${modelName}`;
  };
  
  const getProviderDisplayName = (provider: string): string => {
    switch(provider) {
      case 'mistral': return 'Mistral AI';
      case 'anthropic': return 'Claude';
      case 'groq': return 'Groq';
      case 'deepseek': return 'DeepSeek';
      case 'llama': return 'Llama';
      case 'cohere': return 'Cohere';
      case 'gemini': return 'Gemini';
      case 'qwen': return 'Qwen';
      case 'openrouter': return 'OpenRouter';
      default: return provider;
    }
  };

  const handleSendMessage = async () => {
    if (!userMessage.trim() || !userId || !aiEnabled) return;
    
    // Check if the selected provider has an API key
    const hasApiKey = availableProviders.includes(currentModelConfig.provider);
    if (!hasApiKey) {
      toast.error(`${getProviderDisplayName(currentModelConfig.provider)} API key not configured. Please add it in Settings.`);
      return;
    }
    
    setChatLoading(true);
    
    // Add user message to chat
    const newMessages: AIMessage[] = [
      ...chatMessages,
      { role: "user" as const, content: userMessage }
    ];
    
    setChatMessages(newMessages);
    setUserMessage("");
    
    try {
      // Get response from the selected AI provider
      const response = await chatWithAI(userId, newMessages, currentModelConfig);
      
      if (response) {
        // Add assistant response to chat
        const updatedMessages: AIMessage[] = [
          ...newMessages,
          { role: "assistant" as const, content: response }
        ];
        
        setChatMessages(updatedMessages);
        
        // Save conversation
        await saveAIConversation(userId, updatedMessages);
      } else {
        toast.error("Failed to get response from AI assistant");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Error communicating with AI assistant");
    } finally {
      setChatLoading(false);
    }
  };

  const refreshInsights = async () => {
    if (!userId || !aiEnabled) return;
    
    setInsightLoading(true);
    
    try {
      // Fetch fresh data and regenerate insights
      const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(100);
        
      const { data: budgets } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", userId);
      
      if (transactions && budgets) {
        const generatedInsights = await generateGoogleAIInsights(
          userId, 
          transactions, 
          budgets
        );
        
        if (generatedInsights) {
          setInsights(generatedInsights);
          toast.success("Insights refreshed successfully");
        } else {
          toast.error("Unable to generate new insights");
        }
      }
    } catch (error) {
      console.error("Error refreshing insights:", error);
      toast.error("Failed to refresh insights");
    } finally {
      setInsightLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (setupNeeded) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <Card className="border-2 border-dashed border-muted-foreground/25">
          <CardHeader>
            <CardTitle>Database Setup Required</CardTitle>
            <CardDescription>
              The AI features require database setup before they can be used.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4 p-8 text-center">
            <div className="rounded-full bg-muted p-6">
              <Settings className="h-12 w-12 text-muted-foreground" />
            </div>
            <p className="max-w-md text-muted-foreground">
              Please run the SQL script provided in <code>setup-ai-tables.sql</code> in your Supabase database
              to create the required tables for AI features.
            </p>
          </CardContent>
          <CardFooter className="justify-center flex flex-col space-y-2">
            <Button onClick={() => router.push('/dashboard/settings')} className="w-full">
              Go to Settings
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!aiEnabled) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <Card className="border-2 border-dashed border-muted-foreground/25">
          <CardHeader>
            <CardTitle>AI Features Not Enabled</CardTitle>
            <CardDescription>
              Configure your AI settings to access personalized financial insights and assistance.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4 p-8 text-center">
            <div className="rounded-full bg-muted p-6">
              <Settings className="h-12 w-12 text-muted-foreground" />
            </div>
            <p className="max-w-md text-muted-foreground">
              To use AI features, you need to provide Google AI and/or Mistral AI API keys in your settings.
              These services will analyze your financial data to provide personalized insights, suggestions,
              and an interactive chat assistant.
            </p>
          </CardContent>
          <CardFooter className="justify-center">
            <Button onClick={() => router.push('/dashboard/settings')}>
              Configure AI Settings
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold md:text-3xl">AI Financial Assistant</h1>
        <Button 
          variant="outline" 
          onClick={refreshInsights}
          disabled={insightLoading}
        >
          {insightLoading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-primary"></div>
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Insights
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* AI Insights Column */}
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-xl font-semibold">Financial Insights</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {insights.length > 0 ? (
              insights.map((insight, index) => {
                const Icon = InsightIcons[insight.type] || Lightbulb;
                
                return (
                  <Card key={index} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold">{insight.title}</CardTitle>
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardDescription>
                        {insight.type.split("_").map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(" ")} 
                        {insight.confidence > 0.85 ? " • High confidence" : 
                         insight.confidence > 0.6 ? " • Medium confidence" : " • Low confidence"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{insight.description}</p>
                      {insight.relevantCategories && insight.relevantCategories.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {insight.relevantCategories.map((category, i) => (
                            <span key={i} className="rounded-full bg-secondary/20 px-2 py-1 text-xs">
                              {category}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
                <Lightbulb className="mb-4 h-10 w-10 text-muted-foreground" />
                <h3 className="text-lg font-medium">No Insights Available</h3>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  We need more transaction data to generate meaningful insights. Add more transactions or click
                  "Refresh Insights" to try again.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Assistant Column */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">Financial Assistant</h2>
          <Card className="flex h-[600px] flex-col">
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">Chat with AI Assistant</CardTitle>
                <div className="flex space-x-2 max-w-[360px]">
                  {/* Always show provider selector */}
                  <select
                    value={currentModelConfig.provider}
                    onChange={(e) => handleChangeModelConfig(e.target.value)}
                    className="rounded-md border border-input bg-transparent px-2 py-1 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={chatLoading}
                    aria-label="Select AI provider"
                    title="Select AI provider"
                  >
                    <option value="mistral" className={!availableProviders.includes('mistral') ? 'text-gray-400 italic' : ''}>
                      Mistral AI {availableProviders.includes('mistral') ? '✓' : '(no key)'}
                    </option>
                    <option value="anthropic" className={!availableProviders.includes('anthropic') ? 'text-gray-400 italic' : ''}>
                      Claude {availableProviders.includes('anthropic') ? '✓' : '(no key)'}
                    </option>
                    <option value="groq" className={!availableProviders.includes('groq') ? 'text-gray-400 italic' : ''}>
                      Groq {availableProviders.includes('groq') ? '✓' : '(no key)'}
                    </option>
                    <option value="deepseek" className={!availableProviders.includes('deepseek') ? 'text-gray-400 italic' : ''}>
                      DeepSeek {availableProviders.includes('deepseek') ? '✓' : '(no key)'}
                    </option>
                    <option value="llama" className={!availableProviders.includes('llama') ? 'text-gray-400 italic' : ''}>
                      Llama {availableProviders.includes('llama') ? '✓' : '(no key)'}
                    </option>
                    <option value="cohere" className={!availableProviders.includes('cohere') ? 'text-gray-400 italic' : ''}>
                      Cohere {availableProviders.includes('cohere') ? '✓' : '(no key)'}
                    </option>
                    <option value="gemini" className={!availableProviders.includes('gemini') ? 'text-gray-400 italic' : ''}>
                      Gemini {availableProviders.includes('gemini') ? '✓' : '(no key)'}
                    </option>
                    <option value="qwen" className={!availableProviders.includes('qwen') ? 'text-gray-400 italic' : ''}>
                      Qwen {availableProviders.includes('qwen') ? '✓' : '(no key)'}
                    </option>
                    <option value="openrouter" className={!availableProviders.includes('openrouter') ? 'text-gray-400 italic' : ''}>
                      OpenRouter {availableProviders.includes('openrouter') ? '✓' : '(no key)'}
                    </option>
                  </select>
                  <select
                    value={currentModelConfig.model}
                    onChange={(e) => handleChangeModelConfig(undefined, e.target.value)}
                    className="rounded-md border border-input bg-transparent px-2 py-1 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={chatLoading}
                    aria-label="Select AI model"
                    title="Select AI model"
                  >
                    {renderModelOptions(currentModelConfig.provider)}
                  </select>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                {chatMessages.slice(1).map((message, index) => (
                  <div 
                    key={index} 
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
                
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg bg-muted p-3">
                      <div className="flex space-x-2">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50"></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 delay-75"></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 delay-150"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="border-t bg-card p-3">
              <form 
                className="flex w-full items-center space-x-2" 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
              >
                <input
                  type="text"
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  placeholder="Ask about your finances..."
                  className="flex-1 rounded-lg border border-input bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={chatLoading}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={chatLoading || !userMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send message</span>
                </Button>
              </form>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {/* Past Conversations Section */}
      {conversations.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-semibold">Past Conversations</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {conversations.slice(0, 6).map((conversation, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">
                      Conversation {index + 1}
                    </CardTitle>
                    <MessageCircle className="h-5 w-5 text-primary" />
                  </div>
                  <CardDescription>
                    {new Date(conversation.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-32 overflow-hidden text-ellipsis">
                  {conversation.messages
                    .filter((msg: AIMessage) => msg.role !== 'system')
                    .slice(0, 2)
                    .map((msg: AIMessage, i: number) => (
                      <p key={i} className="text-sm text-muted-foreground">
                        <span className="font-semibold">
                          {msg.role === 'user' ? 'You: ' : 'Assistant: '}
                        </span>
                        {msg.content.substring(0, 60)}
                        {msg.content.length > 60 ? '...' : ''}
                      </p>
                    ))}
                  {conversation.messages.filter((msg: AIMessage) => msg.role !== 'system').length > 2 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      + {conversation.messages.filter((msg: AIMessage) => msg.role !== 'system').length - 2} more messages
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Add this helper function to render model options per provider
const renderModelOptions = (provider: string) => {
  switch (provider) {
    case 'mistral':
      return (
        <>
          <option value="mistral-tiny">Mistral Tiny</option>
          <option value="mistral-small">Mistral Small</option>
          <option value="mistral-medium">Mistral Medium</option>
          <option value="mistral-large-latest">Mistral Large</option>
        </>
      );
    case 'anthropic':
      return (
        <>
          <option value="claude-3-haiku">Claude 3 Haiku</option>
          <option value="claude-3-sonnet">Claude 3 Sonnet</option>
          <option value="claude-3-opus">Claude 3 Opus</option>
        </>
      );
    case 'groq':
      return (
        <>
          <option value="llama3-8b">Llama 3 8B</option>
          <option value="llama3-70b">Llama 3 70B</option>
          <option value="mixtral-8x7b">Mixtral 8x7B</option>
        </>
      );
    case 'deepseek':
      return (
        <>
          <option value="deepseek-chat">DeepSeek Chat</option>
          <option value="deepseek-coder">DeepSeek Coder</option>
        </>
      );
    case 'llama':
      return (
        <>
          <option value="llama-2-7b">Llama 2 7B</option>
          <option value="llama-2-13b">Llama 2 13B</option>
          <option value="llama-2-70b">Llama 2 70B</option>
          <option value="llama-3-8b">Llama 3 8B</option>
          <option value="llama-3-70b">Llama 3 70B</option>
        </>
      );
    case 'cohere':
      return (
        <>
          <option value="command">Command</option>
          <option value="command-light">Command Light</option>
          <option value="command-r">Command R</option>
          <option value="command-r-plus">Command R+</option>
        </>
      );
    case 'gemini':
      return (
        <>
          <option value="gemini-pro">Gemini Pro</option>
          <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
          <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
        </>
      );
    case 'qwen':
      return (
        <>
          <option value="qwen-turbo">Qwen Turbo</option>
          <option value="qwen-plus">Qwen Plus</option>
          <option value="qwen-max">Qwen Max</option>
        </>
      );
    case 'openrouter':
      return (
        <>
          <option value="openrouter-default">OpenRouter Default</option>
          <option value="anthropic/claude-3-opus">Claude 3 Opus</option>
          <option value="google/gemini-pro">Gemini Pro</option>
          <option value="meta-llama/llama-3-70b-instruct">Llama 3 70B</option>
        </>
      );
    default:
      return <option value="mistral-small">Mistral Small</option>;
  }
}; 