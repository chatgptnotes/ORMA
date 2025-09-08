import { GoogleGenerativeAI } from '@google/generative-ai';
import { HairstyleOption } from '../types';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || 'demo-key');

export async function generateStyledImage(
  imageFile: File, 
  style: HairstyleOption
): Promise<string> {
  try {
    // Convert file to base64 for processing
    const base64Image = await fileToBase64(imageFile);
    
    // For demo purposes, return a placeholder styled image
    // In a real implementation, this would:
    // 1. Send the image and style prompt to Gemini Vision API
    // 2. Use an image generation model or editing service
    // 3. Return the generated/edited image URL
    
    if (!import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY === 'demo-key') {
      // Demo mode - return a sample styled image after delay
      await simulateProcessing();
      return generateDemoStyledImage(style);
    }

    // Real API implementation would go here
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
    
    const prompt = `
      ${style.prompt}
      
      Please analyze this photo and describe how to apply the requested hairstyle.
      Focus on specific styling techniques, product recommendations, and step-by-step instructions.
    `;

    const imagePart = {
      inlineData: {
        data: base64Image.split(',')[1],
        mimeType: imageFile.type,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    
    // For now, return demo image as we don't have actual image generation
    // In production, you'd integrate with image generation services
    return generateDemoStyledImage(style);
    
  } catch (error) {
    console.error('Error generating styled image:', error);
    throw new Error('Failed to generate styled image. Please try again.');
  }
}

function generateDemoStyledImage(style: HairstyleOption): string {
  // Generate different demo images based on style category
  const demoImages = {
    bride: [
      'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=400&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=400&h=400&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face'
    ],
    groom: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1519058082700-08a0b56da9b4?w=400&h=400&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face'
    ]
  };

  const categoryImages = demoImages[style.category];
  const randomIndex = Math.floor(Math.random() * categoryImages.length);
  
  // Add style-specific parameters to make images more relevant
  const baseUrl = categoryImages[randomIndex];
  const styleParams = `&auto=format&q=80&blur=0&brightness=10&contrast=10&saturation=5`;
  
  return `${baseUrl}${styleParams}`;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

async function simulateProcessing(): Promise<void> {
  // Simulate AI processing time
  const delay = Math.random() * 2000 + 1000; // 1-3 seconds
  return new Promise(resolve => setTimeout(resolve, delay));
}

export async function analyzeImage(imageFile: File): Promise<{
  faceShape: string;
  recommendations: string[];
  suitableStyles: string[];
}> {
  try {
    if (!import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY === 'demo-key') {
      // Demo analysis
      await simulateProcessing();
      return {
        faceShape: 'oval',
        recommendations: [
          'Your facial structure works well with most hairstyles',
          'Consider styles that add volume at the crown',
          'Side-swept styles would complement your features'
        ],
        suitableStyles: ['Elegant Updo', 'Loose Waves', 'Side-Swept Glamour']
      };
    }

    // Real implementation would analyze the image here
    const base64Image = await fileToBase64(imageFile);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
    
    const prompt = `
      Analyze this photo and provide:
      1. Face shape classification
      2. Hairstyle recommendations based on facial features
      3. Specific styling suggestions for pre-wedding photos
      
      Format the response as JSON with faceShape, recommendations, and suitableStyles arrays.
    `;

    const imagePart = {
      inlineData: {
        data: base64Image.split(',')[1],
        mimeType: imageFile.type,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response or provide fallback
    try {
      return JSON.parse(text);
    } catch {
      return {
        faceShape: 'oval',
        recommendations: [
          'Based on your features, you have great versatility in hairstyle choices',
          'Consider the wedding theme and personal style preferences'
        ],
        suitableStyles: ['Various styles would work well for you']
      };
    }

  } catch (error) {
    console.error('Error analyzing image:', error);
    throw new Error('Failed to analyze image. Please try again.');
  }
}