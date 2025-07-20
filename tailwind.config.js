/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Wildflower Meadow Palette
        primary: {
          50: '#fef2f2',
          100: '#fde8e8',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#C41E3A', // Deep Magenta
          600: '#a0182e',
          700: '#7c1223',
          800: '#580d19',
          900: '#34080f',
        },
        secondary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#FF8C00', // Vibrant Orange
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        accent: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#FFD700', // Sunflower Yellow
          600: '#eab308',
          700: '#ca8a04',
          800: '#a16207',
          900: '#854d0e',
        },
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#4169E1', // Cornflower Blue
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#7CB342', // Fresh Green
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#FF8C00', // Vibrant Orange
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#C41E3A', // Deep Magenta
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Additional wildflower colors
        plum: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#DDA0DD', // Soft Plum
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        },
        cream: {
          50: '#fefefe',
          100: '#fefefe',
          200: '#fefefe',
          300: '#fefefe',
          400: '#fefefe',
          500: '#F5F5DC', // Creamy White
          600: '#e5e5c7',
          700: '#d4d4b2',
          800: '#c3c39d',
          900: '#b2b288',
        },
        // Background gradients
        meadow: {
          50: '#f0f8f0',
          100: '#e8f5e8',
          200: '#d1ebd1',
          300: '#b3ddb3',
          400: '#8cc88c',
          500: '#7CB342',
          600: '#6ba339',
          700: '#5a8a30',
          800: '#497127',
          900: '#38581e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'bloom': 'bloom 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        bloom: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'large': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 2px 10px -2px rgba(0, 0, 0, 0.05)',
        'wildflower': '0 8px 32px -8px rgba(196, 30, 58, 0.15), 0 4px 16px -4px rgba(255, 140, 0, 0.1)',
      },
      backgroundImage: {
        'meadow-gradient': 'linear-gradient(135deg, #f0f8f0 0%, #e8f5e8 50%, #d1ebd1 100%)',
        'sunset-gradient': 'linear-gradient(135deg, #FFD700 0%, #FF8C00 50%, #C41E3A 100%)',
        'wildflower-gradient': 'linear-gradient(135deg, #DDA0DD 0%, #4169E1 50%, #7CB342 100%)',
      }
    },
  },
  plugins: [],
} 