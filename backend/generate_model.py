import numpy as np
import pandas as pd
import joblib
import os

from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

np.random.seed(42)

# 📂 👉 GIVE YOUR DATASET PATH HERE
DATASET_PATH = "Crop_recommendation.csv"

FEATURE_COLUMNS = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
TARGET_COLUMN = 'label'


# -------------------------------
# 📂 LOAD DATASET
# -------------------------------
def load_dataset():
    if not os.path.exists(DATASET_PATH):
        print(f"❌ File not found: {DATASET_PATH}")
        exit()

    df = pd.read_csv(DATASET_PATH)
    df = df.dropna()

    X = df[FEATURE_COLUMNS].values
    y = df[TARGET_COLUMN].values

    return X, y


# -------------------------------
# 🤖 TRAIN MODEL
# -------------------------------
def train_model(X, y):
    print("\n🤖 Training model...")

    le = LabelEncoder()
    y_encoded = le.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42
    )

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)

    print(f"✅ Accuracy: {acc:.2%}")

    return model, le


# -------------------------------
# 💾 SAVE MODEL
# -------------------------------
def save_model(model, le):
    joblib.dump({'model': model, 'label_encoder': le}, "crop_model.pkl")
    print("💾 Model saved as crop_model.pkl")


# -------------------------------
# 🔮 PREDICT
# -------------------------------
def predict(model, le):
    print("\n🔮 Enter values:")

    N = float(input("Nitrogen: "))
    P = float(input("Phosphorus: "))
    K = float(input("Potassium: "))
    temp = float(input("Temperature: "))
    humidity = float(input("Humidity: "))
    ph = float(input("pH: "))
    rainfall = float(input("Rainfall: "))

    input_data = np.array([[N, P, K, temp, humidity, ph, rainfall]])

    pred = model.predict(input_data)
    crop = le.inverse_transform(pred)

    print(f"\n🌱 Recommended Crop: {crop[0]}")


# -------------------------------
# 🚀 MAIN
# -------------------------------
def main():
    X, y = load_dataset()

    model, le = train_model(X, y)

    save_model(model, le)

    predict(model, le)


if __name__ == "__main__":
    main()