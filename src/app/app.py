import boto3
import json
import os
from botocore.exceptions import NoCredentialsError, PartialCredentialsError, ClientError
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["https://ai-chatbot-v3.vercel.app"])

aws_access_key_id = os.getenv('NEXT_PUBLIC_AWS_ACCESS_KEY_ID')
aws_secret_access_key = os.getenv('NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY')
region_name = os.getenv('NEXT_PUBLIC_REGION_NAME')

if not aws_access_key_id or not aws_secret_access_key or not region_name:
    raise EnvironmentError("Missing one or more AWS environment variables")

try:
    session = boto3.Session(
        aws_access_key_id=aws_access_key_id,
        aws_secret_access_key=aws_secret_access_key,
        region_name=region_name
    )

    bedrock_runtime = boto3.client('bedrock-runtime', region_name=region_name)  # Create a Bedrock Runtime client
except (NoCredentialsError, PartialCredentialsError) as e:
    raise EnvironmentError("AWS credentials error: " + str(e))


@app.route('/api/invoke', methods=['POST', 'GET'])
def invoke_model():
    if request.method == 'POST':
        try:
            data = request.get_json()
            new_message = data.get('newmessage')

            if not new_message:
                return jsonify({"error": "newmessage is required"}), 400

            kwargs = {
                "modelId": "anthropic.claude-3-haiku-20240307-v1:0",
                "contentType": "application/json",
                "accept": "application/json",
                "body": json.dumps({
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 1000,
                    "messages": [
                        {
                            "role": "user",
                            "content": new_message
                        }
                    ]
                })
            }

            response = bedrock_runtime.invoke_model(**kwargs)
            response_body = json.loads(response['body'])

            return jsonify(response_body), 200
        except ClientError as e:
            app.logger.error(f"ClientError: {e}")
            return jsonify({"error": str(e)}), 500
        except Exception as e:
            app.logger.error(f"Exception: {e}")
            return jsonify({"error": str(e)}), 500
    elif request.method == 'GET':
        return jsonify({"message": "This endpoint is used for invoking the model via POST requests."}), 200


if __name__ == '__main__':
    app.run(port=8080)