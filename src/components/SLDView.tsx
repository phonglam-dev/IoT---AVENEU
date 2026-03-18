import React, { useState } from 'react';
import { MeterData, MeterStatus } from '../types';
import { cn, ScadaPanel, ScadaButton, ScadaInput } from './UI';
import { Zap, ShieldCheck, ShieldAlert, ZoomIn, ZoomOut, Maximize, MousePointer2, Timer, Settings2, Wifi, WifiOff, Database, Activity } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { motion } from 'motion/react';

interface SLDViewProps {
  meters: MeterData[];
  onMeterClick?: (meter: MeterData) => void;
  onGatewayClick?: () => void;
  mainBreakerOpen?: boolean;
  onMainBreakerToggle?: () => void;
  onBreakerToggle?: (meterId: string) => void;
  onFaultToggle?: (meterId: string, config?: { type: MeterData['faultType'], magnitude: number, duration: number }) => void;
}

export const SLDView: React.FC<SLDViewProps> = ({ 
  meters, 
  onMeterClick, 
  onGatewayClick,
  mainBreakerOpen = false,
  onMainBreakerToggle,
  onBreakerToggle,
  onFaultToggle
}) => {
  const [faultConfigId, setFaultConfigId] = useState<string | null>(null);
  const [faultType, setFaultType] = useState<MeterData['faultType']>('SLG');
  const [faultMagnitude, setFaultMagnitude] = useState(50); // kA
  const [faultDuration, setFaultDuration] = useState(10); // seconds

  return (
    <div className="flex-1 bg-black overflow-hidden relative min-h-[600px] border border-scada-border">
      {/* Fault Configuration Modal */}
      {faultConfigId && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-80 bg-scada-panel border border-scada-border p-6 rounded-lg shadow-2xl"
          >
            <div className="flex items-center gap-2 mb-4 border-b border-scada-border pb-2">
              <Settings2 className="w-4 h-4 text-scada-red" />
              <h3 className="text-xs font-bold text-scada-blue uppercase tracking-widest">Fault Injection Config</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[9px] text-scada-grey uppercase block mb-1">Fault Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {['SLG', 'L-L', 'L-L-G', '3-PHASE'].map(type => (
                    <button
                      key={type}
                      onClick={() => setFaultType(type as any)}
                      className={cn(
                        "text-[10px] py-1 border transition-colors",
                        faultType === type ? "bg-scada-red/20 border-scada-red text-scada-red" : "border-scada-border text-scada-grey hover:border-scada-grey/50"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <ScadaInput 
                  label="Magnitude"
                  unit="kA"
                  value={faultMagnitude} 
                  onChange={(val) => setFaultMagnitude(val)}
                />
              </div>
              
              <div>
                <ScadaInput 
                  label="Auto-Clear"
                  unit="s"
                  value={faultDuration} 
                  onChange={(val) => setFaultDuration(val)}
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <ScadaButton 
                variant="outline" 
                className="flex-1 text-[10px] justify-center" 
                onClick={() => setFaultConfigId(null)}
              >
                Cancel
              </ScadaButton>
              <ScadaButton 
                variant="danger" 
                className="flex-1 text-[10px] justify-center" 
                onClick={() => {
                  onFaultToggle?.(faultConfigId, { type: faultType!, magnitude: faultMagnitude, duration: faultDuration });
                  setFaultConfigId(null);
                }}
              >
                Inject Fault
              </ScadaButton>
            </div>
          </motion.div>
        </div>
      )}

      <TransformWrapper
        initialScale={1}
        initialPositionX={0}
        initialPositionY={0}
        minScale={0.5}
        maxScale={2}
        centerOnInit
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Controls Overlay */}
            <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-2">
              <button 
                onClick={() => zoomIn()}
                className="w-10 h-10 bg-scada-panel border border-scada-border flex items-center justify-center text-scada-blue hover:bg-scada-blue/10 transition-colors rounded shadow-lg"
                title="Zoom In"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button 
                onClick={() => zoomOut()}
                className="w-10 h-10 bg-scada-panel border border-scada-border flex items-center justify-center text-scada-blue hover:bg-scada-blue/10 transition-colors rounded shadow-lg"
                title="Zoom Out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button 
                onClick={() => resetTransform()}
                className="w-10 h-10 bg-scada-panel border border-scada-border flex items-center justify-center text-scada-blue hover:bg-scada-blue/10 transition-colors rounded shadow-lg"
                title="Reset View"
              >
                <Maximize className="w-5 h-5" />
              </button>
            </div>

             {/* Legend Overlay */}
             <div className="absolute top-6 right-6 z-50 bg-scada-panel/80 border border-scada-border p-3 rounded-lg backdrop-blur-sm flex flex-col gap-2 shadow-xl">
                <div className="text-[9px] text-scada-grey uppercase font-bold tracking-widest border-b border-scada-border pb-1 mb-1">SLD Legend</div>
                <div className="flex items-center gap-2">
                   <div className="w-3 h-3 border border-scada-blue bg-scada-panel flex items-center justify-center">
                      <div className="w-2 h-0.5 bg-scada-green rotate-45" />
                   </div>
                   <span className="text-[8px] text-scada-grey uppercase">Breaker (Closed)</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-3 h-3 border border-scada-red bg-scada-panel flex items-center justify-center">
                      <div className="w-2 h-0.5 bg-scada-red rotate-0" />
                   </div>
                   <span className="text-[8px] text-scada-grey uppercase">Breaker (Open/Trip)</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-3 h-0.5 bg-scada-blue shadow-[0_0_5px_rgba(59,130,246,0.5)]" />
                   <span className="text-[8px] text-scada-grey uppercase">Live Path</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-3 h-0.5 bg-scada-grey" />
                   <span className="text-[8px] text-scada-grey uppercase">Dead Path</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-3 h-3 bg-scada-red/20 border border-scada-red flex items-center justify-center">
                      <ShieldAlert className="w-2 h-2 text-scada-red" />
                   </div>
                   <span className="text-[8px] text-scada-grey uppercase">Fault Active</span>
                </div>
                <div className="flex items-center gap-2">
                    <Wifi className="w-3 h-3 text-scada-blue animate-pulse" />
                    <span className="text-[8px] text-scada-grey uppercase">Comm Active</span>
                 </div>
                <div className="mt-1 pt-1 border-t border-scada-border/50 flex flex-col gap-1.5">
                   <div className="text-[7px] text-scada-grey uppercase font-bold mb-0.5">Meter Status</div>
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-scada-green" />
                      <span className="text-[7px] text-scada-grey uppercase">Normal</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-scada-yellow animate-pulse" />
                      <span className="text-[7px] text-scada-grey uppercase">Warning</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-scada-red animate-pulse" />
                      <span className="text-[7px] text-scada-grey uppercase">Alarm</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-scada-grey" />
                      <span className="text-[7px] text-scada-grey uppercase">Offline</span>
                   </div>
                </div>
                <div className="mt-1 pt-1 border-t border-scada-border/50 text-[7px] text-scada-blue text-center uppercase font-bold">
                   Click Breakers to Toggle
                </div>
             </div>

            {/* Interaction Hint */}
            <div className="absolute top-6 left-6 z-50 flex items-center gap-2 text-[10px] text-scada-grey bg-scada-panel/40 px-3 py-1.5 rounded-full border border-scada-border/50">
              <MousePointer2 className="w-3 h-3" />
              <span>DRAG TO PAN • SCROLL TO ZOOM</span>
            </div>

            <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full flex items-center justify-center">
              <div className="p-20 flex flex-col items-center min-w-[1000px]">
                {/* Grid Background (inside transform to move with content) */}
                <div className="absolute inset-0 opacity-5 pointer-events-none" 
                     style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                {/* Data Gateway Representation */}
                <div className="absolute top-10 left-10 z-10 flex flex-col items-start">
                    <div className="flex items-start gap-4">
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onGatewayClick}
                        className="p-4 bg-scada-panel border border-scada-border rounded-lg shadow-[0_0_20px_rgba(0,229,255,0.1)] flex flex-col items-center gap-2 group cursor-pointer hover:border-scada-blue transition-all"
                      >
                         <div className="relative">
                            <div className="absolute inset-0 bg-scada-blue/20 rounded-full blur-xl animate-pulse group-hover:bg-scada-blue/40" />
                            <Database className="w-10 h-10 text-scada-blue relative z-10" />
                            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-scada-green rounded-full border-2 border-scada-panel animate-pulse z-20 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                         </div>
                         <div className="text-[9px] text-scada-grey uppercase font-bold tracking-tighter group-hover:text-scada-blue transition-colors">Smart Gateway GW-01</div>
                         <div className="flex items-center gap-2 bg-black/40 px-2 py-0.5 rounded border border-scada-border/50">
                            <div className="w-1.5 h-1.5 rounded-full bg-scada-green animate-ping" />
                            <span className="text-[7px] text-scada-green font-bold tracking-widest">UPLINK ACTIVE</span>
                         </div>
                         <div className="text-[7px] text-scada-grey uppercase opacity-0 group-hover:opacity-100 transition-opacity">Click for Details</div>
                      </motion.div>

                      {/* Floating Comm Monitor Panel */}
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-scada-panel/80 border border-scada-border p-2 rounded shadow-lg backdrop-blur-sm min-w-[120px]"
                      >
                        <div className="text-[7px] text-scada-blue font-bold uppercase border-b border-scada-border/50 pb-1 mb-1 flex items-center gap-1">
                          <Activity className="w-2.5 h-2.5" />
                          Comm Monitor
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[6px] text-scada-grey uppercase">Last Poll</span>
                            <span className="text-[7px] text-white font-bold tabular-nums">24ms ago</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[6px] text-scada-grey uppercase">Poll Rate</span>
                            <span className="text-[7px] text-white font-bold tabular-nums">0.5 Hz</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[6px] text-scada-grey uppercase">Errors</span>
                            <span className="text-[7px] text-scada-red font-bold tabular-nums">0</span>
                          </div>
                          <div className="mt-1 pt-1 border-t border-scada-border/30">
                            <div className="flex gap-0.5">
                              {[1,1,1,1,0,1,1,1,1,1].map((s, i) => (
                                <div key={i} className={cn("w-1.5 h-2 rounded-sm", s ? "bg-scada-green/40" : "bg-scada-red/40")} />
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Comm Lines (Visual only) */}
                    <div className="h-20 w-px bg-gradient-to-b from-scada-blue/40 to-transparent relative ml-10">
                       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 border-l border-t border-scada-blue/20 rounded-tl-lg" />
                       {/* Data Packets Animation */}
                       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-scada-blue rounded-full blur-[1px] animate-[comm_2s_linear_infinite]" />
                       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-scada-blue rounded-full blur-[1px] animate-[comm_2s_linear_infinite]" style={{ animationDelay: '0.7s' }} />
                    </div>
                 </div>

                {/* Main Supply / Transformer */}
                <div className="flex flex-col items-center mb-12 relative z-10">
                  <div className="text-[10px] text-scada-grey uppercase mb-2">Main Supply 22kV/0.4kV</div>
                  <div className="w-20 h-20 border-2 border-scada-blue rounded-full flex items-center justify-center bg-scada-panel relative shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                    <Zap className={cn("w-10 h-10 text-scada-yellow", !mainBreakerOpen && "animate-pulse")} />
                    <div className="absolute -bottom-2 bg-scada-blue text-black text-[9px] font-bold px-2 py-0.5 rounded">TR-01</div>
                  </div>
                  {/* Vertical Line */}
                  <div className="w-1 h-12 bg-scada-blue relative">
                    {!mainBreakerOpen && <div className="absolute inset-0 bg-scada-blue animate-pulse" />}
                  </div>
                  {/* Main Breaker */}
                  <div 
                    onClick={onMainBreakerToggle}
                    className={cn(
                      "w-12 h-12 border bg-scada-panel flex items-center justify-center relative shadow-inner cursor-pointer transition-all group",
                      mainBreakerOpen ? "border-scada-red" : "border-scada-blue hover:border-scada-blue/60"
                    )}
                  >
                     <div className={cn(
                       "w-8 h-1 transition-all duration-300",
                       mainBreakerOpen ? "bg-scada-red rotate-0" : "bg-scada-green rotate-45 shadow-[0_0_5px_rgba(34,197,94,0.5)]"
                     )} />
                     <div className={cn(
                       "absolute -right-32 text-[10px] font-bold whitespace-nowrap transition-colors",
                       mainBreakerOpen ? "text-scada-red" : "text-scada-green"
                     )}>
                       MCCB-MAIN: {mainBreakerOpen ? 'OPEN' : 'CLOSED'}
                     </div>
                     <div className="absolute -left-20 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] text-scada-blue uppercase tracking-tighter">Click to Toggle</div>
                  </div>
                  {/* Vertical Line */}
                  <div className={cn("w-1 h-12 transition-colors duration-500", mainBreakerOpen ? "bg-scada-grey/30" : "bg-scada-blue")} />
                </div>

                {/* Main Busbar */}
                <div className={cn(
                  "w-full max-w-6xl h-2 relative mb-16 transition-all duration-500 z-10",
                  mainBreakerOpen ? "bg-scada-grey/40 shadow-none" : "bg-scada-blue shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                )}>
                  <div className={cn(
                    "absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest transition-colors",
                    mainBreakerOpen ? "text-scada-grey" : "text-scada-blue"
                  )}>Main Busbar 400V</div>
                  
                  {/* Branch Connections */}
                  <div className="absolute top-2 left-0 right-0 flex justify-around px-4">
                    {meters.map((meter, idx) => {
                      const isLive = !mainBreakerOpen && !meter.breakerOpen;
                      const isFaulted = meter.isFaulted;
                      
                      return (
                        <div key={meter.id} className="flex flex-col items-center w-32">
                          {/* Branch Line */}
                          <div className={cn(
                            "w-0.5 h-12 relative transition-colors duration-500",
                            isFaulted ? "bg-scada-red shadow-[0_0_10px_rgba(255,0,0,0.5)]" :
                            isLive ? "bg-scada-blue" : "bg-scada-grey/40"
                          )}>
                             {/* Flow Animation */}
                             {isLive && !isFaulted && (
                               <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                                  <div className="w-full h-4 bg-white/60 animate-[flow_1.5s_linear_infinite] blur-[1px]" 
                                       style={{ animationDelay: `${idx * 0.3}s` }} />
                               </div>
                             )}
                             {isFaulted && (
                               <div className="absolute -left-1 top-4 w-2.5 h-2.5 bg-scada-red rounded-full animate-ping" />
                             )}
                          </div>

                          {/* Branch Breaker & Fault Control */}
                          <div className="flex items-center gap-2 mb-4">
                            <div 
                              onClick={() => onBreakerToggle?.(meter.id)}
                              className={cn(
                                "w-8 h-8 border flex items-center justify-center bg-scada-panel transition-all duration-500 cursor-pointer group/brk",
                                meter.breakerOpen ? "border-scada-red shadow-[0_0_10px_rgba(255,0,0,0.1)]" : "border-scada-blue hover:border-scada-blue/60"
                              )}
                              title="Toggle Breaker"
                            >
                              <div className={cn(
                                "w-6 h-0.5 transition-all duration-500",
                                meter.breakerOpen ? "bg-scada-red rotate-0" : "bg-scada-green rotate-45 shadow-[0_0_5px_rgba(34,197,94,0.3)]"
                              )} />
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (meter.isFaulted) {
                                  onFaultToggle?.(meter.id);
                                } else {
                                  setFaultConfigId(meter.id);
                                }
                              }}
                              className={cn(
                                "w-6 h-6 border flex items-center justify-center transition-all relative",
                                meter.isFaulted 
                                  ? "bg-scada-red border-scada-red text-black shadow-[0_0_10px_rgba(255,0,0,0.4)]" 
                                  : "bg-black/40 border-scada-border text-scada-grey hover:border-scada-red/50 hover:text-scada-red"
                              )}
                              title={meter.isFaulted ? "Clear Fault" : "Configure Fault Injection"}
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                              {meter.isFaulted && meter.faultRemainingTime !== undefined && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[7px] text-scada-red font-bold animate-pulse">
                                  {meter.faultRemainingTime}s
                                </div>
                              )}
                            </button>
                          </div>

                          {/* Meter Box */}
                          <div className="w-32">
                            <ScadaPanel 
                              onClick={() => onMeterClick?.(meter)}
                              status={meter.status as any}
                              className={cn(
                                "w-full p-2 flex flex-col items-center cursor-pointer transition-all duration-500 relative",
                                !isLive && "grayscale opacity-50"
                              )}
                            >
                              {/* Status Dot Indicator */}
                              <div className="absolute top-1.5 right-1.5 flex items-center gap-1.5">
                                <div className={cn(
                                  "w-2 h-2 rounded-full border border-black/20",
                                  meter.status === MeterStatus.NORMAL && "bg-scada-green",
                                  meter.status === MeterStatus.WARNING && "bg-scada-yellow animate-pulse",
                                  meter.status === MeterStatus.ALARM && "bg-scada-red animate-pulse",
                                  (meter.status === MeterStatus.COMM_LOSS || meter.status === MeterStatus.OFFLINE) && "bg-scada-grey"
                                )} />
                                
                                {/* Comm Blinker */}
                                <div className={cn(
                                  "transition-all duration-100",
                                  meter.commBlink ? "opacity-100 scale-110" : "opacity-30 scale-90"
                                )}>
                                  {meter.status === MeterStatus.COMM_LOSS ? (
                                    <WifiOff className="w-2.5 h-2.5 text-scada-red" />
                                  ) : (
                                    <Wifi className="w-2.5 h-2.5 text-scada-blue" />
                                  )}
                                </div>
                              </div>

                              <div className="text-[9px] text-scada-grey uppercase mb-1">{meter.name}</div>
                              <div className={cn(
                                "text-sm font-bold",
                                meter.status === MeterStatus.ALARM ? "text-scada-red animate-pulse" : 
                                meter.status === MeterStatus.WARNING ? "text-scada-yellow" : "text-scada-blue"
                              )}>
                                {(meter.powerW / 1000).toFixed(2)} kW
                              </div>
                              <div className="text-[8px] text-scada-grey mt-1">{meter.totalEnergykWh.toFixed(1)} kWh</div>
                              
                              {meter.isFaulted && (
                                <div className="mt-1 px-1 py-0.5 bg-scada-red/20 border border-scada-red/40 rounded text-[7px] text-scada-red font-bold uppercase animate-pulse">
                                  {meter.faultType} FAULT: {meter.faultMagnitude}kA
                                </div>
                              )}
                              
                              {/* Status Icon */}
                              <div className="mt-2">
                                {meter.status === MeterStatus.ALARM ? (
                                  <ShieldAlert className="w-3 h-3 text-scada-red" />
                                ) : (
                                  <ShieldCheck className="w-3 h-3 text-scada-green" />
                                )}
                              </div>
                            </ScadaPanel>
                          </div>

                          {/* Load Label */}
                          <div className="mt-4 flex flex-col items-center">
                             <div className={cn(
                               "w-0.5 h-8 border-dashed transition-colors duration-500",
                                isLive ? "bg-scada-blue/40" : "bg-scada-grey/20"
                             )} />
                             <div className={cn(
                               "text-[9px] mt-1 uppercase font-bold transition-colors duration-500",
                                isLive ? "text-scada-blue" : "text-scada-grey"
                             )}>
                                Load {idx + 1}
                                {isLive && <div className="w-1 h-1 bg-scada-blue rounded-full mx-auto mt-1 animate-ping" />}
                             </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>

      <style>{`
        @keyframes flow {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(300%); }
        }
        @keyframes comm {
          0% { transform: translate(-50%, 0); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translate(-50%, 80px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
