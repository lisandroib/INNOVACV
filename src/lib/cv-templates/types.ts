export interface CVTemplate {
  id: string;
  name: string;
  description: string;
  generateHTML: (data: any) => string;
}
