
import { useEffect, useState } from 'react'
import {
  Sprout,
  CloudSun,
  FlaskConical,
  Leaf,
  MapPin,
  LoaderCircle,
  AlertTriangle,
  CheckCircle2,
  Droplets,
  ThermometerSun,
  Wind,
  ChevronRight,
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const initial = {
  N: 90,
  P: 42,
  K: 43,
  temperature: 25,
  humidity: 80,
  ph: 6.5,
  rainfall: 200,
  soil_moisture: 45,
  location: 'Jaipur',
}

function Field({
  label,
  name,
  value,
  onChange,
  min,
  max,
  step = 'any',
  suffix = '',
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-wrap">
        <input
          type="number"
          name={name}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={onChange}
          required
        />
        <small>{suffix}</small>
      </div>
    </label>
  )
}

function App() {
  const [form, setForm] = useState({ ...initial })
  const [result, setResult] = useState(null)
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [error, setError] = useState('')
  const [weatherError, setWeatherError] = useState('')
  const [tab, setTab] = useState('recommend')
  const [page, setPage] = useState('form')

  useEffect(() => {
    const syncPage = () => {
      setPage(
        window.location.pathname === '/recommendation-results'
          ? 'results'
          : 'form'
      )
    }

    window.addEventListener('popstate', syncPage)

    return () => {
      window.removeEventListener('popstate', syncPage)
    }
  }, [])

  // Return to the form without clearing previously entered values.
  const openForm = () => {
    window.history.pushState({}, '', '/')
    setPage('form')
    setTab('recommend')
    window.scrollTo(0, 0)
  }

  // Start a completely new recommendation with default values.
  const tryAnotherRecommendation = () => {
    setForm({ ...initial })
    setResult(null)
    setWeather(null)
    setError('')
    setWeatherError('')
    setPage('form')
    setTab('recommend')
    window.history.pushState({}, '', '/')
    window.scrollTo(0, 0)
  }

  const openResults = () => {
    window.history.pushState({}, '', '/recommendation-results')
    setPage('results')
    window.scrollTo(0, 0)
  }

  const change = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const recommend = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const payload = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [
          key,
          key === 'location' ? value : Number(value),
        ])
      )

      const res = await fetch(`${API}/api/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || 'Recommendation failed')
      }

      setResult(data)
      setTab('recommend')
      openResults()
    } catch (err) {
      setError(
        `${err.message}. Check that the FastAPI backend is running.`
      )
    } finally {
      setLoading(false)
    }
  }

  const getWeather = async (e) => {
    e?.preventDefault()
    setWeatherLoading(true)
    setWeatherError('')
    setWeather(null)

    try {
      const res = await fetch(
        `${API}/api/weather?location=${encodeURIComponent(form.location)}`
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || 'Could not retrieve weather')
      }

      setWeather(data)
      setTab('weather')
    } catch (err) {
      setWeatherError(err.message)
    } finally {
      setWeatherLoading(false)
    }
  }

  const weatherCode = (code) =>
    ({
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Rime fog',
      51: 'Light drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow',
      80: 'Rain showers',
      95: 'Thunderstorm',
    })[code] || 'Variable conditions'

  const fmt = (value) => (value == null ? '—' : value)

  return (
    <div className="app-shell">
      <header className="topbar">
        <a
          className="brand"
          href="/"
          onClick={(e) => {
            e.preventDefault()
            openForm()
          }}
        >
          <span className="brand-mark">
            <Sprout size={24} />
          </span>
          <span>
            CropWise
            <small>SMART FARMING ADVISORY</small>
          </span>
        </a>

        <div className="top-tag">
          <span className="live-dot" /> Farmer decision support
        </div>
      </header>

      <main>
        {page === 'form' && (
          <>
            <section className="hero">
              <div className="hero-copy">
                <span className="eyebrow">DATA-DRIVEN AGRICULTURE</span>
                <h1>
                  Better decisions.
                  <br />
                  <em>Healthier harvests.</em>
                </h1>
                <p>
                  Crop recommendations and practical weather guidance
                  tailored to your farm conditions.
                </p>

                <div className="hero-pills">
                  <span>
                    <CheckCircle2 size={15} /> Crop recommendation
                  </span>
                  <span>
                    <CloudSun size={15} /> Weather advisory
                  </span>
                  <span>
                    <Leaf size={15} /> Soil guidance
                  </span>
                </div>
              </div>

              <div className="hero-art" aria-hidden="true">
                <div className="sun" />
                <div className="hill hill-back" />
                <div className="hill hill-front" />
                <div className="crop-row row-one">
                  ♧　♧　♧　♧　♧
                </div>
                <div className="crop-row row-two">
                  ♧　♧　♧　♧　♧
                </div>
                <div className="art-label">
                  <Sprout size={17} /> GROW WITH CONFIDENCE
                </div>
              </div>
            </section>

            <div className="workspace">
              <aside className="sidebar">
                <div className="side-heading">YOUR FARM</div>

                <button
                  className={
                    tab === 'recommend'
                      ? 'nav-item active'
                      : 'nav-item'
                  }
                  onClick={() => {
                    setTab('recommend')
                    openForm()
                  }}
                >
                  <Sprout size={18} />
                  Crop recommendation
                  <ChevronRight size={16} />
                </button>

                <button
                  className={
                    tab === 'weather'
                      ? 'nav-item active'
                      : 'nav-item'
                  }
                  onClick={() => setTab('weather')}
                >
                  <CloudSun size={18} />
                  Weather advisory
                  <ChevronRight size={16} />
                </button>

                <div className="side-note">
                  <span className="note-icon">
                    <Leaf size={18} />
                  </span>
                  <b>Local knowledge matters</b>
                  <p>
                    Use these results as decision support alongside soil
                    testing and advice from your local agriculture officer.
                  </p>
                </div>

                <div className="side-meta">
                  <span className="live-dot" /> SYSTEM READY
                  <span className="version">MVP 1.0</span>
                </div>
              </aside>

              <section className="main-panel">
                <div className="panel-heading">
                  <div>
                    <span className="eyebrow">
                      {tab === 'recommend'
                        ? 'PERSONALIZED CROP PLANNING'
                        : 'LOCAL WEATHER'}
                    </span>

                    <h2>
                      {tab === 'recommend'
                        ? 'Tell us about your farm'
                        : 'Weather outlook'}
                    </h2>

                    <p>
                      {tab === 'recommend'
                        ? 'Enter the available soil and climate readings to explore suitable crops.'
                        : 'Get current conditions and a three-day forecast for your town or city.'}
                    </p>
                  </div>

                  <div className="heading-icon">
                    {tab === 'recommend' ? (
                      <FlaskConical size={24} />
                    ) : (
                      <CloudSun size={24} />
                    )}
                  </div>
                </div>

                {tab === 'recommend' ? (
                  <form onSubmit={recommend}>
                    <div className="form-section-title">
                      <span className="step">01</span>
                      <div>
                        <b>Soil nutrient values</b>
                        <small>
                          Enter values from a soil test if available.
                        </small>
                      </div>
                    </div>

                    <div className="fields three">
                      <Field
                        label="Nitrogen (N)"
                        name="N"
                        value={form.N}
                        onChange={change}
                        min="0"
                        max="200"
                        suffix="kg/ha"
                      />
                      <Field
                        label="Phosphorus (P)"
                        name="P"
                        value={form.P}
                        onChange={change}
                        min="0"
                        max="200"
                        suffix="kg/ha"
                      />
                      <Field
                        label="Potassium (K)"
                        name="K"
                        value={form.K}
                        onChange={change}
                        min="0"
                        max="250"
                        suffix="kg/ha"
                      />
                    </div>

                    <div className="form-section-title second">
                      <span className="step">02</span>
                      <div>
                        <b>Climate conditions</b>
                        <small>
                          Use local readings or the values provided by your
                          data source.
                        </small>
                      </div>
                    </div>

                    <div className="fields three">
                      <Field
                        label="Temperature"
                        name="temperature"
                        value={form.temperature}
                        onChange={change}
                        min="-10"
                        max="60"
                        suffix="°C"
                      />
                      <Field
                        label="Humidity"
                        name="humidity"
                        value={form.humidity}
                        onChange={change}
                        min="0"
                        max="100"
                        suffix="%"
                      />
                      <Field
                        label="Soil pH"
                        name="ph"
                        value={form.ph}
                        onChange={change}
                        min="0"
                        max="14"
                        step="0.1"
                        suffix="pH"
                      />
                      <Field
                        label="Rainfall"
                        name="rainfall"
                        value={form.rainfall}
                        onChange={change}
                        min="0"
                        max="5000"
                        suffix="mm"
                      />
                      <Field
                        label="Soil moisture"
                        name="soil_moisture"
                        value={form.soil_moisture}
                        onChange={change}
                        min="0"
                        max="100"
                        suffix="%"
                      />

                      <label className="field">
                        <span>Farm location</span>
                        <div className="input-wrap">
                          <MapPin size={15} />
                          <input
                            name="location"
                            value={form.location}
                            onChange={change}
                            placeholder="e.g. Jaipur"
                          />
                        </div>
                      </label>
                    </div>

                    {error && (
                      <div className="error">
                        <AlertTriangle size={17} />
                        {error}
                      </div>
                    )}

                    <div className="form-actions">
                      <span className="secure-note">
                        <CheckCircle2 size={15} /> All fields can be adjusted
                      </span>

                      <button
                        className="primary-btn"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <LoaderCircle
                              className="spin"
                              size={17}
                            />
                            Analysing…
                          </>
                        ) : (
                          <>
                            <Sprout size={17} /> Recommend crops
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="weather-panel">
                    <form
                      className="weather-search"
                      onSubmit={getWeather}
                    >
                      <label className="field">
                        <span>Town or city</span>
                        <div className="input-wrap">
                          <MapPin size={16} />
                          <input
                            name="location"
                            value={form.location}
                            onChange={change}
                            placeholder="Enter location"
                          />
                        </div>
                      </label>

                      <button
                        className="primary-btn"
                        disabled={weatherLoading}
                      >
                        {weatherLoading ? (
                          <LoaderCircle
                            className="spin"
                            size={17}
                          />
                        ) : (
                          <CloudSun size={17} />
                        )}
                        Get weather
                      </button>
                    </form>

                    {weatherError && (
                      <div className="error">
                        <AlertTriangle size={17} />
                        {weatherError}
                      </div>
                    )}

                    {weather && (
                      <>
                        <div className="weather-current">
                          <div>
                            <small>{weather.location}</small>
                            <h3>
                              {Math.round(
                                weather.current.temperature_2m
                              )}
                              °C
                            </h3>
                            <b>
                              {weatherCode(
                                weather.current.weather_code
                              )}
                            </b>
                          </div>
                          <div className="weather-symbol">
                            <CloudSun size={52} />
                          </div>
                        </div>

                        <div className="weather-stats">
                          <div>
                            <Droplets size={17} />
                            <small>Humidity</small>
                            <b>
                              {fmt(
                                weather.current.relative_humidity_2m
                              )}
                              %
                            </b>
                          </div>
                          <div>
                            <CloudSun size={17} />
                            <small>Precipitation</small>
                            <b>
                              {fmt(weather.current.precipitation)} mm
                            </b>
                          </div>
                          <div>
                            <Wind size={17} />
                            <small>Wind speed</small>
                            <b>
                              {fmt(weather.current.wind_speed_10m)} km/h
                            </b>
                          </div>
                        </div>

                        <h3 className="forecast-title">
                          3-day forecast
                        </h3>

                        <div className="forecast-grid">
                          {weather.daily.time.map((day, i) => (
                            <div className="forecast-card" key={day}>
                              <b>
                                {new Date(
                                  day + 'T12:00:00'
                                ).toLocaleDateString(undefined, {
                                  weekday: 'short',
                                  day: 'numeric',
                                })}
                              </b>
                              <CloudSun size={21} />
                              <strong>
                                {Math.round(
                                  weather.daily.temperature_2m_max[i]
                                )}
                                ° /{' '}
                                {Math.round(
                                  weather.daily.temperature_2m_min[i]
                                )}
                                °
                              </strong>
                              <small>
                                Rain chance:{' '}
                                {weather.daily
                                  .precipitation_probability_max[i] ??
                                  '—'}
                                %
                              </small>
                              <small>
                                Rainfall:{' '}
                                {weather.daily.precipitation_sum[i] ??
                                  '—'}{' '}
                                mm
                              </small>
                            </div>
                          ))}
                        </div>

                        <div className="advisory-box">
                          <b>Farm advisory</b>
                          <p>{weather.advisory}</p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </section>
            </div>
          </>
        )}

        {page === 'results' && result && (
          <section className="results-page">
            <button className="back-link" onClick={openForm}>
              ← Back to Form
            </button>

            <div className="results-page-heading">
              <div>
                <span className="eyebrow">
                  PERSONALIZED CROP PLANNING
                </span>
                <h1>Crop Recommendation Results</h1>
                <p>
                  Based on your soil and environmental conditions, here
                  are the best crop recommendations.
                </p>
              </div>

              <div className="adjust-note">
                <CheckCircle2 size={19} />
                <span>
                  <b>All fields can be adjusted</b>
                  <small>
                    You can go back and modify the input values if needed.
                  </small>
                </span>
              </div>
            </div>

            <section className="results">
              <div className="result-banner">
                <div>
                  <span className="eyebrow">YOUR RECOMMENDATION</span>
                  <h2>{result.recommended_crop}</h2>
                  <p>Top result from the current demo model</p>
                </div>
                <div className="result-plant">
                  <Sprout size={34} />
                </div>
              </div>

              <div className="result-grid">
                <div className="result-card wide">
                  <div className="card-title">
                    <Leaf size={18} /> Top crop matches
                  </div>

                  {result.top_recommendations.map((r, i) => (
                    <div className="match-row" key={r.crop}>
                      <span className="rank">{i + 1}</span>
                      <b>{r.crop}</b>
                      <div className="match-bar">
                        <i
                          style={{
                            width: `${Math.max(2, r.score || 0)}%`,
                          }}
                        />
                      </div>
                      <strong>
                        {r.score == null ? '—' : `${r.score}%`}
                      </strong>
                    </div>
                  ))}

                  <small className="muted">
                    Scores reflect this demo model, not guaranteed
                    probability of crop success.
                  </small>
                </div>

                <div className="result-card">
                  <div className="card-title">
                    <ThermometerSun size={18} /> Crop profile
                  </div>

                  <div className="profile-line">
                    <small>Growing season</small>
                    <b>{result.crop_information.season}</b>
                  </div>
                  <div className="profile-line">
                    <small>Water need</small>
                    <b>{result.crop_information.water}</b>
                  </div>
                  <div className="profile-line">
                    <small>Soil preference</small>
                    <b>{result.crop_information.soil}</b>
                  </div>

                  <p className="small-note">
                    {result.crop_information.guidance}
                  </p>
                </div>

                <div className="result-card wide">
                  <div className="card-title">
                    <FlaskConical size={18} /> Basic nutrient guidance
                  </div>
                  <ul className="guidance-list">
                    {result.fertilizer_guidance.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="result-card wide">
                  <div className="card-title">
                    <Droplets size={18} /> Soil moisture guidance
                  </div>
                  <p>{result.soil_moisture_guidance}</p>
                  <small className="muted">
                    Entered soil moisture is used for this irrigation
                    guidance, not as a trained ML feature in the included
                    demo model.
                  </small>
                </div>
              </div>

              <div className="model-notice">
                <AlertTriangle size={17} />
                <span>{result.model_notice}</span>
              </div>
            </section>

            <div className="results-actions">
              <button className="secondary-btn" onClick={openForm}>
                ← Back to Form
              </button>
              <button
                className="primary-btn"
                onClick={tryAnotherRecommendation}
              >
                <Sprout size={17} /> Try Another Recommendation
              </button>
            </div>
          </section>
        )}
      </main>

      <footer>
        <div className="brand footer-brand">
          <span className="brand-mark">
            <Sprout size={20} />
          </span>
          <span>
            CropWise
            <small>SMART FARMING ADVISORY</small>
          </span>
        </div>

        <p>
          Designed for informed decisions by small and marginal farmers.
        </p>

        <span className="footer-right">
          EDUCATIONAL DECISION SUPPORT · NOT A GUARANTEE OF YIELD
        </span>
      </footer>
    </div>
  )
}

export default App