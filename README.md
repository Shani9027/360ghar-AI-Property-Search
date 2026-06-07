# 360 Ghar AI Property Search Assistant

An AI-powered property search application built using React, Vite, and OpenRouter. The application allows users to search for properties using natural language and voice commands, making property discovery more intuitive and user-friendly.

## Features

* AI-powered property search
* Natural language query understanding
* Voice search using Web Speech API
* Smart property filtering and ranking
* Property cards with key details
* AI-generated property summaries
* Responsive and modern user interface
* Follow-up questions for vague search queries

## Demo Search Queries

Try queries like:

* 2BHK in Sector 50 under 80 lakhs near school
* 3BHK near metro with gym
* Property near Golf Course Road
* Affordable 2BHK in Gurgaon

## Tech Stack

* React.js
* Vite
* JavaScript
* OpenRouter API
* CSS

## Project Structure

```text
src/
├── App.jsx
├── App.css
├── api.js
├── properties.js
└── main.jsx
```

## Installation

Clone the repository:

```bash
git clone https://github.com/Shani9027/360ghar-AI-Property-Search.git
cd 360ghar-AI-Property-Search
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root:

```env
VITE_OPENROUTER_KEY=your_openrouter_api_key
```

Start the development server:

```bash
npm run dev
```

## How It Works

1. User enters a property search query or uses voice input.
2. The query is sent to OpenRouter for filter extraction.
3. Extracted filters are applied to the property dataset.
4. Matching properties are displayed in a responsive card layout.
5. Users can open a property card to view an AI-generated summary.

## OpenRouter Integration

The application uses OpenRouter for:

* Property filter extraction
* AI-generated property summaries
* Follow-up question generation

The API key is loaded securely using environment variables and is not included in the repository.

## Learning Outcomes

Through this project, I gained hands-on experience with:

* AI API integration
* Prompt engineering
* React state management
* Frontend application development
* Voice search implementation
* Environment variable management

## OpenRouter Model Used

* openai/gpt-oss-20b:free

The model is used for:

* Natural language query parsing
* AI-generated property summaries
* Follow-up question generation

## Prompt Design Notes

* Used a structured system prompt to convert natural language property queries into JSON filters.
* Extracted location, BHK type, budget, and preferences from user input.
* Initially tested generic prompts but responses were inconsistent.
* Switched to a strict JSON-only response format for reliable parsing.
* Used OpenRouter free-tier models for both query understanding and property summaries.
* Designed prompts to generate concise and personalized property recommendations.
* Added follow-up question generation for vague or incomplete searches.

## Author

Shani Sharma

GitHub:
https://github.com/Shani9027/360ghar-AI-Property-Search
