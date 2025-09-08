import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, UploadedImage, HairstyleOption } from '../types';
import { getChatResponse } from '../services/geminiChatService';
import { CHAT_PROMPTS } from '../constants';

interface ChatbotProps {
  uploadedImage: UploadedImage | null;
  selectedStyle: HairstyleOption | null;
}

const Chatbot: React.FC<ChatbotProps> = ({ uploadedImage, selectedStyle }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: CHAT_PROMPTS.WELCOME,
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (message: string) => {
    if (!message.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await getChatResponse(message, {
        hasImage: !!uploadedImage,
        selectedStyle: selectedStyle?.name || null,
        context: 'pre-wedding styling'
      });

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: CHAT_PROMPTS.ERROR,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const quickQuestions = [
    "What hairstyle suits my face shape?",
    "How to prepare hair for the photoshoot?",
    "What accessories work best?",
    "Any makeup tips to complement the hairstyle?"
  ];

  return (
    <div style={{
      height: '400px',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f7fafc',
      borderRadius: '12px',
      overflow: 'hidden'
    }}>
      {/* Chat Header */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#4c51bf',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <div style={{ fontSize: '20px' }}>🤖</div>
        <div>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
            AI Styling Assistant
          </h4>
          <p style={{ margin: 0, fontSize: '12px', opacity: 0.9 }}>
            Ask me anything about hairstyles and pre-wedding looks
          </p>
        </div>
      </div>

      {/* Messages Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div
              style={{
                maxWidth: '80%',
                padding: '8px 12px',
                borderRadius: '12px',
                backgroundColor: message.type === 'user' ? '#4c51bf' : 'white',
                color: message.type === 'user' ? 'white' : '#1a202c',
                fontSize: '14px',
                lineHeight: '1.4',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                wordWrap: 'break-word'
              }}
            >
              {message.content}
            </div>
          </div>
        ))}

        {isTyping && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '8px 12px',
              borderRadius: '12px',
              backgroundColor: 'white',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <div style={{
                display: 'flex',
                gap: '2px'
              }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: '6px',
                      height: '6px',
                      backgroundColor: '#cbd5e0',
                      borderRadius: '50%',
                      animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite both`
                    }}
                  />
                ))}
              </div>
              <span style={{ fontSize: '12px', color: '#718096', marginLeft: '4px' }}>
                AI is typing...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length <= 2 && (
        <div style={{
          padding: '8px 16px',
          backgroundColor: 'white',
          borderTop: '1px solid #e2e8f0'
        }}>
          <p style={{
            fontSize: '12px',
            color: '#718096',
            margin: '0 0 8px 0'
          }}>
            Quick questions:
          </p>
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => sendMessage(question)}
                disabled={isTyping}
                style={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  backgroundColor: '#e2e8f0',
                  color: '#4a5568',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: isTyping ? 'not-allowed' : 'pointer',
                  opacity: isTyping ? 0.5 : 1,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isTyping) {
                    e.currentTarget.style.backgroundColor = '#cbd5e0';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isTyping) {
                    e.currentTarget.style.backgroundColor = '#e2e8f0';
                  }
                }}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} style={{
        padding: '12px 16px',
        backgroundColor: 'white',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        gap: '8px'
      }}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask about hairstyles, styling tips, or preparation..."
          disabled={isTyping}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            fontSize: '14px',
            outline: 'none',
            backgroundColor: isTyping ? '#f7fafc' : 'white',
            cursor: isTyping ? 'not-allowed' : 'text'
          }}
          onFocus={(e) => {
            if (!isTyping) {
              e.target.style.borderColor = '#4c51bf';
            }
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e2e8f0';
          }}
        />
        
        <button
          type="submit"
          disabled={!inputValue.trim() || isTyping}
          style={{
            padding: '8px 16px',
            backgroundColor: inputValue.trim() && !isTyping ? '#4c51bf' : '#cbd5e0',
            color: inputValue.trim() && !isTyping ? 'white' : '#718096',
            border: 'none',
            borderRadius: '20px',
            cursor: inputValue.trim() && !isTyping ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: '500',
            minWidth: '60px',
            transition: 'all 0.2s ease'
          }}
        >
          Send
        </button>
      </form>
      
      <style>
        {`
          @keyframes bounce {
            0%, 80%, 100% { 
              transform: scale(0);
            } 40% { 
              transform: scale(1);
            }
          }
        `}
      </style>
    </div>
  );
};

export default Chatbot;