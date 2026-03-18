import { MeterData, MeterStatus, DailyData } from './types';

const DEFAULT_THRESHOLDS = {
  powerWarningkW: 480,
  powerAlarmkW: 500,
  voltageWarningMinV: 380,
  voltageWarningMaxV: 415,
  voltageAlarmMinV: 370,
  voltageAlarmMaxV: 425,
};

export const MOCK_METERS: MeterData[] = [
  { 
    id: 'M1', name: 'M1 - Inverter 1', powerW: 450500, totalEnergykWh: 125400.2, status: MeterStatus.NORMAL, lastUpdate: '12:32:05', commBlink: true, thresholds: { ...DEFAULT_THRESHOLDS }, breakerOpen: false,
    serialNumber: 'WM-2024-001', firmwareVersion: 'v2.4.1', ipAddress: '192.168.1.101', modbusId: 1,
    ctRatio: 100, vtRatio: 1, commTimeout: 2000
  },
  { 
    id: 'M2', name: 'M2 - Inverter 2', powerW: 442100, totalEnergykWh: 121300.5, status: MeterStatus.NORMAL, lastUpdate: '12:32:04', commBlink: false, thresholds: { ...DEFAULT_THRESHOLDS }, breakerOpen: false,
    serialNumber: 'WM-2024-002', firmwareVersion: 'v2.4.1', ipAddress: '192.168.1.102', modbusId: 2,
    ctRatio: 100, vtRatio: 1, commTimeout: 2000
  },
  { 
    id: 'M3', name: 'M3 - Inverter 3', powerW: 0, totalEnergykWh: 118900.8, status: MeterStatus.COMM_LOSS, lastUpdate: '12:31:50', commBlink: false, thresholds: { ...DEFAULT_THRESHOLDS }, breakerOpen: true,
    serialNumber: 'WM-2024-003', firmwareVersion: 'v2.4.0', ipAddress: '192.168.1.103', modbusId: 3,
    ctRatio: 100, vtRatio: 1, commTimeout: 5000
  },
  { 
    id: 'M4', name: 'M4 - Auxiliary 1', powerW: 12500, totalEnergykWh: 5400.1, status: MeterStatus.NORMAL, lastUpdate: '12:32:06', commBlink: true, thresholds: { ...DEFAULT_THRESHOLDS, powerWarningkW: 15, powerAlarmkW: 20 }, breakerOpen: false,
    serialNumber: 'WM-2024-004', firmwareVersion: 'v1.1.2', ipAddress: '192.168.1.104', modbusId: 4,
    ctRatio: 10, vtRatio: 1, commTimeout: 1000
  },
  { 
    id: 'M5', name: 'M5 - Inverter 4', powerW: 455800, totalEnergykWh: 128700.4, status: MeterStatus.NORMAL, lastUpdate: '12:32:03', commBlink: true, thresholds: { ...DEFAULT_THRESHOLDS }, breakerOpen: false,
    serialNumber: 'WM-2024-005', firmwareVersion: 'v2.4.1', ipAddress: '192.168.1.105', modbusId: 5,
    ctRatio: 100, vtRatio: 1, commTimeout: 2000
  },
  { 
    id: 'M6', name: 'M6 - Inverter 5', powerW: 448200, totalEnergykWh: 124500.9, status: MeterStatus.WARNING, lastUpdate: '12:32:05', commBlink: false, thresholds: { ...DEFAULT_THRESHOLDS }, breakerOpen: false,
    serialNumber: 'WM-2024-006', firmwareVersion: 'v2.4.1', ipAddress: '192.168.1.106', modbusId: 6,
    ctRatio: 100, vtRatio: 1, commTimeout: 2000
  },
  { 
    id: 'M7', name: 'M7 - Transformer', powerW: 2250400, totalEnergykWh: 854000.5, status: MeterStatus.NORMAL, lastUpdate: '12:32:06', commBlink: true, thresholds: { ...DEFAULT_THRESHOLDS, powerWarningkW: 2400, powerAlarmkW: 2500 }, breakerOpen: false,
    serialNumber: 'WM-2024-X01', firmwareVersion: 'v3.0.0', ipAddress: '192.168.1.10', modbusId: 10,
    ctRatio: 500, vtRatio: 1, commTimeout: 3000
  },
  { 
    id: 'M8', name: 'M8 - Battery', powerW: -150000, totalEnergykWh: 45000.2, status: MeterStatus.NORMAL, lastUpdate: '12:32:04', commBlink: true, thresholds: { ...DEFAULT_THRESHOLDS, powerWarningkW: 200, powerAlarmkW: 250 }, breakerOpen: false,
    serialNumber: 'WM-2024-B01', firmwareVersion: 'v2.1.5', ipAddress: '192.168.1.20', modbusId: 20,
    ctRatio: 200, vtRatio: 1, commTimeout: 2000
  },
];

export const generate40DayHistory = (): DailyData[] => {
  const data: DailyData[] = [];
  const now = new Date();
  
  for (let i = 40; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    MOCK_METERS.forEach(meter => {
      data.push({
        date,
        meterId: meter.id,
        meterName: meter.name,
        dailyConsumptionkWh: 200 + Math.random() * 100,
        maxPowerW: 400000 + Math.random() * 100000,
        avgPowerFactor: 0.85 + Math.random() * 0.12
      });
    });
  }
  return data;
};

export const HISTORICAL_DATA = generate40DayHistory();
