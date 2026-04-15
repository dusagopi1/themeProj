"""
Flask API for Crop Recommendation System
Loads a pre-trained Random Forest model and provides predictions based on soil and weather parameters
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os
import sys

app = Flask(__name__)

# Enable CORS for all routes
CORS(app, origins="*")

# Path to the model file
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'crop_model.pkl')

# Model cache
model = None
label_encoder = None

def load_model():
    """Load the trained model and label encoder from disk"""
    global model, label_encoder
    
    try:
        if os.path.exists(MODEL_PATH):
            model_data = joblib.load(MODEL_PATH)
            model = model_data.get('model')
            label_encoder = model_data.get('label_encoder')
            print(f"✓ Model loaded successfully from {MODEL_PATH}")
            print(f"✓ Classes: {list(label_encoder.classes_) if label_encoder else 'Unknown'}")
            return True
        else:
            print(f"✗ Model file not found at {MODEL_PATH}")
            print("Run 'python generate_model.py' to generate the model first.")
            return False
    except Exception as e:
        print(f"✗ Error loading model: {e}")
        return False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'model_loaded': model is not None,
        'message': 'Flask API is running'
    }), 200

@app.route('/predict', methods=['POST'])
def predict():
    """
    Main prediction endpoint
    Expected input (JSON):
    {
        "N": nitrogen_value,
        "P": phosphorus_value,
        "K": potassium_value,
        "temperature": temperature_value,
        "humidity": humidity_value,
        "ph": ph_value,
        "rainfall": rainfall_value
    }
    
    Returns:
    {
        "crop": "predicted_crop_name",
        "confidence": confidence_score (0-1),
        "input": input_values
    }
    """
    if model is None or label_encoder is None:
        return jsonify({
            'error': 'Model not loaded. Please ensure crop_model.pkl exists.',
            'solution': 'Run: python generate_model.py'
        }), 500
    
    try:
        # Get JSON data from request
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        # Extract features
        features = {
            'N': data.get('N'),
            'P': data.get('P'),
            'K': data.get('K'),
            'temperature': data.get('temperature'),
            'humidity': data.get('humidity'),
            'ph': data.get('ph'),
            'rainfall': data.get('rainfall')
        }
        
        # Validate all features are present
        for key, value in features.items():
            if value is None:
                return jsonify({
                    'error': f'Missing required field: {key}',
                    'received': features
                }), 400
        
        # Convert to numpy array in the correct order
        # Must match the order used during training
        input_array = np.array([
            features['N'],
            features['P'],
            features['K'],
            features['temperature'],
            features['humidity'],
            features['ph'],
            features['rainfall']
        ]).reshape(1, -1)
        
        # Make prediction
        prediction = model.predict(input_array)[0]
        probabilities = model.predict_proba(input_array)[0]
        confidence = float(np.max(probabilities))
        
        # Decode prediction
        crop_name = label_encoder.inverse_transform([prediction])[0]

        # Build top predictions list sorted by score (descending)
        classes = label_encoder.classes_
        ranked_indices = np.argsort(probabilities)[::-1]
        top_predictions = []
        for idx in ranked_indices[:5]:
            top_predictions.append({
                'crop': str(classes[idx]),
                'score': float(probabilities[idx])
            })

        remaining_predictions = []
        for idx in ranked_indices[1:6]:
            remaining_predictions.append({
                'crop': str(classes[idx]),
                'score': float(probabilities[idx])
            })
        
        return jsonify({
            'crop': crop_name,
            'confidence': confidence,
            'top_predictions': top_predictions,
            'remaining_predictions': remaining_predictions,
            'input': features,
            'success': True
        }), 200
    
    except ValueError as e:
        return jsonify({
            'error': f'Invalid input values: {str(e)}',
            'details': 'Please ensure all fields contain valid numbers'
        }), 400
    
    except Exception as e:
        print(f"Error during prediction: {e}")
        return jsonify({
            'error': f'Prediction failed: {str(e)}',
            'type': type(e).__name__
        }), 500

@app.route('/info', methods=['GET'])
def get_info():
    """Get information about the model and expected input"""
    if model is None or label_encoder is None:
        return jsonify({
            'status': 'error',
            'message': 'Model not loaded'
        }), 500
    
    return jsonify({
        'status': 'ok',
        'model_type': type(model).__name__,
        'n_features': model.n_features_in_ if hasattr(model, 'n_features_in_') else 7,
        'n_estimators': model.n_estimators if hasattr(model, 'n_estimators') else 'Unknown',
        'crops': list(label_encoder.classes_) if label_encoder else [],
        'feature_order': ['N (Nitrogen)', 'P (Phosphorus)', 'K (Potassium)', 
                         'Temperature (°C)', 'Humidity (%)', 'pH', 'Rainfall (mm)'],
        'example_input': {
            'N': 40,
            'P': 30,
            'K': 150,
            'temperature': 25,
            'humidity': 65,
            'ph': 6.5,
            'rainfall': 200
        }
    }), 200

@app.route('/models', methods=['GET'])
def list_models():
    """List available crop recommendation models"""
    return jsonify({
        'models': [
            {
                'name': 'crop_model.pkl',
                'status': 'loaded' if model is not None else 'not_found',
                'description': 'Random Forest crop prediction model'
            }
        ]
    }), 200

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found', 'path': request.path}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error', 'message': str(error)}), 500

if __name__ == '__main__':
    print("=" * 60)
    print("🌾 Crop Recommendation API Starting...")
    print("=" * 60)
    
    # Load model on startup
    if load_model():
        print("\n✓ Starting Flask server on http://localhost:5000")
        print("\nAvailable endpoints:")
        print("  POST /predict - Get crop prediction")
        print("  GET /health - Health check")
        print("  GET /info - Model information")
        print("  GET /models - List available models")
        print("\n" + "=" * 60 + "\n")
        
        # Run the app
        port = int(os.environ.get('PORT', 5000))
        debug_mode = os.environ.get('FLASK_DEBUG', '0') == '1'
        app.run(debug=debug_mode, host='0.0.0.0', port=port, use_reloader=False)
    else:
        print("\n✗ Failed to load model. Please run generate_model.py first.")
        sys.exit(1)