import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Globe, 
  Cpu, 
  Zap, 
  ChevronRight, 
  AlertCircle, 
  Loader2,
  Terminal,
  Server,
  Network,
  Sun,
  Moon
} from 'lucide-react';
import { cn } from './UI';

interface LoginPageProps {
  onLogin: () => void;
  isLightTheme?: boolean;
  onToggleTheme?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, isLightTheme, onToggleTheme }) => {
  const [step, setStep] = useState<'gateway' | 'auth'>('gateway');
  const [gateway, setGateway] = useState('');
  const [port, setPort] = useState('502');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bootSequence, setBootSequence] = useState<string[]>([]);

  const gateways = [
    { id: 'GW-VN-01', name: 'Vietnam South Hub (HCM)', status: 'Online', latency: '12ms' },
    { id: 'GW-VN-02', name: 'Vietnam North Hub (HN)', status: 'Online', latency: '24ms' },
    { id: 'GW-SG-01', name: 'Singapore Regional Node', status: 'Online', latency: '45ms' },
    { id: 'GW-DEMO', name: 'AVENUE - DEMO Gateway', status: 'Online', latency: '5ms' },
  ];

  const ports = ['502', '8080', '1502', '2502'];

  useEffect(() => {
    const lines = [
      'INITIALIZING NEURAL CORE...',
      'ESTABLISHING SECURE TUNNEL...',
      'LOADING INDUSTRIAL PROTOCOLS...',
      'SCANNING FOR ACTIVE GATEWAYS...',
      'READY FOR AUTHENTICATION.'
    ];
    
    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < lines.length) {
        setBootSequence(prev => [...prev, lines[currentLine]]);
        currentLine++;
      } else {
        clearInterval(interval);
      }
    }, 400);

    return () => clearInterval(interval);
  }, []);

  const handleGatewaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gateway) {
      setError('Please select a gateway node.');
      return;
    }
    setError('');
    setStep('auth');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Mock authentication
    setTimeout(() => {
      if (username === 'admin' && password === 'avenue@2026') {
        onLogin();
      } else {
        setError('Invalid credentials. Access denied.');
        setIsLoading(false);
      }
    }, 1500);
  };

  return (
    <div className={cn(
      "fixed inset-0 z-[1000] bg-scada-bg flex items-center justify-center overflow-hidden font-mono",
      isLightTheme && "light-theme"
    )}>
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.05)_0%,transparent_70%)]" />
      {!isLightTheme && <div className="crt-overlay opacity-50" />}
      {!isLightTheme && <div className="scanline" />}
      
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-[var(--scada-grid-opacity)] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(var(--scada-border) 1px, transparent 1px), linear-gradient(90deg, var(--scada-border) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Theme Toggle in Login */}
      <div className="absolute top-6 right-6">
        <button 
          onClick={onToggleTheme}
          className={cn("p-2 rounded-lg border transition-colors", isLightTheme ? "border-scada-blue text-scada-blue" : "border-scada-border text-scada-grey")}
          title={isLightTheme ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
          {isLightTheme ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        {/* Security Header */}
        <div className="absolute -top-12 left-0 right-0 flex justify-center">
          <motion.div 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex items-center gap-2 text-[10px] text-scada-blue font-bold uppercase tracking-[0.3em]"
          >
            <ShieldCheck className="w-4 h-4" />
            Secure Industrial Access
          </motion.div>
        </div>

        <div className="bg-scada-panel border border-scada-border rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-xl">
          {/* Top Bar */}
          <div className="h-1 bg-gradient-to-r from-transparent via-scada-blue to-transparent" />
          
          <div className="p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-scada-blue/10 rounded-lg border border-scada-blue/30">
                <Cpu className="w-8 h-8 text-scada-blue" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-scada-text tracking-tighter uppercase">
                  AVENUE <span className="text-scada-blue">SCADA</span>
                </h1>
                <p className="text-[10px] text-scada-grey uppercase tracking-widest font-bold">Energy Monitor v2.5</p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {step === 'gateway' ? (
                <motion.form 
                  key="gateway"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleGatewaySubmit}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <label className="block text-[10px] text-scada-grey uppercase font-bold tracking-widest">
                      Select Access Gateway
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {gateways.map((gw) => (
                        <button
                          key={gw.id}
                          type="button"
                          onClick={() => setGateway(gw.id)}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border transition-all text-left group",
                            gateway === gw.id 
                              ? "bg-scada-blue/10 border-scada-blue text-white" 
                              : "bg-black/40 border-scada-border text-scada-grey hover:border-scada-blue/30"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Server className={cn("w-4 h-4", gateway === gw.id ? "text-scada-blue" : "text-scada-grey")} />
                            <div>
                              <div className="text-[11px] font-bold text-scada-text">{gw.name}</div>
                              <div className="text-[8px] opacity-50 text-scada-grey">{gw.id} • {gw.latency}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-scada-green animate-pulse" />
                            <ChevronRight className={cn("w-4 h-4 transition-transform", gateway === gw.id ? "translate-x-1" : "opacity-0")} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] text-scada-grey uppercase font-bold tracking-widest">
                      Communication Port
                    </label>
                    <div className="flex gap-2">
                      {ports.map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPort(p)}
                          className={cn(
                            "flex-1 py-2 rounded border text-[10px] font-bold transition-all",
                            port === p 
                              ? "bg-scada-blue text-black border-scada-blue" 
                              : "bg-black/40 border-scada-border text-scada-grey hover:text-white"
                          )}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-scada-red text-[10px] font-bold bg-scada-red/10 p-3 rounded border border-scada-red/20">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-scada-blue text-black font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-scada-blue/90 transition-all shadow-[0_0_20px_rgba(0,229,255,0.3)] flex items-center justify-center gap-2"
                  >
                    Establish Connection <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.form>
              ) : (
                <motion.form 
                  key="auth"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleLogin}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 text-[10px] text-scada-blue font-bold uppercase tracking-widest mb-4">
                    <Network className="w-3.5 h-3.5" />
                    Connected to {gateway}:{port}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-[10px] text-scada-grey uppercase font-bold tracking-widest">
                        Operator Username
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-scada-grey" />
                        <input 
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Enter operator ID"
                          className="w-full bg-black/60 border border-scada-border rounded-lg py-3 pl-10 pr-4 text-xs text-scada-text focus:outline-none focus:border-scada-blue transition-all placeholder:text-scada-grey/30"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] text-scada-grey uppercase font-bold tracking-widest">
                        Security Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-scada-grey" />
                        <input 
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full bg-black/60 border border-scada-border rounded-lg py-3 pl-10 pr-4 text-xs text-scada-text focus:outline-none focus:border-scada-blue transition-all placeholder:text-scada-grey/30"
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-scada-red text-[10px] font-bold bg-scada-red/10 p-3 rounded border border-scada-red/20">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep('gateway')}
                      className="flex-1 py-3 bg-black/40 border border-scada-border text-scada-grey font-bold uppercase tracking-widest text-[10px] rounded-lg hover:text-white transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-[2] py-3 bg-scada-blue text-black font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-scada-blue/90 transition-all shadow-[0_0_20px_rgba(0,229,255,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          Authorize Access <Lock className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Terminal Output */}
          <div className="bg-black/80 border-t border-scada-border p-4 font-mono">
            <div className="flex items-center gap-2 mb-2">
              <Terminal className="w-3 h-3 text-scada-blue" />
              <span className="text-[8px] text-scada-blue font-bold uppercase tracking-widest">System Terminal</span>
            </div>
            <div className="space-y-1">
              {bootSequence.map((line, i) => (
                <div key={i} className="text-[8px] text-scada-green flex items-center gap-2">
                  <span className="opacity-30">[{new Date().toLocaleTimeString()}]</span>
                  <span className="glow-green">{line}</span>
                </div>
              ))}
              {isLoading && (
                <motion.div 
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="text-[8px] text-scada-blue flex items-center gap-2"
                >
                  <span className="opacity-30">[{new Date().toLocaleTimeString()}]</span>
                  <span>AUTHENTICATING OPERATOR...</span>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[8px] text-scada-grey">
              <Zap className="w-3 h-3 text-scada-yellow" />
              ENCRYPTED
            </div>
            <div className="flex items-center gap-1.5 text-[8px] text-scada-grey">
              <Globe className="w-3 h-3 text-scada-blue" />
              GLOBAL NODE
            </div>
          </div>
          <div className="text-[8px] text-scada-grey/40 uppercase tracking-widest">
            © 2026 AVENUE INDUSTRIAL SYSTEMS
          </div>
        </div>
      </motion.div>
    </div>
  );
};
