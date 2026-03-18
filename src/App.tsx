import React, { useState, useEffect, useMemo } from 'react';
import { MeterData, MeterStatus } from './types';
import { MOCK_METERS, HISTORICAL_DATA } from './constants';
import { ScadaPanel, ScadaValue, StatusIndicator, cn, Modal, ScadaButton, ScadaInput } from './components/UI';
import { SLDView } from './components/SLDView';
import { TrendView } from './components/TrendView';
import GatewayBFD from './components/GatewayBFD';
import { AVEAIChat } from './components/AVEAIChat';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, AlertTriangle, Clock, Database, Download, RefreshCw, Wifi, WifiOff, ChevronRight, BarChart3, FileSpreadsheet, Zap, Info, Maximize2, Settings, History, ShieldAlert, Columns } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import * as XLSX from 'xlsx';

export default function App() {
  const [meters, setMeters] = useState<MeterData[]>(MOCK_METERS);
  const [gatewayOnline, setGatewayOnline] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedMeterId, setSelectedMeterId] = useState<string>('total');
  const [view, setView] = useState<'dashboard' | 'sld' | 'trends'>('dashboard');
  const [showCRT, setShowCRT] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSplitView, setIsSplitView] = useState(false);
  const [mainBreakerOpen, setMainBreakerOpen] = useState(false);
  const [detailMeterId, setDetailMeterId] = useState<string | null>(null);
  const [showGatewayDetails, setShowGatewayDetails] = useState(false);
  const [detailTab, setDetailTab] = useState<'params' | 'history' | 'config'>('params');
  const detailMeter = useMemo(() => meters.find(m => m.id === detailMeterId) || null, [meters, detailMeterId]);
  const [configMeterId, setConfigMeterId] = useState<string | null>(null);
  const configMeter = useMemo(() => meters.find(m => m.id === configMeterId) || null, [meters, configMeterId]);
  const [tempThresholds, setTempThresholds] = useState({ warning: 0, alarm: 0, ctRatio: 1, vtRatio: 1, commTimeout: 2000 });

  useEffect(() => {
    if (configMeter) {
      setTempThresholds({
        warning: configMeter.thresholds.powerWarningkW,
        alarm: configMeter.thresholds.powerAlarmkW,
        ctRatio: configMeter.ctRatio || 1,
        vtRatio: configMeter.vtRatio || 1,
        commTimeout: configMeter.commTimeout || 2000
      });
    }
  }, [configMeter]);

  const handleUpdateThresholds = () => {
    if (!configMeterId) return;
    
    setMeters(prev => prev.map(m => 
      m.id === configMeterId 
        ? { 
            ...m, 
            thresholds: { ...m.thresholds, powerWarningkW: tempThresholds.warning, powerAlarmkW: tempThresholds.alarm },
            ctRatio: tempThresholds.ctRatio,
            vtRatio: tempThresholds.vtRatio,
            commTimeout: tempThresholds.commTimeout
          }
        : m
    ));
    
    setConfigMeterId(null);
  };

  const handleBreakerToggle = (meterId: string) => {
    setMeters(prev => prev.map(m => 
      m.id === meterId ? { ...m, breakerOpen: !m.breakerOpen } : m
    ));
  };

  const handleFaultToggle = (meterId: string, config?: { type: MeterData['faultType'], magnitude: number, duration: number }) => {
    setMeters(prev => prev.map(m => {
      if (m.id === meterId) {
        const isNowFaulted = !m.isFaulted;
        
        if (isNowFaulted && config) {
          return { 
            ...m, 
            isFaulted: true, 
            breakerOpen: true, // Trip on fault
            status: MeterStatus.ALARM,
            faultType: config.type,
            faultMagnitude: config.magnitude,
            faultRemainingTime: config.duration
          };
        } else if (!isNowFaulted) {
          return {
            ...m,
            isFaulted: false,
            faultType: undefined,
            faultMagnitude: undefined,
            faultRemainingTime: undefined
          };
        }
        
        // Default toggle behavior (no config)
        return { 
          ...m, 
          isFaulted: isNowFaulted, 
          breakerOpen: isNowFaulted ? true : m.breakerOpen,
          status: isNowFaulted ? MeterStatus.ALARM : m.status,
          faultRemainingTime: isNowFaulted ? 10 : undefined // Default 10s
        };
      }
      return m;
    }));
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setMeters(prev => prev.map(m => {
        // Handle fault timer
        if (m.isFaulted && m.faultRemainingTime !== undefined) {
          if (m.faultRemainingTime <= 1) {
            // Auto-clear fault
            return {
              ...m,
              isFaulted: false,
              faultRemainingTime: undefined,
              faultType: undefined,
              faultMagnitude: undefined,
              status: MeterStatus.NORMAL,
              powerW: 0, // Breaker remains open
              lastUpdate: new Date().toLocaleTimeString()
            };
          }
          return {
            ...m,
            faultRemainingTime: m.faultRemainingTime - 1
          };
        }

        // If it's faulted, it stays in ALARM and power is 0 if breaker is open
        if (m.isFaulted) {
          return {
            ...m,
            powerW: 0,
            status: MeterStatus.ALARM,
            commBlink: true,
            lastUpdate: new Date().toLocaleTimeString()
          };
        }

        // If main breaker is open, or this meter's breaker is open, power is 0
        if (mainBreakerOpen || m.breakerOpen) {
          return {
            ...m,
            powerW: 0,
            status: MeterStatus.OFFLINE,
            commBlink: false,
            lastUpdate: new Date().toLocaleTimeString()
          };
        }

        const nextPowerW = Math.max(0, m.powerW + (Math.random() - 0.5) * 50000);
        const powerkW = nextPowerW / 1000;
        
        let status = MeterStatus.NORMAL;
        if (powerkW > m.thresholds.powerAlarmkW) {
          status = MeterStatus.ALARM;
        } else if (powerkW > m.thresholds.powerWarningkW) {
          status = MeterStatus.WARNING;
        }
        
        return {
          ...m,
          powerW: nextPowerW,
          totalEnergykWh: m.totalEnergykWh + (Math.random() * 0.01),
          status: status,
          commBlink: !m.commBlink,
          lastUpdate: new Date().toLocaleTimeString()
        };
      }));

      if (Math.random() > 0.98) setGatewayOnline(prev => !prev);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const chartData = useMemo(() => {
    const filtered = HISTORICAL_DATA.filter(d => d.date >= dateRange.start && d.date <= dateRange.end);
    
    if (selectedMeterId === 'total') {
      const grouped: Record<string, { energy: number, peak: number }> = {};
      filtered.forEach(d => {
        if (!grouped[d.date]) grouped[d.date] = { energy: 0, peak: 0 };
        grouped[d.date].energy += d.dailyConsumptionkWh;
        grouped[d.date].peak += d.maxPowerW;
      });
      return Object.entries(grouped)
        .map(([date, data]) => ({ date, energy: data.energy, peakPower: data.peak / 1000 }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } else {
      return filtered
        .filter(d => d.meterId === selectedMeterId)
        .map(d => ({ date: d.date, energy: d.dailyConsumptionkWh, peakPower: d.maxPowerW / 1000 }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }
  }, [selectedMeterId, dateRange]);

  const pfChartData = useMemo(() => {
    const filtered = HISTORICAL_DATA.filter(d => d.date >= dateRange.start && d.date <= dateRange.end);
    
    if (selectedMeterId === 'total') {
      const grouped: Record<string, { pfSum: number, count: number, energy: number, peak: number }> = {};
      filtered.forEach(d => {
        if (!grouped[d.date]) grouped[d.date] = { pfSum: 0, count: 0, energy: 0, peak: 0 };
        grouped[d.date].pfSum += d.avgPowerFactor;
        grouped[d.date].count += 1;
        grouped[d.date].energy += d.dailyConsumptionkWh;
        grouped[d.date].peak += d.maxPowerW;
      });
      return Object.entries(grouped)
        .map(([date, data]) => ({ 
          date, 
          pf: data.pfSum / data.count,
          energy: data.energy,
          peakPower: data.peak / 1000
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } else {
      return filtered
        .filter(d => d.meterId === selectedMeterId)
        .map(d => ({ 
          date: d.date, 
          pf: d.avgPowerFactor,
          energy: d.dailyConsumptionkWh,
          peakPower: d.maxPowerW / 1000
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }
  }, [selectedMeterId, dateRange]);

  const handleExport = () => {
    const filtered = HISTORICAL_DATA.filter(d => 
      d.date >= dateRange.start && 
      d.date <= dateRange.end && 
      (selectedMeterId === 'total' || d.meterId === selectedMeterId)
    );

    const exportData = filtered.map(d => ({
      'Ngày': d.date,
      'Tên Đồng Hồ': d.meterName,
      'Điện Năng Tiêu Thụ (kWh)': d.dailyConsumptionkWh.toFixed(2),
      'Công Suất Đỉnh (kW)': (d.maxPowerW / 1000).toFixed(2)
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Báo Cáo Điện Năng");
    XLSX.writeFile(wb, `Bao_Cao_EM220_${selectedMeterId}_${dateRange.start}_to_${dateRange.end}.xlsx`);
  };

  return (
    <div className="h-screen flex flex-col bg-scada-bg text-scada-text font-mono overflow-hidden relative">
      {showCRT && <div className="crt-overlay" />}
      <div className="scanline" />

      {/* Header */}
      <header className="h-16 border-b border-scada-border bg-scada-panel/80 backdrop-blur-md flex items-center px-6 justify-between shrink-0 z-10">
        <div className="flex items-center gap-6">
          <motion.div 
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            className="p-2.5 bg-scada-blue/10 rounded-lg border border-scada-blue/30 shadow-[0_0_15px_rgba(0,229,255,0.1)]"
          >
            <Database className="w-7 h-7 text-scada-blue" />
          </motion.div>
          <div>
            <motion.h1 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="text-xl font-bold tracking-tighter uppercase text-white"
            >
              Hệ Thống Giám Sát Điện Năng Nhà Máy <span className="text-scada-blue">EM220</span>
            </motion.h1>
            <div className="flex items-center gap-3 text-[10px] text-scada-grey mt-0.5">
              <span className="flex items-center gap-1.5 font-bold">
                {gatewayOnline ? <Wifi className="w-3.5 h-3.5 text-scada-green" /> : <WifiOff className="w-3.5 h-3.5 text-scada-red" />}
                GATEWAY: <span className={gatewayOnline ? "text-scada-green" : "text-scada-red"}>{gatewayOnline ? 'ONLINE' : 'OFFLINE'}</span>
              </span>
              <span className="w-1 h-1 rounded-full bg-scada-border" />
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3 animate-spin-slow" />
                MODBUS RTU/TCP SCANNING...
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex bg-black/60 border border-scada-border rounded-lg p-1 shadow-inner">
            <button 
              onClick={() => setView('dashboard')}
              className={cn(
                "px-4 py-1.5 text-[10px] uppercase font-bold transition-all rounded-md",
                view === 'dashboard' ? "bg-scada-blue text-white shadow-[0_0_10px_rgba(0,229,255,0.4)]" : "text-scada-grey hover:text-white"
              )}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setView('sld')}
              className={cn(
                "px-4 py-1.5 text-[10px] uppercase font-bold transition-all rounded-md",
                view === 'sld' ? "bg-scada-blue text-white shadow-[0_0_10px_rgba(0,229,255,0.4)]" : "text-scada-grey hover:text-white"
              )}
            >
              SLD View
            </button>
            <button 
              onClick={() => setView('trends')}
              className={cn(
                "px-4 py-1.5 text-[10px] uppercase font-bold transition-all rounded-md",
                view === 'trends' ? "bg-scada-blue text-white shadow-[0_0_10px_rgba(0,229,255,0.4)]" : "text-scada-grey hover:text-white"
              )}
            >
              Trend View
            </button>
          </div>

          <div className="flex items-center gap-4 border-l border-scada-border pl-8">
            <button 
              onClick={() => setIsSplitView(!isSplitView)}
              className={cn("p-1.5 rounded border transition-colors", isSplitView ? "border-scada-blue text-scada-blue" : "border-scada-border text-scada-grey")}
              title="Toggle Split View (SLD + Gateway BFD)"
            >
              <Columns className="w-4 h-4" />
            </button>
            <button 
              onClick={toggleFullScreen}
              className={cn("p-1.5 rounded border transition-colors", isFullScreen ? "border-scada-blue text-scada-blue" : "border-scada-border text-scada-grey")}
              title="Toggle Full Screen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setShowCRT(!showCRT)}
              className={cn("p-1.5 rounded border transition-colors", showCRT ? "border-scada-blue text-scada-blue" : "border-scada-border text-scada-grey")}
              title="Toggle CRT Effect"
            >
              <Zap className="w-4 h-4" />
            </button>
            <div className="text-right">
              <div className="text-[9px] text-scada-grey uppercase tracking-widest mb-0.5">System Time</div>
              <div className="flex items-center gap-2 font-bold text-scada-blue text-sm">
                <Clock className="w-4 h-4" />
                <span className="tabular-nums">{currentTime.toLocaleDateString('vi-VN')} {currentTime.toLocaleTimeString('vi-VN', { hour12: false })}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {view === 'sld' ? (
          <motion.div 
            key="sld"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="flex-1 overflow-hidden flex"
          >
            <div className={cn("transition-all duration-500", isSplitView ? "w-1/2" : "w-full")}>
              <SLDView 
                meters={meters} 
                onMeterClick={(m) => setDetailMeterId(m.id)} 
                onGatewayClick={() => setShowGatewayDetails(true)}
                mainBreakerOpen={mainBreakerOpen}
                onMainBreakerToggle={() => setMainBreakerOpen(!mainBreakerOpen)}
                onBreakerToggle={handleBreakerToggle}
                onFaultToggle={handleFaultToggle}
              />
            </div>
            {isSplitView && (
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-1/2 border-l border-scada-border"
              >
                <GatewayBFD />
              </motion.div>
            )}
          </motion.div>
        ) : view === 'trends' ? (
          <motion.div 
            key="trends"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 overflow-hidden"
          >
            <TrendView meters={meters} />
          </motion.div>
        ) : (
          <motion.main 
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col p-6 gap-6 overflow-auto scada-grid"
          >
            {/* Quick Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                 { label: 'Total Power', value: (meters.reduce((a, b) => a + b.powerW, 0) / 1000).toFixed(2), unit: 'kW', icon: Zap, color: 'text-scada-green' },
                 { label: 'Active Alarms', value: meters.filter(m => m.status === MeterStatus.ALARM).length, unit: 'UNITS', icon: ShieldAlert, color: 'text-scada-red' },
                 { label: 'Avg Efficiency', value: '94.2', unit: '%', icon: Activity, color: 'text-scada-blue' },
                 { label: 'Daily Energy', value: '1,245.8', unit: 'kWh', icon: BarChart3, color: 'text-scada-blue' }
               ].map((stat, i) => (
                 <motion.div 
                   key={stat.label}
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ delay: i * 0.1 }}
                   className="flex"
                 >
                   <ScadaPanel className="flex-1 flex-row items-center gap-4 p-3 group overflow-hidden" isInset>
                     <div className="absolute top-0 left-0 w-1 h-full bg-scada-blue/30 group-hover:bg-scada-blue transition-colors" />
                     <div className="p-2 bg-black/40 rounded border border-scada-border group-hover:border-scada-blue/30 transition-colors">
                        <stat.icon className={cn("w-4 h-4", stat.color)} />
                     </div>
                     <div>
                        <div className="text-[9px] text-scada-grey uppercase font-bold tracking-widest">{stat.label}</div>
                        <div className="flex items-baseline gap-1">
                           <span className={cn("text-lg font-bold tabular-nums", stat.color)}>{stat.value}</span>
                           <span className="text-[8px] text-scada-grey font-bold">{stat.unit}</span>
                        </div>
                     </div>
                   </ScadaPanel>
                 </motion.div>
               ))}
            </div>

            {/* Real-time Grid */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-[1px] bg-scada-blue" />
                  <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-scada-blue">Real-time Monitoring</h2>
                </div>
                <div className="text-[10px] text-scada-grey flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-scada-green animate-pulse" />
                  LIVE DATA STREAMING
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {meters.map((meter, idx) => {
                  const powerkW = meter.powerW / 1000;
                  
                  return (
                    <motion.div
                      key={meter.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => setDetailMeterId(meter.id)}
                      className="cursor-pointer"
                    >
                      <ScadaPanel 
                        title={meter.name} 
                        status={meter.status as any}
                        className="relative"
                      >
                        <div className="absolute top-2 right-3 flex items-center gap-2.5">
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full transition-colors duration-100", 
                            meter.commBlink ? "bg-scada-blue shadow-[0_0_5px_rgba(0,229,255,0.8)]" : "bg-scada-panel"
                          )} />
                          <StatusIndicator status={meter.status} />
                        </div>
                        
                        <div className="mt-1 space-y-4">
                          <div className="flex flex-col">
                            <span className="text-[9px] text-scada-grey uppercase tracking-widest mb-1">Active Power</span>
                            <div className="flex items-baseline justify-between">
                              <span className={cn(
                                "text-3xl font-bold tracking-tighter tabular-nums", 
                                meter.status === MeterStatus.ALARM ? "text-scada-red blink glow-red" : 
                                meter.status === MeterStatus.WARNING ? "text-scada-yellow" : 
                                "text-scada-green glow-green"
                              )}>
                                {powerkW.toFixed(2)}
                              </span>
                              <span className="text-[10px] text-scada-grey font-bold">kW</span>
                            </div>
                          </div>

                          <div className="h-[1px] bg-gradient-to-r from-scada-border/50 via-scada-border to-transparent" />

                          <div className="flex flex-col">
                            <span className="text-[9px] text-scada-grey uppercase tracking-widest mb-1">Total Energy</span>
                            <div className="flex items-baseline justify-between">
                              <span className="text-xl font-bold text-scada-blue tabular-nums glow-blue">
                                {meter.totalEnergykWh.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                              </span>
                              <span className="text-[10px] text-scada-grey font-bold">kWh</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-1 text-[8px] text-scada-grey font-medium">
                            <span className="bg-black/40 px-1.5 py-0.5 rounded border border-scada-border/50">ID: {meter.id}</span>
                            <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {meter.lastUpdate}</span>
                          </div>
                        </div>
                      </ScadaPanel>
                    </motion.div>
                  );
                })}
              </div>
            </section>

            {/* Historical & Reporting */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[450px]">
              {/* Trend Chart */}
              <ScadaPanel title="Energy Consumption Trends" className="lg:col-span-2 flex flex-col" isInset>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6 px-2">
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-scada-grey uppercase font-bold tracking-widest">Meter Select</label>
                      <select 
                        value={selectedMeterId}
                        onChange={(e) => setSelectedMeterId(e.target.value)}
                        className="bg-black border border-scada-border text-[11px] text-scada-blue px-3 py-1.5 rounded focus:outline-none focus:border-scada-blue transition-colors cursor-pointer"
                      >
                        <option value="total">ALL METERS (TOTAL)</option>
                        {meters.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-scada-grey uppercase font-bold tracking-widest">Start Date</label>
                        <input 
                          type="date" 
                          value={dateRange.start}
                          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                          className="bg-black border border-scada-border text-[11px] text-scada-blue px-3 py-1.5 rounded focus:outline-none focus:border-scada-blue transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-scada-grey uppercase font-bold tracking-widest">End Date</label>
                        <input 
                          type="date" 
                          value={dateRange.end}
                          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                          className="bg-black border border-scada-border text-[11px] text-scada-blue px-3 py-1.5 rounded focus:outline-none focus:border-scada-blue transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={handleExport}
                    className="flex items-center gap-2 px-5 py-2.5 bg-scada-blue/10 border border-scada-blue/50 text-scada-blue text-[11px] font-bold hover:bg-scada-blue/20 transition-all rounded-lg shadow-lg hover:shadow-scada-blue/10"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> EXPORT REPORT
                  </button>
                </div>

                <div className="h-[350px] relative">
                  {chartData.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-scada-grey text-[11px] uppercase tracking-widest bg-black/20 rounded border border-dashed border-scada-border gap-2">
                      <span>No consumption data available for this range</span>
                      <span className="text-[9px] lowercase opacity-50">({dateRange.start} to {dateRange.end})</span>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="4 4" stroke="#222" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          stroke="#444" 
                          fontSize={9} 
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => val.split('-').slice(1).reverse().join('/')}
                        />
                        <YAxis 
                          stroke="#444" 
                          fontSize={9} 
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-[#0a0a0a] border border-[#333] p-3 rounded-lg shadow-2xl text-[10px]">
                                  <div className="text-scada-grey uppercase font-bold mb-2 border-b border-scada-border pb-1">
                                    {String(label).split('-').reverse().join('/')}
                                  </div>
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between gap-4">
                                      <span className="text-scada-grey">Consumption:</span>
                                      <span className="text-scada-blue font-bold">{data.energy.toFixed(2)} kWh</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                      <span className="text-scada-grey">Peak Power:</span>
                                      <span className="text-scada-red font-bold">{data.peakPower.toFixed(2)} kW</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                        />
                        <Bar dataKey="energy" radius={[4, 4, 0, 0]} barSize={24}>
                          {chartData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={selectedMeterId === 'total' ? '#00e5ff' : '#00ff41'} 
                              fillOpacity={0.8}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </ScadaPanel>

              {/* Operational Info */}
              <ScadaPanel title="Operational Intelligence" className="flex flex-col overflow-hidden" isInset>
                <div className="space-y-6 mt-2 flex-1 flex flex-col">
                  <div className="p-4 bg-scada-blue/5 border border-scada-blue/20 rounded-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Zap className="w-12 h-12 text-scada-blue" />
                    </div>
                    <h3 className="text-[10px] font-bold text-scada-blue uppercase mb-3 flex items-center gap-2 tracking-widest">
                      <BarChart3 className="w-3.5 h-3.5" /> Calculation Logic
                    </h3>
                    <p className="text-[10px] text-scada-grey leading-relaxed mb-3">
                      Daily consumption is derived from the delta of cumulative energy registers across 24-hour cycles.
                    </p>
                    <div className="p-2 bg-black/60 rounded border border-scada-border/50 font-mono text-[10px] text-scada-green flex items-center gap-2">
                      <code className="glow-green">ΔkWh = E_t1 - E_t0</code>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <ScadaValue label="Total System Power" value={(meters.reduce((a, b) => a + b.powerW, 0) / 1000).toFixed(2)} unit="kW" color="green" />
                    <ScadaValue label="Aggregate Energy" value={meters.reduce((a, b) => a + b.totalEnergykWh, 0).toFixed(1)} unit="kWh" color="blue" />
                    <ScadaValue label="Gateway Status" value="ACTIVE" unit="01 NODE" color="blue" />
                    <ScadaValue label="Protocol" value="MODBUS RTU" />
                  </div>

                  <div className="mt-auto pt-6 border-t border-scada-border/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[10px] text-scada-grey uppercase font-bold tracking-widest">Device Matrix</div>
                      <Info className="w-3 h-3 text-scada-grey" />
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {meters.map(m => (
                        <button 
                          key={m.id} 
                          onClick={() => setDetailMeterId(m.id)}
                          className="flex flex-col items-center gap-1.5 p-2 border border-scada-border bg-black/40 rounded-md hover:border-scada-blue/30 transition-colors cursor-pointer group/item"
                        >
                          <span className="text-[9px] font-bold text-scada-grey group-hover/item:text-scada-blue transition-colors">{m.id}</span>
                          <div className={cn(
                            "w-2 h-2 rounded-full", 
                            m.status === MeterStatus.NORMAL ? "bg-scada-green shadow-[0_0_5px_rgba(0,255,65,0.5)]" : 
                            m.status === MeterStatus.ALARM ? "bg-scada-red blink shadow-[0_0_5px_rgba(255,49,49,0.5)]" :
                            "bg-scada-yellow shadow-[0_0_5px_rgba(250,255,0,0.5)]"
                          )} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </ScadaPanel>
            </div>

            {/* Power Factor Trend */}
            <div className="grid grid-cols-1 gap-6 flex-1 min-h-[350px]">
              <ScadaPanel title="Power Factor Analysis (cosφ)" className="flex flex-col" isInset>
                <div className="flex items-center justify-between mb-6 px-2">
                  <div className="text-[10px] text-scada-grey uppercase font-bold tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-scada-yellow animate-pulse" />
                    Target PF: {'>'} 0.90
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-scada-grey">
                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 bg-scada-yellow rounded-full" /> Average PF</span>
                  </div>
                </div>
                <div className="h-[350px] relative">
                  {pfChartData.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-scada-grey text-[11px] uppercase tracking-widest bg-black/20 rounded border border-dashed border-scada-border gap-2">
                      <span>No power factor data available for this range</span>
                      <span className="text-[9px] lowercase opacity-50">({dateRange.start} to {dateRange.end})</span>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={pfChartData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="4 4" stroke="#222" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          stroke="#444" 
                          fontSize={9} 
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => String(val).split('-').slice(1).reverse().join('/')}
                        />
                        <YAxis 
                          stroke="#444" 
                          fontSize={9} 
                          tickLine={false}
                          axisLine={false}
                          domain={[0.7, 1.0]}
                        />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-[#0a0a0a] border border-[#333] p-3 rounded-lg shadow-2xl text-[10px]">
                                  <div className="text-scada-grey uppercase font-bold mb-2 border-b border-scada-border pb-1">
                                    {String(label).split('-').reverse().join('/')}
                                  </div>
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between gap-4">
                                      <span className="text-scada-grey">Power Factor:</span>
                                      <span className="text-scada-yellow font-bold">{data.pf.toFixed(3)}</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                      <span className="text-scada-grey">Consumption:</span>
                                      <span className="text-scada-blue font-bold">{data.energy.toFixed(2)} kWh</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                      <span className="text-scada-grey">Peak Power:</span>
                                      <span className="text-scada-red font-bold">{data.peakPower.toFixed(2)} kW</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="pf" 
                          stroke="#faff00" 
                          strokeWidth={2} 
                          dot={{ fill: '#faff00', r: 3 }}
                          activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </ScadaPanel>
            </div>
          </motion.main>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <Modal 
        isOpen={!!detailMeterId} 
        onClose={() => setDetailMeterId(null)} 
        title={`Device Details: ${detailMeter?.name || ''}`}
      >
        {detailMeter && (
          <div className="flex flex-col gap-6">
            {/* Tab Navigation */}
            <div className="flex gap-1 bg-black/40 p-1 rounded border border-scada-border">
              {[
                { id: 'params', label: 'Parameters', icon: Activity },
                { id: 'history', label: 'History', icon: History },
                { id: 'config', label: 'Configuration', icon: Settings }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setDetailTab(tab.id as any)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 text-[10px] uppercase font-bold transition-all rounded",
                    detailTab === tab.id ? "bg-scada-blue text-white shadow-[0_0_10px_rgba(0,229,255,0.4)]" : "text-scada-grey hover:text-white"
                  )}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {detailTab === 'params' && (
              <div className="flex flex-col gap-6">
                {/* Top Status Bar */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-black/40 border border-scada-border rounded flex flex-col">
                    <span className="text-[8px] text-scada-grey uppercase font-bold mb-1">Status</span>
                    <div className="flex items-center gap-2">
                      <StatusIndicator status={detailMeter.status} />
                      <span className={cn(
                        "text-xs font-bold uppercase",
                        detailMeter.status === MeterStatus.NORMAL ? "text-scada-green" : 
                        detailMeter.status === MeterStatus.ALARM ? "text-scada-red" : "text-scada-yellow"
                      )}>{detailMeter.status}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-black/40 border border-scada-border rounded flex flex-col">
                    <span className="text-[8px] text-scada-grey uppercase font-bold mb-1">Modbus ID</span>
                    <span className="text-xs font-bold text-scada-blue">ADDR: {detailMeter.modbusId || 'N/A'}</span>
                  </div>
                  <div className="p-3 bg-black/40 border border-scada-border rounded flex flex-col">
                    <span className="text-[8px] text-scada-grey uppercase font-bold mb-1">IP Address</span>
                    <span className="text-xs font-bold text-scada-blue">{detailMeter.ipAddress || 'N/A'}</span>
                  </div>
                  <div className="p-3 bg-black/40 border border-scada-border rounded flex flex-col">
                    <span className="text-[8px] text-scada-grey uppercase font-bold mb-1">Last Sync</span>
                    <span className="text-xs font-bold text-scada-blue">{detailMeter.lastUpdate}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Electrical Parameters */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Phase Voltages */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="w-3 h-3 text-scada-yellow" />
                          <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Phase Voltages (V)</h4>
                        </div>
                        <div className="space-y-1.5">
                          <ScadaValue label="Phase A-N" value={(220 + (Math.random() - 0.5) * 4).toFixed(1)} unit="V" color="blue" />
                          <ScadaValue label="Phase B-N" value={(221 + (Math.random() - 0.5) * 4).toFixed(1)} unit="V" color="blue" />
                          <ScadaValue label="Phase C-N" value={(219 + (Math.random() - 0.5) * 4).toFixed(1)} unit="V" color="blue" />
                        </div>
                      </div>

                      {/* Phase Currents */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="w-3 h-3 text-scada-blue" />
                          <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Phase Currents (A)</h4>
                        </div>
                        <div className="space-y-1.5">
                          <ScadaValue label="Current L1" value={(detailMeter.powerW / 660 / 0.85 + (Math.random() - 0.5) * 2).toFixed(2)} unit="A" color="blue" />
                          <ScadaValue label="Current L2" value={(detailMeter.powerW / 660 / 0.85 + (Math.random() - 0.5) * 2).toFixed(2)} unit="A" color="blue" />
                          <ScadaValue label="Current L3" value={(detailMeter.powerW / 660 / 0.85 + (Math.random() - 0.5) * 2).toFixed(2)} unit="A" color="blue" />
                        </div>
                      </div>
                    </div>

                    {/* Power & Quality */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <BarChart3 className="w-3 h-3 text-scada-green" />
                          <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Power & Quality</h4>
                        </div>
                        <div className="space-y-1.5">
                          <ScadaValue label="Active Power" value={(detailMeter.powerW / 1000).toFixed(2)} unit="kW" color="green" />
                          <ScadaValue label="Reactive Power" value={(detailMeter.powerW / 1000 * 0.3).toFixed(2)} unit="kVAR" color="yellow" />
                          <ScadaValue label="Power Factor" value={(0.85 + (Math.random() - 0.5) * 0.05).toFixed(2)} unit="cosφ" color="blue" />
                          <ScadaValue label="Frequency" value={(50 + (Math.random() - 0.5) * 0.1).toFixed(2)} unit="Hz" color="blue" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <ShieldAlert className="w-3 h-3 text-scada-red" />
                          <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Protection Settings</h4>
                        </div>
                        <div className="p-3 bg-black/20 border border-scada-border rounded space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] text-scada-grey uppercase">Warning Threshold</span>
                            <span className="text-xs font-bold text-scada-yellow">{detailMeter.thresholds.powerWarningkW} kW</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] text-scada-grey uppercase">Alarm Threshold</span>
                            <span className="text-xs font-bold text-scada-red">{detailMeter.thresholds.powerAlarmkW} kW</span>
                          </div>
                          <div className="pt-2 border-t border-scada-border/50">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] text-scada-grey uppercase">Breaker Status</span>
                              <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded", detailMeter.breakerOpen ? "bg-scada-red/20 text-scada-red" : "bg-scada-green/20 text-scada-green")}>
                                {detailMeter.breakerOpen ? 'TRIPPED/OPEN' : 'CLOSED/ACTIVE'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Visuals & Info */}
                  <div className="space-y-6">
                    {/* Load Profile Visualization */}
                    <div className="bg-black/40 border border-scada-border rounded p-4 flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[9px] text-scada-grey uppercase font-bold tracking-widest">Load Profile (24h)</span>
                        <Activity className="w-3 h-3 text-scada-blue animate-pulse" />
                      </div>
                      <div className="w-full h-32 flex items-end gap-1">
                        {[...Array(24)].map((_, i) => (
                          <div key={i} className="flex-1 flex flex-col justify-end group relative">
                            <motion.div 
                              initial={{ height: 0 }}
                              animate={{ height: `${30 + Math.random() * 70}%` }}
                              className="w-full bg-scada-blue/20 border-t border-scada-blue/50 group-hover:bg-scada-blue/40 transition-colors"
                            />
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[6px] text-scada-grey opacity-0 group-hover:opacity-100">{i}h</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-6 flex justify-between text-[8px] text-scada-grey uppercase">
                        <span>00:00</span>
                        <span>12:00</span>
                        <span>23:59</span>
                      </div>
                    </div>

                    {/* Device Metadata */}
                    <div className="bg-scada-panel/40 border border-scada-border rounded p-4 space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Info className="w-3 h-3 text-scada-blue" />
                        <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Device Information</h4>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[9px]">
                          <span className="text-scada-grey">Manufacturer</span>
                          <span className="text-white">Weidmüller</span>
                        </div>
                        <div className="flex justify-between text-[9px]">
                          <span className="text-scada-grey">Model</span>
                          <span className="text-white">EM220-RTU</span>
                        </div>
                        <div className="flex justify-between text-[9px]">
                          <span className="text-scada-grey">Serial Number</span>
                          <span className="text-scada-blue font-mono">{detailMeter.serialNumber || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-[9px]">
                          <span className="text-scada-grey">Firmware</span>
                          <span className="text-white">{detailMeter.firmwareVersion || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {detailTab === 'history' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-scada-blue uppercase tracking-widest">Historical Data Log (Last 24 Hours)</h4>
                  <ScadaButton variant="outline" className="text-[9px]">
                    <Download className="w-3 h-3" /> EXPORT LOG
                  </ScadaButton>
                </div>
                
                <div className="bg-black/40 border border-scada-border rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-scada-panel border-b border-scada-border">
                        <th className="p-3 text-[9px] text-scada-grey uppercase font-bold">Timestamp</th>
                        <th className="p-3 text-[9px] text-scada-grey uppercase font-bold text-right">Power (kW)</th>
                        <th className="p-3 text-[9px] text-scada-grey uppercase font-bold text-right">Voltage (V)</th>
                        <th className="p-3 text-[9px] text-scada-grey uppercase font-bold text-right">Current (A)</th>
                        <th className="p-3 text-[9px] text-scada-grey uppercase font-bold text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-[10px]">
                      {[...Array(10)].map((_, i) => {
                        const time = new Date(Date.now() - i * 3600000);
                        const p = (detailMeter.powerW / 1000 * (0.8 + Math.random() * 0.4)).toFixed(2);
                        return (
                          <tr key={i} className="border-b border-scada-border/30 hover:bg-white/5 transition-colors">
                            <td className="p-3 text-scada-grey">{time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} {time.toLocaleDateString('vi-VN')}</td>
                            <td className="p-3 text-right font-bold text-scada-blue">{p}</td>
                            <td className="p-3 text-right text-white">{(220 + Math.random() * 5).toFixed(1)}</td>
                            <td className="p-3 text-right text-white">{(Number(p) * 1000 / 220 / 0.85).toFixed(2)}</td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded-full bg-scada-green/10 text-scada-green border border-scada-green/20">NORMAL</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="h-48 bg-black/20 border border-scada-border rounded p-4">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[...Array(24)].map((_, i) => ({ hour: i, val: 200 + Math.random() * 300 }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="hour" stroke="#666" fontSize={8} />
                        <YAxis stroke="#666" fontSize={8} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '10px' }}
                          itemStyle={{ color: '#00e5ff' }}
                        />
                        <Bar dataKey="val" fill="#00e5ff" opacity={0.6} />
                      </BarChart>
                   </ResponsiveContainer>
                </div>
              </div>
            )}

            {detailTab === 'config' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Thresholds */}
                  <div className="p-4 bg-black/40 border border-scada-border rounded-lg space-y-4">
                    <div className="flex items-center gap-2 text-scada-yellow mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Alarm Thresholds</span>
                    </div>
                    <div className="space-y-4">
                      <ScadaInput 
                        label="Warning Level (kW)" 
                        value={tempThresholds.warning} 
                        onChange={(val) => setTempThresholds(prev => ({ ...prev, warning: val }))}
                      />
                      <ScadaInput 
                        label="Alarm Level (kW)" 
                        value={tempThresholds.alarm} 
                        onChange={(val) => setTempThresholds(prev => ({ ...prev, alarm: val }))}
                      />
                    </div>
                  </div>

                  {/* Instrument Ratios */}
                  <div className="p-4 bg-black/40 border border-scada-border rounded-lg space-y-4">
                    <div className="flex items-center gap-2 text-scada-blue mb-2">
                      <Settings className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Instrument Ratios</span>
                    </div>
                    <div className="space-y-4">
                      <ScadaInput 
                        label="CT Ratio (X:5)" 
                        value={tempThresholds.ctRatio} 
                        onChange={(val) => setTempThresholds(prev => ({ ...prev, ctRatio: val }))}
                      />
                      <ScadaInput 
                        label="VT Ratio (X:1)" 
                        value={tempThresholds.vtRatio} 
                        onChange={(val) => setTempThresholds(prev => ({ ...prev, vtRatio: val }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-black/40 border border-scada-border rounded-lg">
                  <div className="flex items-center gap-2 text-scada-grey mb-4">
                    <RefreshCw className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Communication Settings</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ScadaInput 
                      label="Comm Timeout (ms)" 
                      value={tempThresholds.commTimeout} 
                      onChange={(val) => setTempThresholds(prev => ({ ...prev, commTimeout: val }))}
                    />
                    <div className="flex items-center justify-between py-1 border-b border-scada-border/30">
                      <span className="text-[10px] text-scada-grey uppercase">Protocol</span>
                      <span className="text-[10px] text-white font-bold">MODBUS RTU / 9600-8-N-1</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-scada-border">
                  <ScadaButton 
                    className="flex-1 justify-center" 
                    onClick={() => {
                      handleUpdateThresholds();
                      setDetailMeterId(null);
                    }}
                  >
                    APPLY CHANGES
                  </ScadaButton>
                  <ScadaButton 
                    variant="outline" 
                    className="flex-1 justify-center" 
                    onClick={() => setDetailTab('params')}
                  >
                    CANCEL
                  </ScadaButton>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Gateway Details Modal */}
      <Modal
        isOpen={showGatewayDetails}
        onClose={() => setShowGatewayDetails(false)}
        title="Smart Gateway GW-01: Communication Status"
      >
        <div className="space-y-6">
          {/* Gateway Header Info */}
          <div className="flex items-center gap-6 p-4 bg-black/40 border border-scada-border rounded-lg">
            <div className="p-4 bg-scada-blue/10 rounded-lg border border-scada-blue/30 relative">
              <Database className="w-10 h-10 text-scada-blue" />
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-scada-green rounded-full border-2 border-scada-panel animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-white uppercase tracking-tighter">Smart Gateway GW-01</h3>
                <span className="px-2 py-0.5 bg-scada-green/20 text-scada-green text-[9px] font-bold rounded border border-scada-green/30">ONLINE</span>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                <div className="flex justify-between py-1 border-b border-scada-border/30">
                  <span className="text-[9px] text-scada-grey uppercase">IP Address</span>
                  <span className="text-[9px] text-white font-bold">192.168.1.10</span>
                </div>
                <div className="flex justify-between py-1 border-b border-scada-border/30">
                  <span className="text-[9px] text-scada-grey uppercase">MAC Address</span>
                  <span className="text-[9px] text-white font-bold">00:1A:2B:3C:4D:5E</span>
                </div>
                <div className="flex justify-between py-1 border-b border-scada-border/30">
                  <span className="text-[9px] text-scada-grey uppercase">Firmware</span>
                  <span className="text-[9px] text-white font-bold">v2.1.0-LTS</span>
                </div>
                <div className="flex justify-between py-1 border-b border-scada-border/30">
                  <span className="text-[9px] text-scada-grey uppercase">Uptime</span>
                  <span className="text-[9px] text-white font-bold">14d 06h 22m</span>
                </div>
              </div>
            </div>
          </div>

          {/* Communication & System Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ScadaPanel title="Modbus Traffic" className="p-4" isInset>
              <div className="space-y-4 mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-scada-blue/10 rounded border border-scada-blue/30">
                      <Download className="w-3.5 h-3.5 text-scada-blue" />
                    </div>
                    <span className="text-[10px] text-scada-grey uppercase font-bold">Packets Received</span>
                  </div>
                  <span className="text-sm font-bold text-white tabular-nums">1,245,802</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-scada-green/10 rounded border border-scada-green/30">
                      <RefreshCw className="w-3.5 h-3.5 text-scada-green" />
                    </div>
                    <span className="text-[10px] text-scada-grey uppercase font-bold">Packets Sent</span>
                  </div>
                  <span className="text-sm font-bold text-white tabular-nums">1,245,798</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-scada-red/10 rounded border border-scada-red/30">
                      <AlertTriangle className="w-3.5 h-3.5 text-scada-red" />
                    </div>
                    <span className="text-[10px] text-scada-grey uppercase font-bold">Error Rate</span>
                  </div>
                  <span className="text-sm font-bold text-scada-red tabular-nums">0.0003%</span>
                </div>
              </div>
            </ScadaPanel>

            <ScadaPanel title="Latency Trend (ms)" className="p-4" isInset>
              <div className="h-[120px] mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    { time: '10:00', latency: 22 },
                    { time: '10:01', latency: 25 },
                    { time: '10:02', latency: 21 },
                    { time: '10:03', latency: 28 },
                    { time: '10:04', latency: 24 },
                    { time: '10:05', latency: 26 },
                    { time: '10:06', latency: 23 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis stroke="#64748b" fontSize={8} domain={[0, 50]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', fontSize: '8px' }}
                    />
                    <Line type="monotone" dataKey="latency" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ScadaPanel>

            <ScadaPanel title="System Health" className="p-4" isInset>
              <div className="space-y-4 mt-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-scada-grey uppercase font-bold">
                    <span>CPU Usage</span>
                    <span className="text-scada-blue">12%</span>
                  </div>
                  <div className="h-1.5 bg-black/60 rounded-full overflow-hidden border border-scada-border/30">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '12%' }}
                      className="h-full bg-scada-blue"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-scada-grey uppercase font-bold">
                    <span>Memory Usage</span>
                    <span className="text-scada-blue">45%</span>
                  </div>
                  <div className="h-1.5 bg-black/60 rounded-full overflow-hidden border border-scada-border/30">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '45%' }}
                      className="h-full bg-scada-blue"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[9px] text-scada-grey uppercase font-bold">Core Temp</span>
                  <span className="text-sm font-bold text-scada-green">42.5°C</span>
                </div>
              </div>
            </ScadaPanel>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Connected Devices List */}
            <ScadaPanel title="Connected Devices (Modbus RTU/TCP)" className="p-4">
              <div className="space-y-2 mt-2">
                <div className="grid grid-cols-4 text-[8px] text-scada-grey uppercase font-bold border-b border-scada-border pb-1 px-2">
                  <span>Device ID</span>
                  <span>Type</span>
                  <span>Status</span>
                  <span className="text-right">Latency</span>
                </div>
                <div className="max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                  {meters.map(m => (
                    <div key={m.id} className="grid grid-cols-4 py-2 border-b border-scada-border/30 px-2 items-center hover:bg-white/5 transition-colors">
                      <span className="text-[10px] text-white font-bold">{m.id}</span>
                      <span className="text-[9px] text-scada-grey uppercase">EM220 Meter</span>
                      <div className="flex items-center gap-1.5">
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          m.status === MeterStatus.COMM_LOSS ? "bg-scada-red" : "bg-scada-green"
                        )} />
                        <span className={cn(
                          "text-[9px] font-bold uppercase",
                          m.status === MeterStatus.COMM_LOSS ? "text-scada-red" : "text-scada-green"
                        )}>
                          {m.status === MeterStatus.COMM_LOSS ? 'LOST' : 'OK'}
                        </span>
                      </div>
                      <span className="text-[9px] text-scada-blue font-bold text-right tabular-nums">
                        {m.status === MeterStatus.COMM_LOSS ? '---' : `${Math.floor(Math.random() * 50) + 10}ms`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </ScadaPanel>

            {/* Live Comm Log */}
            <ScadaPanel title="Live Communication Log" className="p-4">
              <div className="bg-black/60 rounded border border-scada-border/50 p-2 h-[180px] overflow-y-auto font-mono text-[8px] space-y-1 custom-scrollbar">
                {[
                  { time: '10:15:30', type: 'TX', msg: 'READ_HOLDING_REG [30053, 10] -> ID: 01' },
                  { time: '10:15:30', type: 'RX', msg: 'SUCCESS: 20 bytes received' },
                  { time: '10:15:31', type: 'TX', msg: 'READ_HOLDING_REG [30053, 10] -> ID: 02' },
                  { time: '10:15:31', type: 'RX', msg: 'SUCCESS: 20 bytes received' },
                  { time: '10:15:32', type: 'TX', msg: 'READ_HOLDING_REG [30053, 10] -> ID: 03' },
                  { time: '10:15:34', type: 'ERR', msg: 'TIMEOUT: No response from ID: 03' },
                  { time: '10:15:35', type: 'TX', msg: 'RETRY [1/3] -> ID: 03' },
                  { time: '10:15:37', type: 'ERR', msg: 'TIMEOUT: No response from ID: 03' },
                  { time: '10:15:38', type: 'TX', msg: 'READ_HOLDING_REG [30053, 10] -> ID: 04' },
                  { time: '10:15:38', type: 'RX', msg: 'SUCCESS: 20 bytes received' },
                ].map((log, i) => (
                  <div key={i} className="flex gap-2 border-b border-scada-border/10 pb-1">
                    <span className="text-scada-grey">[{log.time}]</span>
                    <span className={cn(
                      "font-bold",
                      log.type === 'TX' ? 'text-scada-blue' : 
                      log.type === 'RX' ? 'text-scada-green' : 'text-scada-red'
                    )}>{log.type}</span>
                    <span className="text-white">{log.msg}</span>
                  </div>
                ))}
              </div>
            </ScadaPanel>
          </div>

          <div className="flex justify-end">
            <ScadaButton onClick={() => setShowGatewayDetails(false)}>
              CLOSE MONITOR
            </ScadaButton>
          </div>
        </div>
      </Modal>

      {/* AVE - AI Assistant */}
      <AVEAIChat 
        meters={meters} 
        gatewayOnline={gatewayOnline} 
        mainBreakerOpen={mainBreakerOpen} 
      />

      {/* Footer */}
      <footer className="h-8 border-t border-scada-border bg-scada-panel/90 backdrop-blur-sm flex items-center px-6 justify-between shrink-0 text-[10px] text-scada-grey z-10">
        <div className="flex gap-6">
          <span className="flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5 text-scada-blue" /> SCAN CYCLE: <span className="text-scada-text">2000ms</span></span>
          <span className="flex items-center gap-2 uppercase"><Activity className="w-3.5 h-3.5 text-scada-blue" /> Protocol: <span className="text-scada-text">Weidmüller EM220 / FC04</span></span>
        </div>
        <div className="flex gap-6 font-bold">
          <span className="flex items-center gap-1.5"><div className="w-1 h-1 bg-scada-blue rounded-full" /> SYSTEM: <span className="text-scada-blue">SCADA_ENERGY_V2.4</span></span>
          <span className="flex items-center gap-1.5"><div className="w-1 h-1 bg-scada-blue rounded-full" /> DEVELOPED BY: <span className="text-white">IoT ARCHITECT</span></span>
        </div>
      </footer>
      {/* Threshold Config Modal */}
      <Modal
        isOpen={!!configMeterId}
        onClose={() => setConfigMeterId(null)}
        title={`Configure Thresholds: ${configMeter?.name || ''}`}
      >
        {configMeter && (
          <div className="space-y-6">
            <div className="p-4 bg-black/40 border border-scada-border rounded-lg space-y-4">
              <div className="flex items-center gap-2 text-scada-yellow mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Power Thresholds (kW)</span>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <ScadaInput 
                    label="Warning Level" 
                    value={tempThresholds.warning} 
                    onChange={(val) => setTempThresholds(prev => ({ ...prev, warning: val }))}
                    unit="kW"
                  />
                  <p className="text-[9px] text-scada-grey italic">Triggers WARNING status when power exceeds this value.</p>
                </div>
                
                <div className="space-y-1">
                  <ScadaInput 
                    label="Alarm Level" 
                    value={tempThresholds.alarm} 
                    onChange={(val) => setTempThresholds(prev => ({ ...prev, alarm: val }))}
                    unit="kW"
                  />
                  <p className="text-[9px] text-scada-grey italic">Triggers ALARM status when power exceeds this value.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <ScadaButton 
                className="flex-1 justify-center" 
                onClick={handleUpdateThresholds}
              >
                SAVE CONFIGURATION
              </ScadaButton>
              <ScadaButton 
                variant="outline" 
                className="flex-1 justify-center" 
                onClick={() => setConfigMeterId(null)}
              >
                CANCEL
              </ScadaButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
