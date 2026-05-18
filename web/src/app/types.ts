export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  researcherName: string;
  approach: string;
  sampleCalculated: boolean;
  createdAt: string;
  updatedAt: string;
  designType?: string;
  checklistChecked?: string;
  wizardStep?: number;
  sampleMethod?: string;
  sampleSizeFormula?: string;
  sampleSizeValue?: number;
  variableDefinitions?: string;
  lemR?: string;
  lemP?: string;
  lemD?: string;
  lemZ?: string;
  sloN?: string;
  sloE?: string;
  cocZ?: string;
  cocP?: string;
  cocQ?: string;
  cocD?: string;
  fedT?: string;
  fedK?: string;
  kroA?: string;
  kroB?: string;
  kroC?: string;
  kroD?: string;
  babThreeContentEn?: string;
  babThreeContentId?: string;
}

export interface AdminStats {
  totalUsers: number;
  totalProjects: number;
  dbSizeBytes: number;
  serverUptimeSeconds: number;
  allocatedHeapMb: number;
  approachStats: {
    kuantitatif: number;
    kualitatif: number;
    metodeCampuran: number;
    [key: string]: number;
  };
  users: User[];
  projects: Project[];
}
