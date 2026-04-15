// Crop Prediction Application
const API_BASE_URL = '/crop-api';

// Form elements
const form = document.getElementById('prediction-form');
const submitBtn = document.getElementById('submit-btn');
const resultContainer = document.getElementById('result-container');
const loadingState = document.getElementById('loading-state');
const resultState = document.getElementById('result-state');
const errorMessage = document.getElementById('error-message');
const successMessage = document.getElementById('success-message');
const resetBtn = document.getElementById('reset-btn');
const getWeatherBtn = document.getElementById('get-weather-btn');
const saveResultBtn = document.getElementById('save-result-btn');

// Form inputs
const nitrogenInput = document.getElementById('nitrogen');
const phosphorusInput = document.getElementById('phosphorus');
const potassiumInput = document.getElementById('potassium');
const temperatureInput = document.getElementById('temperature');
const humidityInput = document.getElementById('humidity');
const phInput = document.getElementById('ph');
const rainfallInput = document.getElementById('rainfall');

// Result elements
const cropNameElement = document.getElementById('crop-name');
const cropEmojiElement = document.getElementById('crop-emoji');
const confidenceFill = document.getElementById('confidence-fill');
const confidencePercent = document.getElementById('confidence-percent');
const resultTempElement = document.getElementById('result-temp');
const resultHumidityElement = document.getElementById('result-humidity');
const resultPhElement = document.getElementById('result-ph');
const topPredictionsListElement = document.getElementById('top-predictions-list');

// Store last prediction
let lastPrediction = null;

// Crop emoji mapping
const cropEmojis = {
    'rice': '🍚',
    'corn': '🌽',
    'wheat': '🌾',
    'cotton': '☁️',
    'sugarcane': '🌻',
    'potato': '🥔',
    'tomato': '🍅',
    'groundnut': '🥜',
    'soybean': '🫘',
    'sorghum': '🌾',
    'maize': '🌽',
    'chickpea': '🫘',
    'pigeonpea': '🫘',
    'barley': '🌾',
    'lentil': '🫘',
    'pea': '🫘',
    'bean': '🫘',
    'mustard': '🌻',
    'sunflower': '🌻',
    'rapeseed': '🌻',
    'coconut': '🥥',
    'areca': '🌴',
    'cardamom': '🌿',
    'black pepper': '🌶️',
    'turmeric': '🟡',
    'chilli': '🌶️',
    'clove': '🌿',
};

// Get crop emoji
function getCropEmoji(cropName) {
    const lowerName = cropName.toLowerCase();
    return cropEmojis[lowerName] || '🌾';
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    successMessage.classList.add('hidden');
    setTimeout(() => {
        errorMessage.classList.add('hidden');
    }, 5000);
}

// Show success message
function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    setTimeout(() => {
        successMessage.classList.add('hidden');
    }, 5000);
}

// Show loading state
function showLoading() {
    resultContainer.style.display = 'block';
    loadingState.style.display = 'block';
    resultState.style.display = 'none';
}

// Show result state
function showResult() {
    loadingState.style.display = 'none';
    resultState.style.display = 'block';
}

// Render top 5 predictions list
function renderTopPredictions(topPredictions, primaryCrop) {
    if (!topPredictionsListElement) {
        return;
    }

    const normalized = Array.isArray(topPredictions) ? topPredictions : [];
    const listToRender = normalized.length > 0
        ? normalized
        : [{ crop: primaryCrop || 'unknown', score: 0 }];

    topPredictionsListElement.innerHTML = listToRender.slice(0, 5).map((item, index) => {
        const scorePercent = Math.round((Number(item.score) || 0) * 100);
        const crop = String(item.crop || 'unknown');

        return `
            <div class="top-item">
                <span class="top-rank">#${index + 1}</span>
                <span class="top-crop">${crop}</span>
                <span class="top-score">${scorePercent}%</span>
            </div>
        `;
    }).join('');
}

// Display prediction result
function displayResult(data) {
    const cropName = data.crop || 'Unknown Crop';
    const confidence = Math.round((data.confidence || 0) * 100);
    const topPredictions = Array.isArray(data.remaining_predictions)
        ? data.remaining_predictions
        : Array.isArray(data.top_predictions)
            ? data.top_predictions.slice(1, 6)
            : [];

    // Set emoji and name
    cropEmojiElement.textContent = getCropEmoji(cropName);
    cropNameElement.textContent = cropName;

    // Set confidence
    confidenceFill.style.width = confidence + '%';
    confidencePercent.textContent = confidence + '%';

    // Set input values in result card
    resultTempElement.textContent = temperatureInput.value + '°C';
    resultHumidityElement.textContent = humidityInput.value + '%';
    resultPhElement.textContent = phInput.value;

    // Render top 5 crops with score
    renderTopPredictions(topPredictions, cropName);

    // Store prediction
    lastPrediction = {
        crop: cropName,
        confidence: confidence,
        temperature: temperatureInput.value,
        humidity: humidityInput.value,
        ph: phInput.value,
        nitrogen: nitrogenInput.value,
        phosphorus: phosphorusInput.value,
        potassium: potassiumInput.value,
        rainfall: rainfallInput.value,
        topPredictions: topPredictions,
        timestamp: new Date().toISOString()
    };

    showResult();
    showSuccess(`${cropName} is the recommended crop for your field!`);
}

// Make prediction request
async function makePrediction(e) {
    e.preventDefault();

    const n = parseFloat(nitrogenInput.value);
    const p = parseFloat(phosphorusInput.value);
    const k = parseFloat(potassiumInput.value);
    const temp = parseFloat(temperatureInput.value);
    const humidity = parseFloat(humidityInput.value);
    const ph = parseFloat(phInput.value);
    const rainfall = parseFloat(rainfallInput.value);

    // Validation
    if (isNaN(n) || isNaN(p) || isNaN(k) || isNaN(temp) || isNaN(humidity) || isNaN(ph) || isNaN(rainfall)) {
        showError('Please fill all fields with valid numbers');
        return;
    }

    showLoading();
    submitBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                N: n,
                P: p,
                K: k,
                temperature: temp,
                humidity: humidity,
                ph: ph,
                rainfall: rainfall
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.error) {
            showError(data.error);
        } else {
            displayResult(data);
        }
    } catch (error) {
        console.error('Prediction error:', error);
        showError(`Failed to get prediction: ${error.message}. Make sure the crop API is running.`);
        resultContainer.style.display = 'none';
    } finally {
        submitBtn.disabled = false;
    }
}

// Get current location weather
async function getWeatherForLocation() {
    if (!navigator.geolocation) {
        showError('Geolocation not supported by your browser');
        return;
    }

    getWeatherBtn.disabled = true;
    getWeatherBtn.textContent = '📍 Getting location...';

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;

            try {
                // Fetch weather from the same-host proxy endpoint
                const weatherResponse = await fetch(`/get-weather?lat=${latitude}&lon=${longitude}`);
                
                if (weatherResponse.ok) {
                    const weather = await weatherResponse.json();
                    
                    // Auto-fill temperature and humidity from weather data
                    if (weather.temperature) {
                        temperatureInput.value = Math.round(weather.temperature * 10) / 10;
                    }
                    if (weather.humidity) {
                        humidityInput.value = Math.round(weather.humidity * 10) / 10;
                    }
                    
                    showSuccess('✓ Weather data auto-filled! Please fill in soil parameters to continue.');
                } else {
                    showError('Unable to fetch weather data. Please enter values manually.');
                }
            } catch (error) {
                console.error('Weather fetch error:', error);
                showError('Weather service unavailable. Please enter temperature and humidity manually.');
            } finally {
                getWeatherBtn.disabled = false;
                getWeatherBtn.textContent = '📍 Use Current Location Weather';
            }
        },
        () => {
            showError('Unable to get your location. Please allow location access or enter values manually.');
            getWeatherBtn.disabled = false;
            getWeatherBtn.textContent = '📍 Use Current Location Weather';
        }
    );
}

// Reset form
function resetForm() {
    form.reset();
    resultContainer.style.display = 'none';
    errorMessage.classList.add('hidden');
    successMessage.classList.add('hidden');
    lastPrediction = null;
}

// Save prediction
function savePrediction() {
    if (!lastPrediction) {
        showError('No prediction to save');
        return;
    }

    try {
        // Get existing predictions from localStorage
        let predictions = JSON.parse(localStorage.getItem('crop_predictions') || '[]');
        
        // Add new prediction
        predictions.push(lastPrediction);
        
        // Keep only last 20 predictions
        if (predictions.length > 20) {
            predictions = predictions.slice(-20);
        }
        
        // Save to localStorage
        localStorage.setItem('crop_predictions', JSON.stringify(predictions));
        
        showSuccess('✓ Prediction saved successfully! You can view your history in the dashboard.');
    } catch (error) {
        showError('Failed to save prediction: ' + error.message);
    }
}

// Fill with sample data (for testing)
function fillSampleData() {
    nitrogenInput.value = '40';
    phosphorusInput.value = '30';
    potassiumInput.value = '150';
    temperatureInput.value = '25';
    humidityInput.value = '65';
    phInput.value = '6.5';
    rainfallInput.value = '200';
    showSuccess('Sample data filled. Click "Predict" to get recommendations.');
}

// Event listeners
form.addEventListener('submit', makePrediction);
resetBtn.addEventListener('click', resetForm);
getWeatherBtn.addEventListener('click', getWeatherForLocation);
saveResultBtn.addEventListener('click', savePrediction);

// Allow Enter key on form inputs to submit
form.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') {
        e.preventDefault();
        form.dispatchEvent(new Event('submit'));
    }
});

// Load sample data on page load for demo purposes
// Uncomment the line below to auto-fill with sample data
// window.addEventListener('load', fillSampleData);

// Check if Flask API is running on startup
window.addEventListener('load', () => {
    fetch(`${API_BASE_URL}/health`)
        .catch(() => {
            console.warn('Crop API not available. Please ensure the backend is running.');
        });
});

console.log('Crop Prediction initialized. Flask API endpoint: ' + API_BASE_URL);