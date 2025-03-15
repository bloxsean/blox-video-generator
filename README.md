# HeyGen Video Creator

A proof of concept application for creating videos using the HeyGen API.

## Features

- Browse available HeyGen templates
- Select a template and customize the text content
- Generate videos using the HeyGen API
- Monitor video generation progress
- View and download completed videos

## Setup Instructions

### Backend Setup

1. Navigate to the project directory
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with your HeyGen API key:
   ```
   PORT=3001
   HEYGEN_API_KEY=your_api_key_here
   ```
4. Start the server:
   ```
   npm start
   ```

### Frontend Setup

1. In a new terminal, navigate to the project directory
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Open your browser and navigate to: http://localhost:5173

## Usage

1. Browse available templates and click on one to select it
2. Fill in the text fields as required by the template
3. Click "Generate Video" to start the video generation process
4. Wait for the video to be generated (this may take a few minutes)
5. Once complete, you can view and download the video

## Technologies Used

- Backend: Node.js, Express.js
- Frontend: React.js, TypeScript, Tailwind CSS
- API Integration: Axios

## License

This project is licensed under the MIT License.
