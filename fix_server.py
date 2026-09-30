import ftplib
from io import BytesIO

ftp = ftplib.FTP('147.93.37.161')
ftp.set_pasv(True)
ftp.login('u357867701.grandmidia', 'T5/wWR8WZ8aRzLcI')

# Root .htaccess - redirect everything to public/
htaccess = b'<IfModule mod_rewrite.c>\r\n    RewriteEngine On\r\n    RewriteRule ^(.*)$ public/$1 [L]\r\n</IfModule>\r\n'
ftp.storbinary('STOR .htaccess', BytesIO(htaccess))
print('[OK] Root .htaccess')

# Verify content
data = []
ftp.retrbinary('RETR .htaccess', lambda b: data.append(data))
data = []
ftp.retrbinary('RETR .htaccess', lambda b: data.append(b))
content = b''.join(data).decode()
print(content)
assert '$1' in content, 'ERROR: $1 missing from .htaccess!'
print('Content verified OK')

# Check all critical files
checks = [
    '.htaccess',
    'index.php',
    'composer.json',
    'app/Config/Routes.php',
    'app/Controllers/React.php',
    'public/index.html',
    'public/index.php',
    'public/.htaccess',
    'vendor/autoload.php',
    'vendor/codeigniter4/framework/system/Boot.php',
]
print('\n=== Critical files ===')
for path in checks:
    try:
        size = ftp.size(path)
        print(f'  [OK] {path} ({size} bytes)')
    except:
        print(f'  [MISSING] {path}')

# Test the site
print('\n=== Testing HTTP ===')
import urllib.request
try:
    req = urllib.request.Request('https://aplicativo.grandmidia.com.br/', headers={'User-Agent': 'Mozilla/5.0'})
    resp = urllib.request.urlopen(req, timeout=10)
    print(f'Status: {resp.status}')
    content = resp.read(500).decode('utf-8', errors='replace')
    print(f'Content: {content[:300]}')
except Exception as e:
    print(f'Error: {e}')

ftp.quit()
