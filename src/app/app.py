import boto3
import json
import os
from botocore.exceptions import NoCredentialsError, PartialCredentialsError, ClientError
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["https://ai-chatbot-v3.vercel.app/"])  

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
    data = request.get_json()
    new_message = data.get('newmessage')

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
                    "content": [
                        {
                            "type": "text",
                            "text": new_message
                        }
                    ]
                }
            ]
        })
    }

    try:
        response = bedrock_runtime.invoke_model(**kwargs)   # Invoke the endpoint
        body = json.loads(response['body'].read()) # Parse the response body
        text_content = body['content'][0]['text']
        print(text_content) # Print the response body
        return jsonify({'response': text_content})
    except NoCredentialsError:
        print("No credentials available")
        return jsonify({'error': 'No credentials available'}), 401
    except PartialCredentialsError:
        print("Partial credentials available")
        return jsonify({'error': 'Partial credentials available'}), 401
    except ClientError as e:
        print(f"Client error: {e}")
        return jsonify({'error': f'Client error: {e}'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8080)