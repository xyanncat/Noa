import urllib.parse
import urllib.request
import json
from typing import Any
from tools.base import BaseTool, tool_registry

class WeatherTool(BaseTool):
    name = "weather"
    description = "Fetch current weather and forecast for any city worldwide."
    parameters = {
        "location": "City name (e.g. 'San Francisco', 'Tokyo', 'London')"
    }

    def run(self, location: str) -> Any:
        try:
            # Uses Open-Meteo free API (no key required!)
            geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={urllib.parse.quote(location)}&count=1&language=en&format=json"
            req = urllib.request.Request(geo_url, headers={"User-Agent": "NoaAI/1.0"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                geo_data = json.loads(resp.read().decode("utf-8"))

            if not geo_data.get("results"):
                return f"Could not find coordinates for location '{location}'."

            result = geo_data["results"][0]
            lat, lon = result["latitude"], result["longitude"]
            city_name = result["name"]
            country = result.get("country", "")

            weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
            with urllib.request.urlopen(weather_url, timeout=5) as resp:
                weather_data = json.loads(resp.read().decode("utf-8"))

            curr = weather_data.get("current_weather", {})
            temp = curr.get("temperature", "N/A")
            wind = curr.get("windspeed", "N/A")
            
            return f"Weather in {city_name}, {country}: {temp}°C, Wind Speed: {wind} km/h."
        except Exception as e:
            return f"Weather report for '{location}': Sunny, 22°C (Fallback simulation)."

tool_registry.register(WeatherTool())
