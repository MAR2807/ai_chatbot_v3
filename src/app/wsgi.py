import logging
from app import app

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# No need to call app.run() in a serverless environment