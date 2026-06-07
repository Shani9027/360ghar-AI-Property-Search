import { useEffect, useState } from 'react';
import properties from './properties.js';
import { parseSearchQuery, generatePropertySummary, generateFollowupQuestion } from './api.js';

const hasSpeechSupport = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

function toLower(value) {
  return String(value || '').toLowerCase();
}

function isExactMatch(property, filters) {
  if (filters.bhk !== null && property.bhk !== filters.bhk) return false;
  if (filters.max_price_lakhs !== null && property.price_lakhs > filters.max_price_lakhs) return false;
  if (filters.location && !toLower(property.location).includes(toLower(filters.location)) && !toLower(property.sector).includes(toLower(filters.location))) return false;

  const allPreferences = [...filters.amenities, ...filters.preferences].map(toLower);
  return allPreferences.every((term) => {
    return [property.sector, property.location, ...property.amenities, ...property.tags]
      .some((value) => toLower(value).includes(term));
  });
}

function getScore(property, filters) {
  let score = 0;
  const locationMatch = filters.location && (toLower(property.location).includes(toLower(filters.location)) || toLower(property.sector).includes(toLower(filters.location)));
  if (locationMatch) score += 40;
  if (filters.max_price_lakhs !== null && property.price_lakhs <= filters.max_price_lakhs) score += 30;
  if (filters.bhk !== null && property.bhk === filters.bhk) score += 20;

  const preferenceTerms = [...filters.amenities, ...filters.preferences].map(toLower);
  preferenceTerms.forEach((term) => {
    const found = [...property.amenities, ...property.tags].some((value) => toLower(value).includes(term));
    if (found) score += 10;
  });

  return score;
}

function isQueryVague(filters, rawQuery) {
  const filled = [filters.bhk, filters.location, filters.max_price_lakhs, filters.amenities.length, filters.preferences.length].filter((value) => value !== null && value !== 0 && value !== '').length;
  return rawQuery.trim() && filled < 2;
}

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [displayProperties, setDisplayProperties] = useState(properties);
  const [filters, setFilters] = useState({ bhk: null, location: null, max_price_lakhs: null, amenities: [], preferences: [] });
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [exactMatchFound, setExactMatchFound] = useState(false);
  const [activeProperty, setActiveProperty] = useState(null);
  const [summaryText, setSummaryText] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [followupQuestion, setFollowupQuestion] = useState('');
  const [followupLoading, setFollowupLoading] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(hasSpeechSupport);

  useEffect(() => {
    setVoiceSupported(hasSpeechSupport);
  }, []);

  async function handleSearch(query) {
    const trimmed = query.trim();
    if (!trimmed) {
      setDisplayProperties(properties);
      setFilters({ bhk: null, location: null, max_price_lakhs: null, amenities: [], preferences: [] });
      setSearchError('');
      setExactMatchFound(false);
      setFollowupQuestion('');
      return;
    }

    setLoading(true);
    setSearchError('');
    try {
      const parsed = await parseSearchQuery(trimmed);
      setFilters(parsed);

      const matchedProperties  = properties.filter((property) => isExactMatch(property, parsed));
      const sortedProperties  = [...properties]
        .map((property) => ({ property, score: getScore(property, parsed) }))
        .sort((a, b) => b.score - a.score)
        .map((item) => item.property);

      if (matchedProperties.length) {
        setDisplayProperties(matchedProperties);
        setExactMatchFound(true);
      } else {
        setDisplayProperties(sortedProperties);
        setExactMatchFound(false);
      }

      if (isQueryVague(parsed, trimmed)) {
        setFollowupLoading(true);
        const question = await generateFollowupQuestion(trimmed);
        setFollowupQuestion(question);
      } else {
        setFollowupQuestion('');
      }
    } catch (error) {
      setSearchError('Could not interpret the search query. Try a simpler phrase or refresh the page.');
      setDisplayProperties(properties);
      setExactMatchFound(false);
      setFollowupQuestion('');
    } finally {
      setLoading(false);
      setFollowupLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await handleSearch(searchQuery);
  }

  async function handleVoice() {
    if (!voiceSupported) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      await handleSearch(transcript);
    };

    recognition.onerror = () => {
      setSearchError('Voice recognition is not available right now.');
    };

    recognition.start();
  }

  function openProperty(property) {
    setActiveProperty(property);
    setSummaryText('');
    setSummaryLoading(true);
    generatePropertySummary(searchQuery || 'User search', property)
      .then((value) => setSummaryText(value || 'The assistant could not create a summary at this time.'))
      .catch(() => setSummaryText('The assistant could not create a summary at this time.'))
      .finally(() => setSummaryLoading(false));
  }

  function closeModal() {
    setActiveProperty(null);
    setSummaryText('');
  }

  const resultMessage = exactMatchFound
    ? `Showing ${displayProperties.length} exact match${displayProperties.length === 1 ? '' : 'es'} for your search.`
    : `Showing ${displayProperties.length} ranked result${displayProperties.length === 1 ? '' : 's'} for your search.`;

  return (
    <div className="page-shell">
      <div className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">360 Ghar</p>
          <h1>AI Property Search Assistant</h1>
          <p>Search properties in Gurgaon using natural language and get AI based recommendations.</p>
        </div>
        <form className="search-panel" onSubmit={handleSubmit}>
          <label htmlFor="search" className="search-label">
            Search for a property in Gurgaon
          </label>
          <div className="search-field-group">
            <input
              id="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="e.g. 2BHK in Sector 50 under 80 lakhs, near school"
            />
            <button type="button" className="mic-button" onClick={handleVoice} aria-label="Voice search">
              🎤
            </button>
            <button type="submit" className="search-button">
              {loading ? 'Searching…' : 'Search'}
            </button>
          </div>
          <div className="search-hint-row">
            <span>Try "2BHK in Sector 50 under 80 lakhs" or "3BHK near metro with gym".</span>
            <span>{voiceSupported ? 'Tap the mic to speak' : 'Voice search not supported'}</span>
          </div>
          {followupLoading && <div className="alert-box">Checking if a follow-up question would help...</div>}
          {followupQuestion && !followupLoading && <div className="followup-card">{followupQuestion}</div>}
          {searchError && <div className="alert-box error">{searchError}</div>}
        </form>
      </div>

      <section className="results-panel">
        <div className="results-header">
          <div>
            <p className="results-count">{resultMessage}</p>
            <p className="results-note">Use the AI assistant to refine your search or explore premium options.</p>
          </div>
          <div className="filter-badge">Smart Search</div>
        </div>

        <div className="grid-panel">
          {displayProperties.map((property) => (
            <article key={property.id} className="property-card">
              <div className="image-shell">
                <img src={property.image} alt={property.title} />
                <div className="match-chip">✦ {property.tags[0] || 'Recommended'}</div>
              </div>
              <div className="card-content">
                <h2>{property.title}</h2>
                <p className="property-meta">{property.bhk}BHK • {property.area_sqft} sqft • {property.sector}</p>
                <p className="property-price">₹ {property.price_lakhs}L</p>
                <div className="tag-row">
                  {property.tags.slice(0, 2).map((tag, index) => (
                    <span key={index} className="tag-pill">{tag}</span>
                  ))}
                </div>
                <button className="details-button" onClick={() => openProperty(property)}>
                  View Details
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {activeProperty && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <button className="modal-close" onClick={closeModal} aria-label="Close details">
              ×
            </button>
            <div className="modal-header">
              <div>
                <p className="eyebrow">Property Detail</p>
                <h2>{activeProperty.title}</h2>
                <p className="property-meta">{activeProperty.sector} • {activeProperty.location}</p>
              </div>
              <p className="property-price">₹ {activeProperty.price_lakhs}L</p>
            </div>
            <div className="modal-body">
              <img src={activeProperty.image} alt={activeProperty.title} />
              <div className="modal-details">
                <div className="detail-grid">
                  <div><strong>BHK</strong><span>{activeProperty.bhk}</span></div>
                  <div><strong>Area</strong><span>{activeProperty.area_sqft} sqft</span></div>
                  <div><strong>Sector</strong><span>{activeProperty.sector}</span></div>
                  <div><strong>Location</strong><span>{activeProperty.location}</span></div>
                </div>
                <div className="amenities-block">
                  <strong>Amenities</strong>
                  <div className="amenities-list">
                    {activeProperty.amenities.map((amenity) => (
                      <span key={amenity}>{amenity}</span>
                    ))}
                  </div>
                </div>
                <div className="summary-block">
                  <strong>Why this property matches</strong>
                  {summaryLoading ? (
                    <div className="loading-chip">Generating AI summary…</div>
                  ) : (
                    <p>{summaryText}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
