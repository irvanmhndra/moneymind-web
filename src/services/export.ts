import apiClient from './api';

export interface ExportRequest {
  format: 'csv' | 'json';
  data_types: string[];
  start_date?: string;
  end_date?: string;
}

export interface ExportResult {
  content: string;
  filename: string;
  content_type: string;
  size: number;
}

export interface ExportOptions {
  format: 'csv' | 'json';
  dataTypes: {
    expenses: boolean;
    budgets: boolean;
    goals: boolean;
    categories: boolean;
    accounts: boolean;
  };
  dateRange?: {
    start_date: string;
    end_date: string;
  };
}

class ExportService {
  async exportData(options: ExportOptions): Promise<ExportResult> {
    const dataTypes = Object.keys(options.dataTypes)
      .filter(key => options.dataTypes[key as keyof typeof options.dataTypes]);

    const request: ExportRequest = {
      format: options.format,
      data_types: dataTypes,
      start_date: options.dateRange?.start_date,
      end_date: options.dateRange?.end_date,
    };

    return await apiClient.post('/export', request);
  }

  async downloadFile(exportResult: ExportResult): Promise<void> {
    const blob = new Blob([exportResult.content], {
      type: exportResult.content_type
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = exportResult.filename;
    
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  async exportAndDownload(options: ExportOptions): Promise<void> {
    try {
      const result = await this.exportData(options);
      await this.downloadFile(result);
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  // Quick export functions for common use cases
  async exportExpenses(format: 'csv' | 'json' = 'csv', dateRange?: { start_date: string; end_date: string }): Promise<void> {
    const options: ExportOptions = {
      format,
      dataTypes: {
        expenses: true,
        budgets: false,
        goals: false,
        categories: false,
        accounts: false,
      },
      dateRange,
    };

    return this.exportAndDownload(options);
  }

  async exportBudgets(format: 'csv' | 'json' = 'csv'): Promise<void> {
    const options: ExportOptions = {
      format,
      dataTypes: {
        expenses: false,
        budgets: true,
        goals: false,
        categories: false,
        accounts: false,
      },
    };

    return this.exportAndDownload(options);
  }

  async exportGoals(format: 'csv' | 'json' = 'csv'): Promise<void> {
    const options: ExportOptions = {
      format,
      dataTypes: {
        expenses: false,
        budgets: false,
        goals: true,
        categories: false,
        accounts: false,
      },
    };

    return this.exportAndDownload(options);
  }

  async exportAll(format: 'csv' | 'json' = 'csv', dateRange?: { start_date: string; end_date: string }): Promise<void> {
    const options: ExportOptions = {
      format,
      dataTypes: {
        expenses: true,
        budgets: true,
        goals: true,
        categories: true,
        accounts: true,
      },
      dateRange,
    };

    return this.exportAndDownload(options);
  }

  // Utility functions
  getFormattedDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getDateRangePresets() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

    return {
      thisMonth: {
        start_date: this.getFormattedDate(startOfMonth),
        end_date: this.getFormattedDate(today),
        label: 'This Month'
      },
      thisYear: {
        start_date: this.getFormattedDate(startOfYear),
        end_date: this.getFormattedDate(today),
        label: 'This Year'
      },
      last30Days: {
        start_date: this.getFormattedDate(thirtyDaysAgo),
        end_date: this.getFormattedDate(today),
        label: 'Last 30 Days'
      },
      last90Days: {
        start_date: this.getFormattedDate(ninetyDaysAgo),
        end_date: this.getFormattedDate(today),
        label: 'Last 90 Days'
      },
      allTime: {
        start_date: undefined,
        end_date: undefined,
        label: 'All Time'
      }
    };
  }

  validateDateRange(startDate: string, endDate: string): string | null {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return 'Start date must be before end date';
    }

    if (end > new Date()) {
      return 'End date cannot be in the future';
    }

    const maxRangeMs = 2 * 365 * 24 * 60 * 60 * 1000; // 2 years
    if (end.getTime() - start.getTime() > maxRangeMs) {
      return 'Date range cannot exceed 2 years';
    }

    return null;
  }
}

export const exportService = new ExportService();