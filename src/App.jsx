import { useState, useEffect, useRef } from 'react'
import './App.css'
import weatherCodes from './assets/weather-codes.json'

async function updateWeatherConditions(location, setWeatherConditions) {
  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m&hourly=uv_index&daily=temperature_2m_max,temperature_2m_min&wind_speed_unit=ms&timezone=auto&past_hours=0&forecast_hours=1`)
    if (!response.ok) {
      throw new Error("Network response error")
    }
    const data = await response.json()
    document.getElementsByTagName("body")[0].className = data.current.is_day ? "" : "night"
    setWeatherConditions(data)
  } catch (error) {
    console.error("Error:", error)
  }
}

async function getSearchResults(searchQuery, setSearchResult) {
  try {
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${searchQuery}&count=100&language=en&format=json`)
    if (!response.ok) {
      throw new Error("Network response error")
    }
    const data = await response.json()
    setSearchResult(data.results)
  } catch (error) {
    console.error("Error:", error)
  }
}

function initSearch(setIsSearching, searchQueryRef, setSearchResult, isSearchQueued, setIsSearchQueued) {
  setIsSearching(true)
  if (isSearchQueued) {
    return
  }
  setIsSearchQueued(true)
  setTimeout(() => {
    getSearchResults(searchQueryRef.current, setSearchResult)
    setIsSearchQueued(false)
  }, 1000);
}

function endSearch(setIsSearching) {
  setIsSearching(false)
  document.getElementById("searchBox").value = localStorage.getItem("locationName") == null ? "" : localStorage.getItem("locationName")
}

function loadNewLocation(location, locationName, setWeatherConditions, setIsSearching) {
  localStorage.setItem("location", JSON.stringify({"latitude": location.latitude, "longitude": location.longitude}))
  localStorage.setItem("locationName", locationName)
  document.getElementById("searchBox").value = locationName
  updateWeatherConditions({"latitude": location.latitude, "longitude": location.longitude}, setWeatherConditions)
  endSearch(setIsSearching)
}

function App() {
  const [weatherConditions, setWeatherConditions] = useState(null)
  const [expandAnim, setExpandAnim] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] = useState([])
  const [isSearchQueued, setIsSearchQueued] = useState(false)
  const searchQueryRef = useRef(searchQuery)
  let location = localStorage.getItem("location") == null ? {"latitude": 0.0000, "longitude": 0.0000} : JSON.parse(localStorage.getItem("location"))

  useEffect(() => {
    updateWeatherConditions(location, setWeatherConditions)
    document.getElementById("searchBox").value = localStorage.getItem("locationName") == null ? "" : localStorage.getItem("locationName")
  }, [])

  useEffect(() => {searchQueryRef.current = searchQuery}, [searchQuery])

  return (
    <div className="base">
      <div className="panel" style={{display: isSearching ? "block" : "none"}} onClick={() => endSearch(setIsSearching)}></div>
      <div className="searchBar">
        <span className="material-symbols-rounded" style={{color: "rgb(255 255 255)"}}>location_pin</span>
        <form onSubmit={(e) => {
          e.preventDefault()
          endSearch(setIsSearching)
        }}>
          <input type="text" className="tab" placeholder="Enter Your City Name" id="searchBox" onClick={() => setIsSearching(true)} onChange={(e) => {
            setSearchQuery(e.target.value)
            initSearch(setIsSearching, searchQueryRef, setSearchResult, isSearchQueued, setIsSearchQueued)
          }} />
          <input type="submit" hidden />
        </form>
        <span className="material-symbols-rounded" style={{color: "transparent"}}>location_pin</span>
        <ul className="searchList" style={{display: isSearching ? "block" : "none"}}>
          {searchResult ? searchResult.map((location) => {
            return (<li key={location.id} onClick={() => loadNewLocation(location, location.name, setWeatherConditions, setIsSearching)}>{location.name + ", " + ("admin1" in location ? location.admin1 + ", " : "") + ("admin2" in location ? location.admin2 + ", " : "") + ("admin3" in location ? location.admin3 + ", " : "") + ("admin4" in location ? location.admin4 + ", " : "") + location.country}</li>)
          }) : <li>Type something to search...</li>}
        </ul>
      </div>
      <div className="weatherSection">
        <div className="weatherSectionUpper">
          <div className="textSection">
            <h1>{weatherConditions ? (Math.round(weatherConditions.current.temperature_2m) + "°") : null}</h1>
            <h3>{weatherConditions ? weatherCodes.text[weatherConditions.current.weather_code] : null}</h3>
            <h4>{weatherConditions ? (Math.round(weatherConditions.daily.temperature_2m_min[0]) + "° / " + Math.round(weatherConditions.daily.temperature_2m_max[0]) + "° Feels like " + Math.round(weatherConditions.current.apparent_temperature) + "°") : null}</h4>
          </div>
          <img src={weatherConditions ? weatherCodes.day[weatherConditions.current.weather_code] : null} className="weatherIcon" />
        </div>
        <div className="weatherSectionLower">
          <div className={"expandable" + expandAnim + (isExpanded? " expanded" : "")} onAnimationEnd={() => {
            setExpandAnim("")
            setIsExpanded(!isExpanded)
          }}>
            <div className="extraInfo">
              <p className="infoTitle"><span className="material-symbols-rounded" style={{color: "rgb(118 200 255)"}}>humidity_high</span>Humidity</p>
              <h3 className="infoContent">{weatherConditions ? weatherConditions.current.relative_humidity_2m : null}%</h3>
            </div>
            <div className="extraInfo">
              <p className="infoTitle"><span className="material-symbols-rounded" style={{color: "rgb(219 250 255)"}}>air</span>Wind</p>
              <h3 className="infoContent">{weatherConditions ? weatherConditions.current.wind_speed_10m.toPrecision(2) + "m/s" : null} <span className="material-symbols-rounded direction" style={{transform: "rotate(" + (180 + (weatherConditions? weatherConditions.current.wind_direction_10m : 0)) + "deg)"}}>north</span></h3>
            </div>
            <div className="extraInfo">
              <p className="infoTitle"><span className="material-symbols-rounded" style={{color: "rgb(255 232 147)"}}>sunny</span>UV Index</p>
              <h3 className="infoContent">{weatherConditions? weatherConditions.hourly.uv_index[0]: null}</h3>
            </div>
          </div>
          <p className="expandText" onClick={() => {
            setExpandAnim((isExpanded ? " collapse" : " expand"))
          }}>See more</p>
        </div>
      </div>
      <p className="attribution">Icons from <a href="https://tomorrow.io">Tomorrow.io</a></p>
    </div>
  )
}

export default App
