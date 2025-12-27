/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // 文本颜色层级
        'text-primary': '#1f2937',
        'text-secondary': '#4b5563',
        'text-tertiary': '#6b7280',
        'text-disabled': '#d1d5db',
        'text-accent': '#2563eb',
        'text-accent-secondary': '#3b82f6',
        'text-empty-state-icon': '#9ca3af',

        // 状态背景
        'state-base-hover': '#f3f4f6',
        'state-accent-active': '#eff6ff',
        'state-accent-active-alt': '#dbeafe',
        'state-accent-outline': '#3b82f6',
        'state-destructive-hover': '#fee2e2',

        // 组件背景
        'components-actionbar-bg': 'rgba(255, 255, 255, 0.95)',
        'components-actionbar-border': '#e5e7eb',
        'components-panel-bg': '#ffffff',
        'components-panel-bg-blur': 'rgba(255, 255, 255, 0.95)',
        'components-panel-border': '#e5e7eb',
        'components-badge-bg-dimm': '#f3f4f6',
        'components-tooltip-bg': 'rgba(255, 255, 255, 0.95)',
        'components-kbd-bg-gray': '#f3f4f6',
        'components-button-primary-bg': '#3b82f6',
        'components-button-primary-bg-hover': '#2563eb',

        // 分割线
        'divider-regular': '#e5e7eb',
        'divider-subtle': '#f3f4f6',

        // 阴影
        'shadow-shadow-5': 'rgba(0, 0, 0, 0.05)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        'slide-in-from-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'slide-in-from-right': 'slide-in-from-right 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
};

