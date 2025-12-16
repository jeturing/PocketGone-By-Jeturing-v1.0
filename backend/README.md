# PocketGone Backend API

FastAPI backend for the PocketGone RF Spectrum Analysis, Bluetooth Diagnostics, and WiFi Lab application.

## Features

- **RESTful API**: Clean and documented API endpoints
- **Real-time Data**: Live RF spectrum generation and device scanning
- **Database Integration**: SQLite database with SQLAlchemy ORM
- **Educational Simulations**: Realistic simulated data for learning
- **CORS Support**: Configured for frontend integration
- **Auto Documentation**: Swagger UI and ReDoc available

## Requirements

- Python 3.9+
- pip (Python package manager)

## Installation

### 1. Create Virtual Environment (Recommended)

```bash
python -m venv venv
```

### 2. Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**macOS/Linux:**
```bash
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

## Running the Server

### Development Mode

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The server will start at: `http://localhost:8000`

### Production Mode

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with access code
- `GET /api/auth/session` - Check session status

### RF Spectrum
- `GET /api/fft/live` - Get live spectrum data

### Bluetooth
- `GET /api/bt/scan` - Scan for Bluetooth devices

### WiFi
- `GET /api/wifi/scan?band={band}` - Scan WiFi networks

### Signal Logs
- `POST /api/logs` - Create signal log
- `GET /api/logs` - Get all signal logs
- `DELETE /api/logs/{log_id}` - Delete signal log

### Statistics
- `GET /api/stats/kpi` - Get system KPI statistics

### Health
- `GET /` - API status
- `GET /health` - Health check

## Database

The application uses SQLite with the following schema:

### Users Table
```sql
- id (Primary Key)
- username (Unique)
- access_code
- role (STUDENT/PROFESSOR)
- created_at
- last_login
- is_active
```

### Signal Logs Table
```sql
- id (UUID, Primary Key)
- timestamp (Unix ms)
- frequency (MHz)
- bandwidth (MHz)
- peak_db (dBFS)
- notes
- user_id
- created_at
```

### Bluetooth Scans Table
```sql
- id (Primary Key)
- mac_address
- device_name
- rssi
- cod (Class of Device)
- vendor
- is_connected
- last_seen
- scan_timestamp
```

### WiFi Scans Table
```sql
- id (Primary Key)
- ssid
- bssid
- channel
- rssi
- security
- vendor
- band (2.4GHz/5GHz/6GHz)
- width (Channel width)
- scan_timestamp
```

## Default Users

The database is seeded with two default users:

1. **Professor Account**
   - Access Code: `admin`
   - Username: Prof. Falken
   - Role: PROFESSOR

2. **Student Account**
   - Access Code: `student`
   - Username: Student Unit 1
   - Role: STUDENT

## Environment Variables

Create a `.env` file (see `.env.example`):

```bash
PORT=8000
HOST=0.0.0.0
DATABASE_URL=sqlite:///./data/pocketgone.db
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

## Project Structure

```
backend/
├── main.py              # FastAPI application and endpoints
├── models.py            # SQLAlchemy database models
├── database.py          # Database configuration and initialization
├── requirements.txt     # Python dependencies
├── .env.example         # Environment variables template
└── README.md           # This file
```

## Development

### Adding New Endpoints

1. Define Pydantic schemas in `main.py`
2. Create endpoint function with appropriate decorators
3. Implement business logic
4. Add database operations if needed
5. Return appropriate response model

Example:
```python
@app.get("/api/new-endpoint", response_model=ResponseModel)
async def new_endpoint(db: Session = Depends(get_db)):
    # Implementation
    return response_data
```

### Database Migrations

For schema changes:

1. Modify models in `models.py`
2. Delete `data/pocketgone.db`
3. Restart server (auto-creates new schema)

For production, consider using Alembic for migrations.

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 8000
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill the process or use a different port
uvicorn main:app --port 8001
```

### Database Locked
```bash
# Close all connections and restart server
# Or delete data/pocketgone.db and restart
```

### Import Errors
```bash
# Ensure virtual environment is activated
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

## Security Considerations

⚠️ **For Educational Use**: This backend uses simplified authentication suitable for classroom environments. For production:

- Implement proper password hashing (bcrypt, argon2)
- Use JWT tokens for session management
- Add rate limiting
- Implement input validation
- Use environment variables for secrets
- Enable HTTPS/TLS
- Add request logging and monitoring

## Testing

Create a `tests/` directory and add pytest tests:

```bash
pip install pytest pytest-asyncio httpx
pytest
```

## Contributing

Follow these guidelines:
1. Use type hints
2. Add docstrings to functions
3. Follow PEP 8 style guide
4. Test endpoints before committing
5. Update API documentation

## License

Educational use license - see main project README

## Support

For issues or questions, please open an issue in the main repository.
