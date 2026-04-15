# 🌾 Crop Recommendation System

A full-stack AI-powered application that provides crop recommendations based on soil and weather parameters.

## 📋 System Architecture

```
KisanConnect/
├── backend/                    # Python Flask API
│   ├── app.py                 # Flask API server
│   ├── generate_model.py      # Model training script
│   ├── crop_model.pkl         # Trained Random Forest model
│   └── requirements.txt       # Python dependencies
│
├── public/
│   ├── crop-prediction.html   # Frontend UI
│   └── js/
│       └── crop-prediction.js # Frontend logic
│
└── server.js                  # Express.js backend (proxy)
```

## 🚀 Quick Start

### 1. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

If you encounter issues with `scikit-learn`, you may need to install build tools:
- **Windows:** Install [Visual C++ Build Tools](https://visualstudio.microsoft.com/downloads/)
- **macOS:** Install Xcode Command Line Tools: `xcode-select --install`
- **Linux:** Install build essential: `sudo apt-get install build-essential python3-dev`

### 2. Generate the ML Model

Before running the API, you need to train and save the model:

```bash
python generate_model.py
```

This script will:
- Generate synthetic training data based on crop profiles
- Train a Random Forest classifier with 200 estimators
- Display model evaluation metrics
- Save the trained model to `crop_model.pkl` (~5-10 MB)

**Output:**
```
✓ Model generation completed successfully!
  - Training samples: 6000 (20 crops × 300 samples)
  - Model accuracy: ~85-95%
  - Saved to: crop_model.pkl
```

### 3. Start the Flask API Server

```bash
python app.py
```

**Expected output:**
```
✓ Model loaded successfully from crop_model.pkl
✓ Starting Flask server on http://localhost:5000

Available endpoints:
  POST /predict - Get crop prediction
  GET /health - Health check
  GET /info - Model information
  GET /models - List available models
```

### 4. Start the Express.js Server (Main App)

In a separate terminal:

```bash
cd .. # Go back to main kisanConnect directory
npm start
```

The application will be available at:
- **Main dashboard:** http://localhost:3000/farmer-dashboard.html
- **Crop prediction:** http://localhost:3000/crop-prediction.html

## 📊 How It Works

### Frontend (crop-prediction.html + crop-prediction.js)

1. **Input Form:** User enters 7 soil/weather parameters:
   - **Soil Nutrients (NPK):** Nitrogen, Phosphorus, Potassium
   - **Climate:** Temperature, Humidity, pH, Rainfall

2. **Auto-Fill Weather:** Optional button to fetch current location weather

3. **Prediction:** Sends data to Flask API via POST /predict

4. **Results:** Displays recommended crop with confidence score

5. **History:** Saves predictions to browser localStorage

### Backend (Flask API)

**Endpoint:** `POST http://localhost:5000/predict`

**Request:**
```json
{
  "N": 40,
  "P": 30,
  "K": 150,
  "temperature": 25,
  "humidity": 65,
  "ph": 6.5,
  "rainfall": 200
}
```

**Response:**
```json
{
  "crop": "Rice",
  "confidence": 0.95,
  "input": {
    "N": 40,
    "P": 30,
    "K": 150,
    "temperature": 25,
    "humidity": 65,
    "ph": 6.5,
    "rainfall": 200
  },
  "success": true
}
```

### ML Model

- **Algorithm:** Random Forest Classifier
- **Estimators:** 200 trees
- **Features:** 7 (N, P, K, temperature, humidity, pH, rainfall)
- **Classes:** 20 crops
- **Training Data:** 6000 synthetic samples (300 per crop)
- **Average Accuracy:** ~90%

## 🌾 Supported Crops

1. Rice
2. Corn
3. Wheat
4. Cotton
5. Sugarcane
6. Potato
7. Tomato
8. Groundnut
9. Soybean
10. Sorghum
11. Chickpea
12. Pigeonpea
13. Lentil
14. Barley
15. Mustard
16. Sunflower
17. Coconut
18. Turmeric
19. Chilli
20. Tobacco

## 🔌 API Endpoints

### 1. Health Check
```
GET /health
Response: { "status": "ok", "model_loaded": true }
```

### 2. Predict Crop
```
POST /predict
Body: { "N": 40, "P": 30, "K": 150, ... }
Response: { "crop": "Rice", "confidence": 0.95 }
```

### 3. Model Info
```
GET /info
Response: { "crops": [...], "feature_order": [...] }
```

### 4. List Models
```
GET /models
Response: { "models": [...] }
```

## 🛠️ Troubleshooting

### Model File Not Found
```
Error: Model file not found at crop_model.pkl
Solution: Run `python generate_model.py` first
```

### Flask API Not Responding
```
Error: Failed to get prediction. Make sure Flask is running on port 5000
Solution: 
  1. Check if Flask is running: netstat -an | findstr :5000 (Windows)
  2. Start Flask: python app.py
  3. Ensure port 5000 is not blocked by firewall
```

### Port Already in Use
```
Error: Address already in use
Solution: Kill existing process on port 5000
  Windows: netstat -ano | findstr :5000, then taskkill /PID <PID> /F
  macOS/Linux: lsof -i :5000, then kill -9 <PID>
```

### CORS Errors
```
Error: Cross-Origin Request Blocked
Solution: Flask-CORS is enabled in app.py. If issues persist:
  1. Ensure Flask is running
  2. Check browser console for exact error
  3. Verify API URL in crop-prediction.js
```

### scikit-learn Installation Issues
```
Error: ImportError: No module named sklearn
Solution: Install build tools first, then pip install -r requirements.txt
```

## 📈 Model Training Details

### Data Generation

The `generate_model.py` script creates synthetic data using real crop profiles:

```python
CROP_PROFILES = {
    'Rice': {
        'N': (40, 120),          # Nitrogen range
        'P': (20, 60),           # Phosphorus range
        'K': (40, 160),          # Potassium range
        'temp': (20, 30),        # Temperature range
        'humidity': (50, 90),    # Humidity range
        'ph': (5.5, 7.5),        # pH range
        'rainfall': (100, 300)   # Rainfall range
    },
    ...
}
```

### Training Process

1. **Generate 300 samples per crop** (20 crops = 6000 total)
2. **Encode crop labels** using LabelEncoder
3. **Train RandomForestClassifier** with:
   - 200 estimators
   - Max depth: 20
   - Min samples split: 10
   - Min samples leaf: 5
4. **Evaluate** per-crop accuracy
5. **Save** model and encoder using joblib

### Feature Importance (Typical)

```
Temperature   - 25-30%
Humidity      - 20-25%
Rainfall      - 15-20%
Potassium     - 10-15%
Phosphorus    - 8-12%
Nitrogen      - 5-8%
pH            - 2-5%
```

## 🎨 UI/UX Features

- **Dark Glassmorphism Theme:** Modern design with backdrop blur
- **Real-time Form Validation:** Instant feedback on input
- **Auto-fill Weather:** Get temperature and humidity from location
- **Loading Animations:** Smooth spinners during API calls
- **Result Cards:** Beautiful display of predictions with confidence bars
- **Responsive Design:** Works on desktop, tablet, and mobile
- **Prediction History:** Save and track past predictions
- **Error Handling:** User-friendly error messages

## 📝 Example Usage

### Sample Input (Ideal for Rice)
```json
{
  "N": 70,
  "P": 40,
  "K": 100,
  "temperature": 25,
  "humidity": 70,
  "ph": 6.5,
  "rainfall": 200
}
```

**Expected Output:**
```json
{
  "crop": "Rice",
  "confidence": 0.92,
  ...
}
```

## 🔐 Security Notes

1. **CORS:** Enabled for development. Restrict in production to specific origins.
2. **Input Validation:** All numerical inputs are validated before processing.
3. **Error Messages:** Generic errors to prevent information leakage.
4. **Model Protection:** crop_model.pkl should be kept secure.

## 📦 Updating the Model

To retrain with new data:

1. **Edit CROP_PROFILES** in `generate_model.py`
2. **Run:** `python generate_model.py`
3. **Restart Flask:** `python app.py`

## 📚 References

- [scikit-learn RandomForest](https://scikit-learn.org/stable/modules/ensemble.html#forest)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Flask-CORS](https://flask-cors.readthedocs.io/)

## 🤝 Integration with KisanConnect

The crop prediction system is integrated with the KisanConnect farmer dashboard:

1. **Navigation Link:** Crops → Crop Prediction
2. **Data Integration:** Can fetch weather from farmer's location
3. **History:** Predictions saved locally in browser
4. **UI Consistency:** Matches KisanConnect design language

## 📞 Support

If you encounter issues:

1. Check the browser console for errors (F12)
2. Check Flask API logs
3. Verify both servers are running (port 3000 and 5000)
4. Review the troubleshooting section above

---

**Version:** 1.0  
**Last Updated:** April 2026  
**Status:** Production Ready ✓