# Real-Time Chat Application with Image Upload

This project is a real-time chat application built using FastAPI and Google's Gemini AI. It allows users to interact with an AI model and receive responses based on both text and images they upload during the chat. The app uses WebSockets to establish a persistent connection for a smooth, real-time chat experience.

## Features
- Real-time chat communication via WebSocket.
- Uploading images in base64 format, which the AI model can use to respond to user queries.
- Integration with Google Gemini AI model to generate responses based on the provided image and text.
- Web-based interface served by FastAPI.

## Requirements

Before running the project, make sure to have the following dependencies installed:

- Python 3.7+
- Google API Key (`GOOGLE_API_KEY`)
- `pip` (Python package manager)

### Install dependencies:
```bash
pip install -r requirements.txt