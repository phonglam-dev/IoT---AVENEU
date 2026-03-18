import React, { useMemo, useState } from 'react';
import { MeterData, DailyData } from '../types';
import { HISTORICAL_DATA } from '../constants';
import { ScadaPanel, ScadaButton, cn } from './UI';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, AreaChart, Area 
} from 'recharts';
import { Calendar, Download, TrendingUp, Zap, Activity, BarChart3, ChevronRight, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';

interface TrendViewProps {
  meters: MeterData[];
}

export const TrendView: React.FC<TrendViewProps> = ({ meters }) => {
  const [selectedMeterId, setSelectedMeterId] = useState<string>('total');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const trendData = useMemo(() => {
    const filtered = HISTORICAL_DATA.filter(d => d.date >= dateRange.start && d.date <= dateRange.end);
    
    if (selectedMeterId === 'total') {
      const grouped: Record<string, { energy: number, peak: number, pfSum: number, count: number }> = {};
      filtered.forEach(d => {
        if (!grouped[d.date]) grouped[d.date] = { energy: 0, peak: 0, pfSum: 0, count: 0 };
        grouped[d.date].energy += d.dailyConsumptionkWh;
        grouped[d.date].peak += d.maxPowerW;
        grouped[d.date].pfSum += d.avgPowerFactor;
        grouped[d.date].count += 1;
      });
      return Object.entries(grouped)
        .map(([date, data]) => ({ 
          date, 
          energy: data.energy, 
          peakPower: data.peak / 1000,
          pf: data.pfSum / data.count
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } else {
      return filtered
        .filter(d => d.meterId === selectedMeterId)
        .map(d => ({ 
          date: d.date, 
          energy: d.dailyConsumptionkWh, 
          peakPower: d.maxPowerW / 1000,
          pf: d.avgPowerFactor
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
      'Date': d.date,
      'Device Name': d.meterName,
      'Energy Consumption (kWh)': d.dailyConsumptionkWh.toFixed(2),
      'Peak Power (kW)': (d.maxPowerW / 1000).toFixed(2),
      'Avg Power Factor': d.avgPowerFactor.toFixed(3)
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Trend Report");
    XLSX.writeFile(wb, `Trend_Report_${selectedMeterId}_${dateRange.start}_to_${dateRange.end}.xlsx`);
  };

  const selectedMeterName = selectedMeterId === 'total' ? 'All Devices (Aggregated)' : meters.find(m => m.id === selectedMeterId)?.name;

  return (
    <div className="flex-1 flex flex-col p-6 gap-6 overflow-auto bg-scada-bg">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-scada-panel/40 p-4 border border-scada-border rounded-lg backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-scada-blue/10 rounded border border-scada-blue/30">
            <TrendingUp className="w-5 h-5 text-scada-blue" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Device Trend Analysis</h2>
            <p className="text-[10px] text-scada-grey uppercase mt-0.5">Historical Performance & Analytics</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded border border-scada-border">
            <Filter className="w-3.5 h-3.5 text-scada-grey" />
            <select 
              value={selectedMeterId}
              onChange={(e) => setSelectedMeterId(e.target.value)}
              className="bg-transparent text-[10px] text-scada-blue font-bold uppercase outline-none cursor-pointer"
            >
              <option value="total" className="bg-scada-panel">Total Aggregated</option>
              {meters.map(m => (
                <option key={m.id} value={m.id} className="bg-scada-panel">{m.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded border border-scada-border">
            <Calendar className="w-3.5 h-3.5 text-scada-grey" />
            <input 
              type="date" 
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="bg-transparent text-[10px] text-scada-blue font-bold outline-none cursor-pointer"
            />
            <span className="text-scada-grey text-[10px]">TO</span>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="bg-transparent text-[10px] text-scada-blue font-bold outline-none cursor-pointer"
            />
          </div>

          <ScadaButton onClick={handleExport} className="gap-2 h-9">
            <Download className="w-4 h-4" />
            <span className="text-[10px]">EXPORT REPORT</span>
          </ScadaButton>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ScadaPanel className="p-4 relative overflow-hidden group" isInset>
          <div className="absolute top-0 left-0 w-1 h-full bg-scada-blue/30 group-hover:bg-scada-blue transition-colors" />
          <div className="flex justify-between items-start mb-2">
            <div className="text-[10px] text-scada-grey uppercase font-bold tracking-widest">Total Energy</div>
            <BarChart3 className="w-4 h-4 text-scada-blue" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tabular-nums">
              {trendData.reduce((a, b) => a + b.energy, 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </span>
            <span className="text-xs text-scada-grey font-bold">kWh</span>
          </div>
          <div className="mt-2 text-[9px] text-scada-green flex items-center gap-1">
            <ChevronRight className="w-3 h-3" />
            <span>PERIOD TOTAL FOR {selectedMeterName}</span>
          </div>
        </ScadaPanel>

        <ScadaPanel className="p-4 relative overflow-hidden group" isInset>
          <div className="absolute top-0 left-0 w-1 h-full bg-scada-yellow/30 group-hover:bg-scada-yellow transition-colors" />
          <div className="flex justify-between items-start mb-2">
            <div className="text-[10px] text-scada-grey uppercase font-bold tracking-widest">Peak Power</div>
            <Zap className="w-4 h-4 text-scada-yellow" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tabular-nums">
              {Math.max(...trendData.map(d => d.peakPower)).toFixed(2)}
            </span>
            <span className="text-xs text-scada-grey font-bold">kW</span>
          </div>
          <div className="mt-2 text-[9px] text-scada-yellow flex items-center gap-1">
            <ChevronRight className="w-3 h-3" />
            <span>MAXIMUM RECORDED IN PERIOD</span>
          </div>
        </ScadaPanel>

        <ScadaPanel className="p-4 relative overflow-hidden group" isInset>
          <div className="absolute top-0 left-0 w-1 h-full bg-scada-green/30 group-hover:bg-scada-green transition-colors" />
          <div className="flex justify-between items-start mb-2">
            <div className="text-[10px] text-scada-grey uppercase font-bold tracking-widest">Avg Power Factor</div>
            <Activity className="w-4 h-4 text-scada-green" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tabular-nums">
              {(trendData.reduce((a, b) => a + b.pf, 0) / (trendData.length || 1)).toFixed(3)}
            </span>
            <span className="text-xs text-scada-grey font-bold">PF</span>
          </div>
          <div className="mt-2 text-[9px] text-scada-green flex items-center gap-1">
            <ChevronRight className="w-3 h-3" />
            <span>AVERAGE EFFICIENCY RATIO</span>
          </div>
        </ScadaPanel>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[400px]">
        <ScadaPanel title="Energy Consumption Trend (kWh)" className="flex flex-col">
          <div className="flex-1 min-h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickFormatter={(val) => val.split('-').slice(1).join('/')}
                />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '4px', fontSize: '10px' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Area type="monotone" dataKey="energy" stroke="#3b82f6" fillOpacity={1} fill="url(#colorEnergy)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ScadaPanel>

        <ScadaPanel title="Peak Power Trend (kW)" className="flex flex-col">
          <div className="flex-1 min-h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickFormatter={(val) => val.split('-').slice(1).join('/')}
                />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '4px', fontSize: '10px' }}
                  itemStyle={{ color: '#eab308' }}
                />
                <Bar dataKey="peakPower" fill="#eab308" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ScadaPanel>

        <ScadaPanel title="Power Factor Stability" className="flex flex-col lg:col-span-2">
          <div className="flex-1 min-h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickFormatter={(val) => val.split('-').slice(1).join('/')}
                />
                <YAxis stroke="#64748b" fontSize={10} domain={[0.7, 1]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '4px', fontSize: '10px' }}
                  itemStyle={{ color: '#22c55e' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Line 
                  type="stepAfter" 
                  dataKey="pf" 
                  name="Power Factor" 
                  stroke="#22c55e" 
                  strokeWidth={2} 
                  dot={{ r: 2, fill: '#22c55e' }}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ScadaPanel>
      </div>
    </div>
  );
};
