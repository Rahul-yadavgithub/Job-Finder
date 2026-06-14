import { AIService } from './AIService';
import { OpenRouterProvider } from './OpenRouterProvider';

// Factory for getting the default AI service
export const getAIService = (): AIService => {
  return new OpenRouterProvider();
};

export * from './AIService';
