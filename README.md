# What Even With My Hot Self?! 🔥

A body, mind, and emotional changes tracker for women in perimenopause and beyond. This Progressive Web App (PWA) provides personalized tracking with time-based views, data visualization, and secure Google Drive storage.

## Features

### 🌅 Time-Based Views
- **Morning Report** (before 9 AM): Track sleep, energy, and wearable data
- **Evening Report** (after 8 PM): Reflect on your day with sentiment tracking and notes
- **Quick Track** (9 AM - 8 PM): Rapid check-ins throughout the day

### 📱 Progressive Web App
- Works offline with automatic sync when connected
- Add to home screen for app-like experience
- Mobile-first responsive design with Tailwind CSS
- Service worker for offline functionality

### 🔒 Privacy-First
- Data stored in your personal Google Drive (app-data scope)
- No data shared with third parties
- Client-side encryption for sensitive data
- Local storage monitoring and warnings

### 📊 Smart Tracking
- **25+ customizable tracking items** across body and mind categories
- Multiple display options (text, face emojis, heart emojis, dot emojis)
- Wearable integration (sleep score, body battery)
- Multi-select options for joint pain tracking
- Daily notes and reflections in evening reports

### ⚡ Real-Time Sync
- Automatic Google Drive synchronization
- Offline support with sync queue
- Conflict resolution with timestamp validation
- Background sync when coming back online

### 📈 Data Insights
- 6-week trend analysis with Chart.js visualizations
- Weekly averages and patterns
- Correlation insights between different symptoms
- Export functionality for data analysis

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Google Cloud Platform account (for Google Drive API)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd what-even-with-my-hot-self
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Google Drive API**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google Drive API
   - Create OAuth 2.0 credentials with app-data scope
   - Add your domain to authorized origins
   - Download the client configuration

4. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
   VITE_ENVIRONMENT=development
   VITE_MOCK_GOOGLE_DRIVE=false
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run deploy` - Build and deploy to GitHub Pages
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

### Project Structure

```
src/
├── components/          # React components
│   ├── auth-screen.jsx  # Google Drive authentication
│   ├── app-header.jsx   # Main app header
│   ├── insights.jsx     # Data visualization
│   ├── settings.jsx     # User configuration
│   ├── logs.jsx         # Activity logs
│   └── ...
├── views/              # Main app views
│   ├── dashboard.jsx   # Main app interface
│   ├── morning-view.jsx # Morning tracking form
│   ├── evening-view.jsx # Evening tracking form
│   ├── quick-track-view.jsx # Quick tracking interface
│   └── onboarding.jsx  # User onboarding
├── constants/          # App constants and configurations
│   ├── tracking-items.js # 25+ tracking item definitions
│   └── scale-types.js  # Scale type definitions
├── services/          # External service integrations
│   └── google-drive-service.js # Google Drive API
├── stores/            # State management
│   └── app-store.js   # Main Zustand store
├── utils/             # Utility functions
│   ├── validation.js  # Data validation schemas
│   ├── compression.js # Data compression utilities
│   ├── encryption.js  # Client-side encryption
│   ├── i18n.js        # Internationalization
│   └── ...
├── workers/           # Service workers
│   └── service-worker-manager.jsx # PWA functionality
└── main.jsx          # App entry point
```

### Mock Mode

For development without Google Drive API:
```env
VITE_MOCK_GOOGLE_DRIVE=true
```

This enables mock data and simulated API responses.

## Deployment

### GitHub Pages

1. **Build and deploy**
   ```bash
   npm run deploy
   ```

2. **Configure GitHub Pages**
   - Set source to `gh-pages` branch
   - Configure custom domain if desired
   - Set up environment variables in repository secrets

### Environment Variables for Production

```env
VITE_GOOGLE_CLIENT_ID=your_production_client_id
VITE_ENVIRONMENT=production
VITE_MOCK_GOOGLE_DRIVE=false
```

## Configuration

### Tracking Items

The app includes 25+ tracking items organized into categories:

**Body Items:**
- Allergic Reactions (3-point scale)
- Bleeding or Spotting (3-point scale)
- Diet Triggers (5-point scale)
- Eating Habits (3-point scale)
- Energy Level (5-point scale)
- Exercise Impact (5-point scale)
- Forehead Shine (3-point scale)
- Headache (3-point scale)
- Hormone Symptoms (5-point scale)
- Hot Flashes (5-point scale)
- Hydration (3-point scale)
- Joint Pain (multi-select)
- Nausea (3-point scale)
- Pill Pack Start Date (date)
- Sleep Quality (5-point scale)
- Temperature Sensitivity (3-point scale)
- Wearable's Body Battery (0-100)
- Wearable's Sleep Score (0-100)
- Workout Recovery (3-point scale)

**Mind Items:**
- Anxiety (5-point scale)
- Brain Fog (3-point scale)
- Depression (5-point scale)
- Irritability (5-point scale)
- Mood (3-point scale)
- Overall Sentiment (5-point scale)
- Social Stamina (5-point scale)
- Stress Level (5-point scale)
- Weird Dreams (3-point scale)

### Display Options

Choose from four display types:
- **Text**: Descriptive phrases like "I'm good", "Maybe a little anxious", etc.
- **Face Emojis**: 😎, 🙂, 😐, 😧, 😭
- **Heart Emojis**: 💚, 💛, 🧡, ❤️, 💜
- **Dot Emojis**: 🟢, 🟡, 🟠, 🔴, 🟣

### View Availability

- **Morning View**: Available before 9 AM (configurable)
- **Evening View**: Available after 8 PM (configurable)
- **Quick Track**: Available during middle hours (9 AM - 8 PM)

## Data Storage

### Google Drive Integration
- Uses Google Drive API with app-data scope
- Creates hidden folder in user's Google Drive
- Monthly JSON files for tracking data
- Configuration stored in `config.json`
- Automatic file splitting for large datasets

### Local Storage
- Current month's data cached locally
- Offline entries stored with sync queue
- Configuration and preferences
- Storage monitoring with warnings

### Data Schema

```json
{
  "version": "1.0.0",
  "month": "2025-01",
  "entries": [
    {
      "id": "entry_1737014200000_abc123",
      "timestamp": "2025-01-15T08:30:00.000Z",
      "type": "morning",
      "sync_status": "synced",
      "energy_level": 3,
      "sleep_quality": 4,
      "hot_flashes": 2,
      "notes": {
        "observations": "Had a good day overall",
        "reflections": "Feeling more energetic lately",
        "thankful_for": "My supportive friends"
      },
      "created_at": "2025-01-15T08:30:00.000Z",
      "updated_at": "2025-01-15T08:30:00.000Z"
    }
  ]
}
```

## Privacy & Security

### Data Protection
- All data stored in user's Google Drive
- No server-side data storage
- Client-side encryption for sensitive notes
- No analytics or tracking without consent
- Local storage monitoring and cleanup

### Google Drive Permissions
- **Scope**: `https://www.googleapis.com/auth/drive.appdata`
- **Access**: Only to app-specific folder
- **Visibility**: Hidden from main Drive interface
- **Refresh Tokens**: 7-day lifetime for unverified apps

## Technical Features

### Performance
- Lazy loading of components
- Code splitting with Vite
- Optimized bundle sizes
- Service worker caching
- Background sync

### Accessibility
- WCAG 2.1 AA compliance
- Screen reader support
- Keyboard navigation
- High contrast ratios
- Semantic HTML structure

### Testing
- Jest for unit testing
- React Testing Library
- Accessibility testing with axe-core
- Mock service worker for API testing

## Contributing

This is a personal project with limited scope (6 users). For feature requests or bug reports, please contact the maintainer directly.

## License

MIT License - see LICENSE file for details.

## Support

For support or questions:
- Check the app's built-in help and settings
- Review the configuration options
- Contact the maintainer for technical issues

---

**Built with ❤️ for women navigating perimenopause**