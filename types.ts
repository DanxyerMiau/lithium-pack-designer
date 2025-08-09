export interface PackConfig {
  series: number;
  parallel: number;
  totalCells: number;
  actualVoltage: number;
  actualCapacity: number;
  totalEnergy: number;
}

export interface EbikeResult {
  totalEnergy: number;
  requiredCapacity: number;
}

export enum RangeUnit {
  KM = 'km',
  MILES = 'miles',
}

export enum RidingStyle {
  CONSTANT = 'constant',
  FREQUENT_START = 'frequent',
}

export enum CellType {
  C18650 = '18650',
  C21700 = '21700',
  C26650 = '26650',
  C32700 = '32700',
}

export interface CellDimensions {
  diameter: number; // in mm
  height: number; // in mm
}

export enum ModelType {
  ENCLOSURE = 'enclosure',
  BRACKET = 'bracket',
}

export interface BracketDimensions {
  holeDiameter: number; // in mm
  outerWidth: number; // in mm
  outerDepth: number; // in mm
}
