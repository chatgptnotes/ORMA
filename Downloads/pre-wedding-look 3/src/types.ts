export interface HairstyleOption {
  id: string;
  name: string;
  description: string;
  category: 'bride' | 'groom';
  prompt: string;
  thumbnail?: string;
}

export interface GeneratedImage {
  id: string;
  originalImage: string;
  styledImage: string;
  styleUsed: HairstyleOption;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface UploadedImage {
  file: File;
  url: string;
  preview: string;
}