import logging
import sys
import os

# Add the src directory to the sys.path to ensure the app module can be found
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app import app

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# No need to call app.run() in a serverless environment