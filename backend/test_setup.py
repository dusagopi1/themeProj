#!/usr/bin/env python
"""
Test script to verify crop recommendation system is set up correctly
"""

import os
import sys
import json
import requests
import time

def test_model_file():
    """Test if model file exists"""
    print("\n📁 Testing Model File...")
    model_path = os.path.join(os.path.dirname(__file__), 'crop_model.pkl')
    
    if os.path.exists(model_path):
        size_mb = os.path.getsize(model_path) / (1024 * 1024)
        print(f"  ✓ Model file found ({size_mb:.1f} MB)")
        return True
    else:
        print(f"  ✗ Model file not found at {model_path}")
        print("    Run: python generate_model.py")
        return False

def test_api_health():
    """Test if Flask API is running"""
    print("\n🏥 Testing API Health...")
    
    try:
        response = requests.get('http://localhost:5000/health', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"  ✓ API is running (status: {data['status']})")
            print(f"  ✓ Model loaded: {data['model_loaded']}")
            return True
        else:
            print(f"  ✗ API returned status code {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("  ✗ Cannot connect to API on localhost:5000")
        print("    Make sure Flask is running: python app.py")
        return False
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False

def test_prediction():
    """Test prediction endpoint"""
    print("\n🧪 Testing Prediction Endpoint...")
    
    test_data = {
        'N': 40,
        'P': 30,
        'K': 150,
        'temperature': 25,
        'humidity': 65,
        'ph': 6.5,
        'rainfall': 200
    }
    
    try:
        print(f"  Sending test data: {test_data}")
        response = requests.post(
            'http://localhost:5000/predict',
            json=test_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"  ✓ Prediction successful!")
            print(f"    Predicted crop: {data['crop']}")
            print(f"    Confidence: {data['confidence']:.2%}")
            return True
        else:
            print(f"  ✗ Prediction failed with status {response.status_code}")
            print(f"    Response: {response.text}")
            return False
    except requests.exceptions.ConnectionError:
        print("  ✗ Cannot connect to API")
        return False
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False

def test_api_info():
    """Get API info"""
    print("\n📊 Testing API Info Endpoint...")
    
    try:
        response = requests.get('http://localhost:5000/info', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"  ✓ Model info retrieved:")
            print(f"    Model type: {data['model_type']}")
            print(f"    Estimators: {data['n_estimators']}")
            print(f"    Number of crops: {len(data['crops'])}")
            print(f"    Crops: {', '.join(data['crops'][:5])}... (+{len(data['crops'])-5} more)")
            return True
        else:
            print(f"  ✗ Failed to get info")
            return False
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False

def main():
    """Main test function"""
    print("=" * 70)
    print("🌾 Crop Recommendation System - Setup Verification")
    print("=" * 70)
    
    results = {
        'Model File': test_model_file(),
        'API Health': test_api_health(),
        'API Info': test_api_info(),
        'Prediction': test_prediction()
    }
    
    print("\n" + "=" * 70)
    print("📋 Test Summary")
    print("=" * 70)
    
    for test_name, passed in results.items():
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"  {status:8} - {test_name}")
    
    all_passed = all(results.values())
    
    print("=" * 70)
    if all_passed:
        print("✓ All tests passed! System is ready to use.")
        print("\nNext steps:")
        print("  1. Open http://localhost:3000/crop-prediction.html in your browser")
        print("  2. Fill in soil parameters")
        print("  3. Click 'Predict Recommended Crop'")
    else:
        print("✗ Some tests failed. Please check the errors above.")
        print("\nCommon issues:")
        print("  1. Model file missing: Run 'python generate_model.py'")
        print("  2. API not running: Run 'python app.py' in another terminal")
        print("  3. Wrong port: Make sure Flask is on port 5000")
        print("  4. Dependencies missing: Run 'pip install -r requirements.txt'")
    print("=" * 70 + "\n")
    
    return 0 if all_passed else 1

if __name__ == '__main__':
    sys.exit(main())