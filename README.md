# 360 Ghar AI Property Search Assistant

A polished, internship-ready React + Vite project for 360 Ghar, India's AI-powered real estate platform.

## Project Overview

This app lets users search Gurgaon properties in natural language. It uses OpenRouter to transform search queries into structured filters, rank and display properties in a premium card grid, and generate property summaries with AI.

## Features

- Natural language property search with AI filter extraction
- Responsive premium property cards with hover and glassmorphism styling
- Intelligent ranking of properties when exact matches are not available
- Property detail modal with AI-generated matching summary
- Bonus follow-up question generation for vague queries
- Voice search support using the browser Web Speech API

## Setup Steps

1. Clone or open the project folder.
2. Create a `.env` file in the root with the OpenRouter API key.
3. Run:

```bash
npm install
npm run dev
```

## Environment Variables

Create a `.env` file at the project root with:

```env
VITE_OPENROUTER_KEY=your_openrouter_api_key_here
```

## OpenRouter Model Used

- `meta-llama/llama-3-8b-instruct:free`

## Architecture Notes

- `src/App.jsx` contains the main UI and search flow.
- `src/api.js` handles OpenRouter requests and parsing logic.
- `src/properties.js` stores mock Gurgaon property data.
- `src/App.css` provides the complete dark luxury UI.

## Prompt Design Notes

- Search parsing is handled by a strict system prompt that returns only raw JSON.
- Property summaries use a professional advisor prompt with a warm tone and clear budget/location fit.
- Follow-up questions are generated for vague search queries to improve user clarity.
