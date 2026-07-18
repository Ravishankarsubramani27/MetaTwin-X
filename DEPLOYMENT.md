# MetaTwin-X Deployment Guide

## Overview

MetaTwin-X is a Streamlit application that can be deployed to:
1. **Streamlit Community Cloud** (recommended — free public HTTPS URL)
2. **Local machine** (development/testing)
3. **Docker container** (self-hosted)

---

## Option 1: Streamlit Community Cloud (Recommended)

### Prerequisites
- GitHub account
- Streamlit Community Cloud account (free at [share.streamlit.io](https://share.streamlit.io))

### Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial MetaTwin-X deployment"
   git remote add origin https://github.com/YOUR_USERNAME/metatwin-x.git
   git push -u origin main
   ```

2. **Connect to Streamlit Community Cloud**
   - Go to [share.streamlit.io](https://share.streamlit.io)
   - Click "New app"
   - Select your GitHub repository
   - Set the main file path to: `app.py`
   - Click "Deploy"

3. **Access your app**
   - Streamlit provides a public HTTPS URL automatically
   - Format: `https://YOUR_USERNAME-metatwin-x-app-XXXXX.streamlit.app`

### Notes
- The app uses mock ML models by default (no training required)
- To use real trained models, commit the `models/` directory to your repository
- Streamlit Community Cloud has a 1GB memory limit — the mock models stay well within this

---

## Option 2: Local Development

### Prerequisites
- Python 3.11+
- pip

### Installation

```bash
# Clone or navigate to the project directory
cd metatwin-x

# Create a virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt
```

### Running the App

```bash
streamlit run app.py
```

The app will be available at `http://localhost:8501`.

### Training Real Models (Optional)

```bash
# Train all three organ models
python training/train.py --all

# Or train individually
python training/train.py --organ heart
python training/train.py --organ kidney
python training/train.py --organ liver
```

Trained artifacts are saved to `models/{organ}/{YYYY-MM-DD}/`.

---

## Option 3: Docker Deployment

### Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8501

HEALTHCHECK CMD curl --fail http://localhost:8501/_stcore/health

ENTRYPOINT ["streamlit", "run", "app.py", \
            "--server.port=8501", \
            "--server.address=0.0.0.0", \
            "--server.headless=true"]
```

### Build and Run

```bash
# Build the image
docker build -t metatwin-x .

# Run the container
docker run -p 8501:8501 metatwin-x
```

Access at `http://localhost:8501`.

### Docker Compose (with volume for models)

```yaml
version: '3.8'
services:
  metatwin-x:
    build: .
    ports:
      - "8501:8501"
    volumes:
      - ./models:/app/models
    environment:
      - STREAMLIT_SERVER_HEADLESS=true
    restart: unless-stopped
```

---

## Environment Configuration

### `.streamlit/config.toml`

The app ships with a dark theme configuration:

```toml
[theme]
primaryColor = "#1E88E5"
backgroundColor = "#0E1117"
secondaryBackgroundColor = "#1A1F2E"
textColor = "#FAFAFA"
font = "sans serif"

[server]
headless = true
enableCORS = false
port = 8501
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `STREAMLIT_SERVER_PORT` | 8501 | Server port |
| `STREAMLIT_SERVER_HEADLESS` | true | Headless mode |
| `STREAMLIT_SERVER_ENABLE_CORS` | false | CORS setting |

---

## Performance Considerations

### Response Time Target: ≤ 5 seconds (Requirement 12.1)

The app achieves this through:
- **Parallel inference**: All three organ models run concurrently via `ThreadPoolExecutor`
- **Cached engines**: `@st.cache_resource` ensures models are loaded once at startup
- **Mock models**: When no trained artifacts exist, lightweight mock models provide instant responses

### Memory Usage

| Component | Approximate Memory |
|-----------|-------------------|
| Mock models (3 organs) | ~5 MB |
| XGBoost models (3 organs) | ~50–200 MB |
| SHAP explainers (3 organs) | ~20–100 MB |
| Streamlit overhead | ~200 MB |
| **Total (mock mode)** | **~250 MB** |
| **Total (trained models)** | **~600 MB** |

### Concurrent Users

The app supports up to 10 concurrent users (Requirement 12.4) through:
- Streamlit's built-in session isolation
- Thread-safe model inference
- No shared mutable state between sessions

---

## Health Check

The Streamlit built-in health endpoint is available at:
```
GET http://localhost:8501/_stcore/health
```

Returns `200 OK` when the app is running.

---

## Troubleshooting

### App fails to start
- Ensure Python 3.11+ is installed: `python --version`
- Ensure all dependencies are installed: `pip install -r requirements.txt`
- Check for port conflicts: `netstat -an | grep 8501`

### Models not loading
- The app automatically falls back to mock models if no trained artifacts exist
- To train real models: `python training/train.py --all`
- Check `models/` directory for date-stamped subdirectories

### SHAP errors
- SHAP requires compatible NumPy/XGBoost versions
- If SHAP fails, the app falls back to uniform feature attribution
- Install SHAP: `pip install shap==0.45.0`

### Memory errors on Streamlit Community Cloud
- The free tier has a 1GB memory limit
- Use mock models (default) to stay within limits
- Avoid committing large model files to the repository

---

## Security Notes

> ⚠️ MetaTwin-X is for **educational and informational purposes only**.
> It does not constitute medical advice, diagnosis, or treatment.
> Do not deploy with real patient data without appropriate security controls,
> HIPAA compliance measures, and clinical validation.

For production healthcare deployments:
- Enable HTTPS (Streamlit Community Cloud provides this automatically)
- Implement authentication (e.g., Streamlit Authenticator)
- Add audit logging for all user submissions
- Conduct clinical validation before any patient-facing use
- Comply with applicable healthcare data regulations (HIPAA, GDPR, etc.)
