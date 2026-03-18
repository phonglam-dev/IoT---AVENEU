import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Minimize2, 
  Maximize2,
  Sparkles,
  Zap,
  Activity,
  ShieldCheck,
  Trash2,
  Download,
  Mail,
  MoreVertical
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { cn } from './UI';
import { MeterData } from '../types';

interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

interface AVEAIChatProps {
  meters: MeterData[];
  gatewayOnline: boolean;
  mainBreakerOpen: boolean;
  isLightTheme?: boolean;
}

export const AVEAIChat: React.FC<AVEAIChatProps> = ({ meters, gatewayOnline, mainBreakerOpen, isLightTheme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'model', 
      text: "Hello! I am **AVE - AI**, your industrial energy monitoring assistant. How can I help you analyze the system today?", 
      timestamp: new Date() 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      // Prepare system context
      const systemContext = `
        You are "AVE - AI", a professional industrial SCADA assistant for the "AVENUE - DEMO Energy Monitor" application.
        Your tone is technical, precise, and helpful. You are an expert in power systems, Modbus RTU, and energy efficiency.

        Current System State:
        - Gateway Status: ${gatewayOnline ? 'ONLINE' : 'OFFLINE'}
        - Main Breaker: ${mainBreakerOpen ? 'OPEN (Power Cut)' : 'CLOSED (Normal)'}
        - Total Meters: ${meters.length}
        - Meters Data: ${JSON.stringify(meters.map(m => ({
            id: m.id,
            name: m.name,
            power: m.powerW + 'W',
            energy: m.totalEnergykWh + 'kWh',
            status: m.status,
            breaker: m.breakerOpen ? 'OPEN' : 'CLOSED',
            faulted: m.isFaulted ? 'YES' : 'NO'
          })))}

        Guidelines:
        1. Refer to yourself as AVE - AI.
        2. Use Markdown for formatting (bold, lists, etc.).
        3. If asked about the system, use the provided real-time data.
        4. If a meter is in ALARM or COMM_LOSS, point it out if relevant.
        5. Keep responses concise but informative.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'user', parts: [{ text: systemContext }] },
          ...messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
          })),
          { role: 'user', parts: [{ text: input }] }
        ],
      });

      const aiText = response.text || "I'm sorry, I couldn't process that request.";
      setMessages(prev => [...prev, { role: 'model', text: aiText, timestamp: new Date() }]);
    } catch (error) {
      console.error("AVE-AI Error:", error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: "System Error: Communication with neural core lost. Please check API configuration.", 
        timestamp: new Date() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      { 
        role: 'model', 
        text: "Chat history cleared. How can I help you analyze the system today?", 
        timestamp: new Date() 
      }
    ]);
    setShowMenu(false);
  };

  const downloadLog = () => {
    const logText = messages.map(m => 
      `[${m.timestamp.toLocaleString()}] ${m.role.toUpperCase()}: ${m.text}`
    ).join('\n\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AVE-AI-ChatLog-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowMenu(false);
  };

  const emailLog = () => {
    const logText = messages.map(m => 
      `[${m.timestamp.toLocaleString()}] ${m.role.toUpperCase()}: ${m.text}`
    ).join('\n\n');
    
    const subject = encodeURIComponent(`AVE-AI Chat Log - ${new Date().toLocaleDateString()}`);
    const body = encodeURIComponent(logText);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setShowMenu(false);
  };

  return (
    <div className="fixed bottom-12 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? '60px' : '500px',
              width: '380px'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-scada-panel border border-scada-border rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden mb-4 backdrop-blur-md"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-scada-blue/20 to-transparent border-b border-scada-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-scada-blue/10 rounded-lg border border-scada-blue/30 relative">
                  <Bot className="w-5 h-5 text-scada-blue" />
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-scada-green rounded-full border-2 border-scada-panel animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-scada-text uppercase tracking-widest">AVE - AI</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 bg-scada-green rounded-full" />
                    <span className="text-[8px] text-scada-green font-bold uppercase">Neural Core Active</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 relative">
                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  className={cn("p-1.5 transition-colors rounded", showMenu ? "bg-scada-blue/20 text-scada-blue" : "text-scada-grey hover:text-white")}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                <AnimatePresence>
                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -10 }}
                      className="absolute top-full right-0 mt-2 w-40 bg-scada-panel border border-scada-border rounded-lg shadow-2xl z-50 overflow-hidden"
                    >
                      <button 
                        onClick={clearChat}
                        className="w-full px-4 py-2 text-[10px] text-left text-scada-grey hover:bg-scada-red/10 hover:text-scada-red flex items-center gap-2 transition-colors border-b border-scada-border/50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear Chat</span>
                      </button>
                      <button 
                        onClick={downloadLog}
                        className="w-full px-4 py-2 text-[10px] text-left text-scada-grey hover:bg-scada-blue/10 hover:text-scada-blue flex items-center gap-2 transition-colors border-b border-scada-border/50"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Log</span>
                      </button>
                      <button 
                        onClick={emailLog}
                        className="w-full px-4 py-2 text-[10px] text-left text-scada-grey hover:bg-scada-blue/10 hover:text-scada-blue flex items-center gap-2 transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Send to Email</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 text-scada-grey hover:text-white transition-colors"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-scada-grey hover:text-scada-red transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages Area */}
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/20"
                >
                  {messages.map((msg, i) => (
                    <motion.div
                      initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={i}
                      className={cn(
                        "flex gap-3 max-w-[85%]",
                        msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                      )}
                    >
                      <div className={cn(
                        "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border",
                        msg.role === 'user' 
                          ? "bg-scada-panel border-scada-border text-scada-grey" 
                          : "bg-scada-blue/10 border-scada-blue/30 text-scada-blue"
                      )}>
                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className={cn(
                        "p-3 rounded-lg text-[11px] leading-relaxed",
                        msg.role === 'user' 
                          ? "bg-scada-blue/10 text-scada-text border border-scada-blue/20" 
                          : "bg-scada-panel/40 text-scada-text border border-scada-border/50"
                      )}>
                        <div className={cn(
                          "markdown-body prose prose-xs max-w-none",
                          !isLightTheme && "prose-invert"
                        )}>
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                        <div className="mt-1 text-[8px] opacity-40 text-right">
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="shrink-0 w-8 h-8 rounded-lg bg-scada-blue/10 border border-scada-blue/30 flex items-center justify-center text-scada-blue">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                      <div className="p-3 rounded-lg bg-black/40 border border-scada-border/50 flex items-center gap-2">
                        <div className="flex gap-1">
                          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 bg-scada-blue rounded-full" />
                          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 bg-scada-blue rounded-full" />
                          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 bg-scada-blue rounded-full" />
                        </div>
                        <span className="text-[9px] text-scada-blue font-bold uppercase tracking-tighter">Processing Neural Request...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-scada-border bg-scada-panel/40">
                  <div className="relative">
                    <input 
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Ask AVE - AI about the system..."
                      className="w-full bg-scada-panel border border-scada-border rounded-lg py-2.5 pl-4 pr-12 text-[11px] text-scada-text focus:outline-none focus:border-scada-blue transition-colors placeholder:text-scada-grey/50"
                    />
                    <button 
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-scada-blue text-white rounded-md hover:bg-scada-blue/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-[8px] text-scada-grey">
                        <Zap className="w-2.5 h-2.5 text-scada-yellow" />
                        <span>Real-time Context</span>
                      </div>
                      <div className="flex items-center gap-1 text-[8px] text-scada-grey">
                        <ShieldCheck className="w-2.5 h-2.5 text-scada-green" />
                        <span>Industrial Grade</span>
                      </div>
                    </div>
                    <span className="text-[8px] text-scada-grey/40">Powered by Gemini 3</span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.3)] border-2 transition-all relative group",
          isOpen 
            ? "bg-scada-panel border-scada-blue text-scada-blue" 
            : "bg-scada-blue border-white/20 text-black hover:bg-scada-blue/90"
        )}
      >
        <div className="absolute inset-0 rounded-full bg-scada-blue/20 animate-ping group-hover:animate-none" />
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 bg-scada-red text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-scada-panel">
            AI
          </div>
        )}
      </motion.button>
    </div>
  );
};
