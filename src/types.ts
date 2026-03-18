
export enum MeterStatus {
  NORMAL = 'NORMAL',
  COMM_LOSS = 'COMM_LOSS',
  WARNING = 'WARNING',
  ALARM = 'ALARM',
  OFFLINE = 'OFFLINE',
}

export interface MeterThresholds {
  powerWarningkW: number;
  powerAlarmkW: number;
  voltageWarningMinV: number;
  voltageWarningMaxV: number;
  voltageAlarmMinV: number;
  voltageAlarmMaxV: number;
}

export interface MeterData {
  id: string;
  name: string;
  powerW: number; // Register 30053 (Watts)
  totalEnergykWh: number; // Register 30343 (kWh)
  status: MeterStatus;
  lastUpdate: string;
  commBlink: boolean;
  thresholds: MeterThresholds;
  breakerOpen?: boolean;
  isFaulted?: boolean;
  faultType?: 'SLG' | 'L-L' | 'L-L-G' | '3-PHASE';
  faultMagnitude?: number; // in kA or relative
  faultRemainingTime?: number; // seconds
  serialNumber?: string;
  firmwareVersion?: string;
  ipAddress?: string;
  modbusId?: number;
  ctRatio?: number;
  vtRatio?: number;
  commTimeout?: number; // ms
}

export interface DailyData {
  date: string;
  meterId: string;
  meterName: string;
  dailyConsumptionkWh: number; // Max(today) - Max(yesterday)
  maxPowerW: number;
  avgPowerFactor: number;
}
