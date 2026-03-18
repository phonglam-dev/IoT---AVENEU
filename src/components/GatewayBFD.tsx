import React from 'react';
import { motion } from 'motion/react';
import { 
  Database, 
  Cpu, 
  Network, 
  Wifi, 
  ArrowRight, 
  Zap, 
  Activity, 
  ShieldCheck,
  Server,
  HardDrive
} from 'lucide-react';
import { cn } from '../components/UI';

interface GatewayBFDProps {
  className?: string;
}

const GatewayBFD: React.FC<GatewayBFDProps> = ({ className }) => {
  return (
    <div className={cn("flex flex-col h-full bg-scada-panel border-l border-scada-border overflow-hidden", className)}>
      {/* Header */}
      <div className="p-4 border-b border-scada-border bg-black/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-scada-blue/10 rounded border border-scada-blue/30">
            <Database className="w-5 h-5 text-scada-blue" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Gateway BFD</h2>
            <p className="text-[9px] text-scada-grey uppercase">Block Flow Diagram • Internal Architecture</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-2 py-1 bg-scada-green/10 border border-scada-green/30 rounded">
          <div className="w-1.5 h-1.5 bg-scada-green rounded-full animate-pulse" />
          <span className="text-[8px] text-scada-green font-bold uppercase">System Healthy</span>
        </div>
      </div>

      {/* Diagram Area */}
      <div className="flex-1 p-8 relative overflow-auto flex flex-col items-center justify-center gap-12">
        {/* Input Stage: Field Devices */}
        <div className="flex flex-col items-center gap-4">
          <div className="text-[10px] text-scada-grey uppercase font-bold tracking-widest mb-2">Field Level (RS485/Modbus RTU)</div>
          <div className="flex gap-6">
            {[1, 2, 3].map(i => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="w-20 h-20 bg-black/40 border border-scada-border rounded flex flex-col items-center justify-center gap-2 group hover:border-scada-blue transition-colors"
              >
                <Zap className="w-6 h-6 text-scada-grey group-hover:text-scada-blue" />
                <span className="text-[8px] text-scada-grey uppercase">Meter {i}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Connection to Gateway */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-px h-12 bg-gradient-to-b from-scada-border to-scada-blue relative">
            <motion.div 
              animate={{ top: ['0%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-scada-blue rounded-full blur-[1px]"
            />
          </div>
          <div className="text-[8px] text-scada-blue font-bold uppercase">Modbus RTU Engine</div>
        </div>

        {/* Gateway Core */}
        <div className="relative p-1 bg-gradient-to-br from-scada-blue/40 to-transparent rounded-xl">
          <div className="bg-scada-panel border border-scada-blue/50 rounded-lg p-6 w-[400px] shadow-[0_0_30px_rgba(0,229,255,0.1)]">
            <div className="flex items-center gap-3 mb-6 border-b border-scada-border/50 pb-4">
              <Cpu className="w-8 h-8 text-scada-blue" />
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-widest">Gateway Processor</div>
                <div className="text-[8px] text-scada-grey uppercase">ARM Cortex-M7 • 480MHz</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Internal Blocks */}
              <div className="p-3 bg-black/40 border border-scada-border rounded space-y-2">
                <div className="flex items-center gap-2 text-scada-blue">
                  <HardDrive className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-bold uppercase">Data Logger</span>
                </div>
                <div className="h-1 bg-scada-border rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ width: ['20%', '25%', '22%'] }}
                    className="h-full bg-scada-blue"
                  />
                </div>
                <div className="text-[7px] text-scada-grey uppercase">Buffer: 12.4 MB / 64 MB</div>
              </div>

              <div className="p-3 bg-black/40 border border-scada-border rounded space-y-2">
                <div className="flex items-center gap-2 text-scada-green">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-bold uppercase">Security</span>
                </div>
                <div className="text-[7px] text-scada-grey leading-tight">TLS 1.3 Encryption Active<br/>AES-256 Hardware Accel</div>
              </div>

              <div className="p-3 bg-black/40 border border-scada-border rounded space-y-2">
                <div className="flex items-center gap-2 text-scada-yellow">
                  <Activity className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-bold uppercase">Edge Logic</span>
                </div>
                <div className="text-[7px] text-scada-grey leading-tight">Threshold Monitoring<br/>Fault Detection Engine</div>
              </div>

              <div className="p-3 bg-black/40 border border-scada-border rounded space-y-2">
                <div className="flex items-center gap-2 text-scada-blue">
                  <Network className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-bold uppercase">MQTT Client</span>
                </div>
                <div className="text-[7px] text-scada-grey leading-tight">Topic: energy/telemetry<br/>QoS: 1 (At least once)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Output Stage: Network */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-px h-12 bg-gradient-to-b from-scada-blue to-scada-border relative">
            <motion.div 
              animate={{ top: ['0%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-scada-blue rounded-full blur-[1px]"
            />
          </div>
          <div className="text-[8px] text-scada-blue font-bold uppercase">Uplink Interface</div>
        </div>

        <div className="flex gap-8">
          <div className="flex flex-col items-center gap-2">
            <div className="p-4 bg-black/40 border border-scada-border rounded flex flex-col items-center gap-2 w-24">
              <Server className="w-6 h-6 text-scada-grey" />
              <span className="text-[8px] text-scada-grey uppercase">Local SCADA</span>
            </div>
            <div className="text-[7px] text-scada-grey uppercase">Modbus TCP</div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="p-4 bg-scada-blue/10 border border-scada-blue/30 rounded flex flex-col items-center gap-2 w-24 relative overflow-hidden group">
              <div className="absolute inset-0 bg-scada-blue/5 animate-pulse" />
              <Wifi className="w-6 h-6 text-scada-blue relative z-10" />
              <span className="text-[8px] text-scada-blue font-bold uppercase relative z-10">Cloud Platform</span>
            </div>
            <div className="text-[7px] text-scada-blue uppercase">MQTT / HTTPS</div>
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-scada-border bg-black/20 grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <div className="text-[8px] text-scada-grey uppercase">Internal Temp</div>
          <div className="text-xs font-bold text-scada-green">42.5°C</div>
        </div>
        <div className="space-y-1">
          <div className="text-[8px] text-scada-grey uppercase">Cycle Time</div>
          <div className="text-xs font-bold text-white">12ms</div>
        </div>
        <div className="space-y-1">
          <div className="text-[8px] text-scada-grey uppercase">Buffer Usage</div>
          <div className="text-xs font-bold text-scada-blue">19.4%</div>
        </div>
      </div>
    </div>
  );
};

export default GatewayBFD;
