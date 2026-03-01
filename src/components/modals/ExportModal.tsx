import React, { useState } from 'react';
import { X, Download, FileText, Database } from 'lucide-react';
import { exportService } from '../../services/export';

interface ExportOptions {
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

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDataTypes?: Partial<ExportOptions['dataTypes']>;
  title?: string;
}

const ExportModal: React.FC<ExportModalProps> = ({ 
  isOpen, 
  onClose, 
  defaultDataTypes = {},
  title = "Export Data"
}) => {
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [dataTypes, setDataTypes] = useState<ExportOptions['dataTypes']>({
    expenses: defaultDataTypes.expenses ?? true,
    budgets: defaultDataTypes.budgets ?? false,
    goals: defaultDataTypes.goals ?? false,
    categories: defaultDataTypes.categories ?? false,
    accounts: defaultDataTypes.accounts ?? false,
  });
  const [dateRange, setDateRange] = useState<{start_date: string; end_date: string} | undefined>();
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const datePresets = exportService.getDateRangePresets();

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    if (preset === '') {
      setDateRange(undefined);
    } else {
      const presetData = datePresets[preset as keyof typeof datePresets];
      if (presetData.start_date && presetData.end_date) {
        setDateRange({
          start_date: presetData.start_date,
          end_date: presetData.end_date
        });
      } else {
        setDateRange(undefined);
      }
    }
  };

  const handleDataTypeChange = (type: keyof ExportOptions['dataTypes'], checked: boolean) => {
    setDataTypes(prev => ({
      ...prev,
      [type]: checked
    }));
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate that at least one data type is selected
      const selectedTypes = Object.values(dataTypes).some(Boolean);
      if (!selectedTypes) {
        setError('Please select at least one data type to export');
        return;
      }

      // Validate date range if provided
      if (dateRange && dateRange.start_date && dateRange.end_date) {
        const validationError = exportService.validateDateRange(dateRange.start_date, dateRange.end_date);
        if (validationError) {
          setError(validationError);
          return;
        }
      }

      const options: ExportOptions = {
        format,
        dataTypes,
        dateRange
      };

      await exportService.exportAndDownload(options);
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Export failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose}></div>
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="format"
                    value="csv"
                    checked={format === 'csv'}
                    onChange={(e) => setFormat(e.target.value as 'csv')}
                    className="mr-2"
                  />
                  <FileText className="w-4 h-4 mr-2 text-green-600" />
                  <span className="text-sm">CSV</span>
                </label>
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="format"
                    value="json"
                    checked={format === 'json'}
                    onChange={(e) => setFormat(e.target.value as 'json')}
                    className="mr-2"
                  />
                  <Database className="w-4 h-4 mr-2 text-blue-600" />
                  <span className="text-sm">JSON</span>
                </label>
              </div>
            </div>

            {/* Data Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data to Export
              </label>
              <div className="space-y-2">
                {Object.entries(dataTypes).map(([key, value]) => (
                  <label key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handleDataTypeChange(key as keyof ExportOptions['dataTypes'], e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm capitalize">{key}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range (Optional)
              </label>
              
              <div className="mb-3">
                <select
                  value={selectedPreset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Custom Range</option>
                  {Object.entries(datePresets).map(([key, preset]) => (
                    <option key={key} value={key}>{preset.label}</option>
                  ))}
                </select>
              </div>

              {selectedPreset === '' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={dateRange?.start_date || ''}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value } as { start_date: string; end_date: string }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">End Date</label>
                    <input
                      type="date"
                      value={dateRange?.end_date || ''}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value } as { start_date: string; end_date: string }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Download className="w-4 h-4" />
              )}
              {loading ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;