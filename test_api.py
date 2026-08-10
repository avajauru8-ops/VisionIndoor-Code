import requests

url = "https://aplicativo.grandmidia.com.br/api.php"
payload = {
    "device_id": "TEST1234",
    "status_operacional": "EM VERIFICACAO",
    "status_atual": "Gerando codigo",
    "info": {}
}

response = requests.post(url, json=payload)
print(f"Status Code: {response.status_code}")
print(f"Response Text: {response.text}")
