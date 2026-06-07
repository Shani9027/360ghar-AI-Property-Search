const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_KEY;

async function callOpenRouter(messages, maxTokens = 220) {
  if (!OPENROUTER_KEY) {
    throw new Error('Missing VITE_OPENROUTER_KEY environment variable.');
  }

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://360ghar.ai',
      'X-Title': '360 Ghar AI Property Assistant'
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3-8b-instruct:free',
      messages,
      max_tokens: maxTokens,
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter request failed: ${errorText}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim() || '';
}

function safeParseJson(rawText) {
  if (!rawText) return null;
  const firstBrace = rawText.indexOf('{');
  if (firstBrace === -1) return null;

  let depth = 0;
  let endIndex = -1;
  for (let i = firstBrace; i < rawText.length; i += 1) {
    const char = rawText[i];
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    if (depth === 0) {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) return null;
  const candidate = rawText.slice(firstBrace, endIndex + 1);

  try {
    return JSON.parse(candidate);
  } catch (error) {
    return null;
  }
}

export async function parseSearchQuery(query) {
  const systemPrompt = `You are a real estate filter extraction engine.
Convert user property search queries into structured JSON.
Return ONLY valid raw JSON.
Never return markdown.
Never return code fences.
Never return explanations.

Schema:
{
  "bhk": number|null,
  "location": string|null,
  "max_price_lakhs": number|null,
  "amenities": [],
  "preferences": []
}
If information is missing, return null or [].`;

  const userPrompt = query.trim();
  const rawText = await callOpenRouter([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ], 180);

  const parsed = safeParseJson(rawText);
  if (!parsed) {
    return {
      bhk: null,
      location: null,
      max_price_lakhs: null,
      amenities: [],
      preferences: []
    };
  }

  return {
    bhk: typeof parsed.bhk === 'number' ? parsed.bhk : null,
    location: parsed.location ? String(parsed.location).trim() : null,
    max_price_lakhs: typeof parsed.max_price_lakhs === 'number' ? parsed.max_price_lakhs : null,
    amenities: Array.isArray(parsed.amenities) ? parsed.amenities.filter(Boolean).map(String) : [],
    preferences: Array.isArray(parsed.preferences) ? parsed.preferences.filter(Boolean).map(String) : []
  };
}

export async function generatePropertySummary(userQuery, property) {
  const systemPrompt = `You are a helpful real-estate advisor at 360 Ghar.
Explain why the property matches the user's search.
Maximum 3 sentences.
Mention budget fit.
Mention location match.
Mention at least one preference or amenity.
Warm and professional tone.
No bullet points.
No marketing exaggeration.`;

  const propertyText = `Title: ${property.title}
Sector: ${property.sector}
BHK: ${property.bhk}
Area: ${property.area_sqft} sqft
Price: ${property.price_lakhs} lakhs
Amenities: ${property.amenities.join(', ')}
Tags: ${property.tags.join(', ')}`;

  const userPrompt = `User Query:\n"${userQuery}"\n\nProperty:\n${propertyText}`;
  return await callOpenRouter([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ], 180);
}

export async function generateFollowupQuestion(query) {
  const systemPrompt = `You are a real estate assistant.
If the user's search query is vague or missing important details like BHK, budget, or location, ask one single follow-up clarification question.
If the search is already specific enough, return an empty string.
Return only the question or an empty string.`;

  const rawText = await callOpenRouter([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: query.trim() }
  ], 120);

  return rawText.trim();
}
