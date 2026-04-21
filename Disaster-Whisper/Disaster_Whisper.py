import tkinter as tk
import customtkinter as ctk
import datetime
import threading
from plyer import notification
import requests
import webbrowser

# ---------- CONFIG ----------
DEFAULT_CITY = "Indore"
DEFAULT_COUNTRY = "IN"
MIN_REFRESH_INTERVAL = 600  # seconds
API_KEY = "Enter your api here"  # <-- Add your OpenWeatherMap API key here

# ---------- Caching ----------
last_data = {}  # {"cityname": {"temp":..., "humidity":..., "aqi":..., "timestamp":..., ...}}

# ---------- FUNCTIONS ----------

def fetch_weather_api(city):
    """Fetch weather from OpenWeatherMap API for any city worldwide"""
    try:
        if ',' not in city:
            city += f",{DEFAULT_COUNTRY}"

        url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}&units=metric"
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()

        temp = data['main'].get('temp', 25)
        humidity = data['main'].get('humidity', 50)
        wind_speed = data['wind'].get('speed', 5)
        rainfall = data.get('rain', {}).get('1h', 0)
        lat = data['coord']['lat']
        lon = data['coord']['lon']

        return temp, humidity, wind_speed, rainfall, lat, lon
    except Exception as e:
        print(f"Failed to fetch weather for {city}: {e}")
        return 25, 50, 5, 0, None, None

def fetch_aqi_api(lat, lon):
    """Fetch real AQI from OpenWeatherMap using PM2.5 (0-500 scale)"""
    try:
        if lat is None or lon is None:
            return 50
        url_aqi = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={API_KEY}"
        response = requests.get(url_aqi)
        data = response.json()
        pm25 = data['list'][0]['components']['pm2_5']  # PM2.5 in µg/m³

        # Convert PM2.5 to AQI using US EPA breakpoints
        if pm25 <= 12.0:
            aqi = round(pm25 * (50/12))
        elif pm25 <= 35.4:
            aqi = round((pm25-12.1)*(100-51)/(35.4-12.1)+51)
        elif pm25 <= 55.4:
            aqi = round((pm25-35.5)*(150-101)/(55.4-35.5)+101)
        elif pm25 <= 150.4:
            aqi = round((pm25-55.5)*(200-151)/(150.4-55.5)+151)
        elif pm25 <= 250.4:
            aqi = round((pm25-150.5)*(300-201)/(250.4-150.5)+201)
        elif pm25 <= 350.4:
            aqi = round((pm25-250.5)*(400-301)/(350.4-250.5)+301)
        elif pm25 <= 500.4:
            aqi = round((pm25-350.5)*(500-401)/(500.4-350.5)+401)
        else:
            aqi = 500

        return aqi
    except Exception as e:
        print(f"Failed to fetch AQI: {e}")
        return 50

def calculate_risk(temp, humidity, wind_speed, rainfall, aqi):
    """Normalize parameters and calculate risk (0-100)"""
    max_humidity = 100
    max_rainfall = 50
    max_wind = 30
    max_aqi = 500

    h = humidity / max_humidity
    r = rainfall / max_rainfall
    w = wind_speed / max_wind
    a = aqi / max_aqi

    risk = (h*0.25 + r*0.25 + w*0.25 + a*0.25) * 100
    return round(risk, 2)

def get_alert_message(risk):
    if risk >= 70:
        return "DANGER! Take precautions immediately!"
    elif risk >= 40:
        return "Caution! Conditions could be risky."
    else:
        return "Safe. Stay aware."

def send_push_notification(title, message):
    notification.notify(title=title, message=message, timeout=5)

# ---------- Emergency Functions ----------

def call_nearest_help():
    webbrowser.open("https://www.google.com/search?q=nearest+hospital+or+police+station")

def navigate_safe_location():
    webbrowser.open("https://www.google.com/maps/search/safe+location+near+me")

def first_aid_guide():
    webbrowser.open("https://www.redcross.org/get-help/first-aid")

# ---------- GUI ----------
class DisasterWhisperApp(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("Disaster Whisper")
        self.geometry("600x850")
        ctk.set_appearance_mode("Dark")
        ctk.set_default_color_theme("dark-blue")

        # Title Frame
        self.title_frame = ctk.CTkFrame(self, corner_radius=15)
        self.title_frame.pack(pady=20, padx=20, fill="x")
        self.title_label = ctk.CTkLabel(
            self.title_frame, text="Disaster Whisper", font=ctk.CTkFont(size=32, weight="bold")
        )
        self.title_label.pack(pady=10)

        # City Input Frame
        self.city_frame = ctk.CTkFrame(self, corner_radius=10)
        self.city_frame.pack(pady=10, padx=20, fill="x")
        self.city_label = ctk.CTkLabel(
            self.city_frame, text="Enter your city (optional):", font=ctk.CTkFont(size=14)
        )
        self.city_label.pack(pady=5)
        self.city_entry = ctk.CTkEntry(self.city_frame, width=300, placeholder_text="e.g., Indore,IN")
        self.city_entry.pack(pady=5)

        # Risk Meter Frame
        self.risk_frame = ctk.CTkFrame(self, corner_radius=15)
        self.risk_frame.pack(pady=15, padx=20, fill="x")
        self.risk_label = ctk.CTkLabel(
            self.risk_frame, text="Risk Level: --", font=ctk.CTkFont(size=26, weight="bold")
        )
        self.risk_label.pack(pady=10)
        self.risk_meter = ctk.CTkProgressBar(self.risk_frame, width=500, height=30)
        self.risk_meter.set(0)
        self.risk_meter.pack(pady=10)

        # Details Textbox
        self.details_text = ctk.CTkTextbox(self, width=550, height=220, corner_radius=15)
        self.details_text.pack(pady=15)
        self.details_text.insert("0.0", "Click 'Update Risk' to fetch data and calculate risk.")
        self.details_text.configure(state="disabled")

        # Update Button
        self.update_btn = ctk.CTkButton(
            self,
            text="Update Risk",
            font=ctk.CTkFont(size=16, weight="bold"),
            command=self.update_risk_threaded
        )
        self.update_btn.pack(pady=15)

        # Emergency Buttons Frame
        self.emergency_frame = ctk.CTkFrame(self, corner_radius=15)
        self.emergency_frame.pack(pady=15, padx=20, fill="x")
        self.call_btn = ctk.CTkButton(
            self.emergency_frame, text="🚨 Call Help", command=call_nearest_help, hover_color="#FF4B4B"
        )
        self.call_btn.grid(row=0, column=0, padx=10, pady=10)
        self.evacuate_btn = ctk.CTkButton(
            self.emergency_frame, text="🏃 Navigate Safe Location", command=navigate_safe_location, hover_color="#FFA500"
        )
        self.evacuate_btn.grid(row=0, column=1, padx=10, pady=10)
        self.firstaid_btn = ctk.CTkButton(
            self.emergency_frame, text="🩹 First Aid Guide", command=first_aid_guide, hover_color="#00C851"
        )
        self.firstaid_btn.grid(row=0, column=2, padx=10, pady=10)

        # Exit Button
        self.exit_btn = ctk.CTkButton(
            self, text="Exit", font=ctk.CTkFont(size=14, weight="bold"), command=self.destroy
        )
        self.exit_btn.pack(pady=10)

    def update_risk_threaded(self):
        city_input = self.city_entry.get().strip()
        location = city_input if city_input else DEFAULT_CITY
        city_key = location.lower()

        current_time = datetime.datetime.now().timestamp()
        if city_key in last_data and (current_time - last_data[city_key]['timestamp'] < MIN_REFRESH_INTERVAL):
            data = last_data[city_key]
            temp = data['temp']
            humidity = data['humidity']
            wind_speed = data['wind']
            rainfall = data['rainfall']
            aqi = data['aqi']
            risk = calculate_risk(temp, humidity, wind_speed, rainfall, aqi)
            self.update_meter(location, temp, humidity, wind_speed, rainfall, aqi, risk)
            return

        self.details_text.configure(state="normal")
        self.details_text.delete("0.0", tk.END)
        self.details_text.insert(tk.END, f"Fetching live data for {location}...\n")
        self.details_text.configure(state="disabled")

        def fetch_and_update():
            temp, humidity, wind_speed, rainfall, lat, lon = fetch_weather_api(location)
            aqi = fetch_aqi_api(lat, lon)
            risk = calculate_risk(temp, humidity, wind_speed, rainfall, aqi)

            last_data[city_key] = {
                "temp": temp,
                "humidity": humidity,
                "wind": wind_speed,
                "rainfall": rainfall,
                "aqi": aqi,
                "timestamp": datetime.datetime.now().timestamp()
            }

            self.after(0, lambda: self.update_meter(location, temp, humidity, wind_speed, rainfall, aqi, risk))

        threading.Thread(target=fetch_and_update, daemon=True).start()

    def update_meter(self, location, temp, humidity, wind_speed, rainfall, aqi, risk):
        # Update progress bar
        self.risk_meter.set(risk / 100)
        if risk >= 70:
            self.risk_meter.configure(progress_color="#FF0000")
        elif risk >= 40:
            self.risk_meter.configure(progress_color="#FFFF00")
        else:
            self.risk_meter.configure(progress_color="#00FF00")
        self.risk_label.configure(text=f"Risk Level: {risk}%")

        # Format result
        result = (
            f"Location: {location}\n"
            f"Temperature: {temp} °C\n"
            f"Humidity: {humidity}%\n"
            f"Wind Speed: {wind_speed} m/s\n"
            f"Rainfall: {rainfall} mm\n"
            f"Air Quality Index: {aqi}\n"
            f"Risk Assessment: {get_alert_message(risk)}\n"
            f"Updated At: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        )

        # Update GUI textbox
        self.details_text.configure(state="normal")
        self.details_text.delete("0.0", tk.END)
        self.details_text.insert(tk.END, result)
        self.details_text.configure(state="disabled")

        # Print to console
        print(result)

        # Push notification if needed
        if risk >= 40:
            send_push_notification("Disaster Whisper Alert", get_alert_message(risk))

# ---------- RUN APP ----------
if __name__ == "__main__":
    app = DisasterWhisperApp()
    app.mainloop()
