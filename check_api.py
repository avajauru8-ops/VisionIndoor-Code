import urllib.request
import json

# Test API endpoint
print('=== API Test ===')
try:
    req = urllib.request.Request('https://aplicativo.grandmidia.com.br/api/auth/login', 
        headers={'User-Agent': 'Mozilla/5.0', 'Content-Type': 'application/json'},
        data=json.dumps({'email': 'test', 'password': 'test'}).encode())
    resp = urllib.request.urlopen(req, timeout=10)
    print(f'POST /api/auth/login: {resp.status}')
except urllib.error.HTTPError as e:
    body = e.read(500).decode('utf-8', errors='replace')
    print(f'POST /api/auth/login: HTTP {e.code}')
    print(f'Body: {body[:300]}')
except Exception as e:
    print(f'Error: {e}')

# Test a simple endpoint
print('\n=== Simple GET ===')
try:
    req = urllib.request.Request('https://aplicativo.grandmidia.com.br/api/clima', headers={'User-Agent': 'Mozilla/5.0'})
    resp = urllib.request.urlopen(req, timeout=10)
    print(f'GET /api/clima: {resp.status}')
except urllib.error.HTTPError as e:
    body = e.read(500).decode('utf-8', errors='replace')
    print(f'GET /api/clima: HTTP {e.code}')
    print(f'Body: {body[:300]}')
except Exception as e:
    print(f'Error: {e}')
