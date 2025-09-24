# PokerPal

A web-based poker tracking application with computer vision chip detection.

## Features

- **Player Management**: Create and edit player profiles with personal information
- **Session Tracking**: Check-in/check-out workflow with photo documentation
- **Computer Vision**: Automatic chip counting by color from photos
- **Leaderboard**: Real-time player rankings by total winnings
- **Admin Panel**: Configure chip values and override session data
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **Frontend**: AngularJS 1.8, Bootstrap 5, HTML5, CSS3
- **Backend**: Node.js, Express.js
- **Database**: SQLite
- **Computer Vision**: TensorFlow.js (planned)
- **Authentication**: JWT tokens

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Project Structure

```
pokerpal/
├── index.html              # Main HTML file
├── package.json            # Node.js dependencies
├── server.js              # Express server entry point
├── css/
│   └── app.css            # Custom styles
├── js/
│   ├── app.js             # AngularJS app configuration
│   ├── controllers/       # AngularJS controllers
│   ├── services/          # AngularJS services
│   └── directives/        # AngularJS directives
├── views/                 # AngularJS templates
├── server/                # Backend API files
└── uploads/               # Photo storage directory
```

## Development

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## License

MIT License