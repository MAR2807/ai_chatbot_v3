import logging
from app import app

# Configure logging
logging.basicConfig(level=logging.DEBUG)

if __name__ == "__main__":
    try:
        app.run()
    except Exception as e:
        logging.error("An error occurred while running the app", exc_info=True)