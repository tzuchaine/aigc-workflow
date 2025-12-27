/**
 * 动态参数表单组件
 * 根据 ParameterDefinition 自动渲染表单字段
 */

import { memo } from 'react';
import type { ParameterDefinition } from '../hooks/useProviders';

interface ParameterFormProps {
  parameters: ParameterDefinition[];
  values: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
  disabled?: boolean;
}

export const ParameterForm = memo(({ parameters, values, onChange, disabled }: ParameterFormProps) => {
  const renderField = (param: ParameterDefinition) => {
    const value = values[param.name] ?? param.default ?? '';

    switch (param.type) {
      case 'textarea':
        return (
          <textarea
            key={param.name}
            value={String(value)}
            onChange={(e) => onChange(param.name, e.target.value)}
            placeholder={param.placeholder}
            maxLength={param.maxLength}
            disabled={disabled}
            className="w-full resize-none rounded border border-neutral-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none disabled:bg-neutral-100"
            rows={3}
          />
        );

      case 'number':
        return (
          <input
            key={param.name}
            type="number"
            value={Number(value)}
            onChange={(e) => onChange(param.name, Number(e.target.value))}
            min={param.min}
            max={param.max}
            step={param.step}
            disabled={disabled}
            className="w-full rounded border border-neutral-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none disabled:bg-neutral-100"
          />
        );

      case 'select':
        return (
          <select
            key={param.name}
            value={String(value)}
            onChange={(e) => onChange(param.name, e.target.value)}
            disabled={disabled}
            className="w-full rounded border border-neutral-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none disabled:bg-neutral-100"
          >
            {!param.required && <option value="">-- 请选择 --</option>}
            {param.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'boolean':
        return (
          <label key={param.name} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onChange(param.name, e.target.checked)}
              disabled={disabled}
              className="h-4 w-4 rounded border-neutral-300 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-xs text-neutral-700">{param.label}</span>
          </label>
        );

      case 'string':
      default:
        return (
          <input
            key={param.name}
            type="text"
            value={String(value)}
            onChange={(e) => onChange(param.name, e.target.value)}
            placeholder={param.placeholder}
            maxLength={param.maxLength}
            disabled={disabled}
            className="w-full rounded border border-neutral-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none disabled:bg-neutral-100"
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      {parameters.map((param) => {
        // 布尔类型特殊处理（checkbox 自带 label）
        if (param.type === 'boolean') {
          return renderField(param);
        }

        return (
          <div key={param.name}>
            <label className="mb-1 block text-xs font-medium text-neutral-700">
              {param.label}
              {param.required && <span className="ml-0.5 text-red-500">*</span>}
            </label>
            {renderField(param)}
            {param.description && (
              <p className="mt-0.5 text-xs text-neutral-500">{param.description}</p>
            )}
          </div>
        );
      })}
    </div>
  );
});

ParameterForm.displayName = 'ParameterForm';
