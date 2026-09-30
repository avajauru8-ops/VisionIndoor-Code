import ftplib
import urllib.request

# Check local build
import os
public_dir = r'D:\visioindoor---php (2)\backend\public'
print('=== Local build assets ===')
for fn in os.listdir(public_dir):
    fp = os.path.join(public_dir, fn)
    if os.path.isfile(fp):
        size = os.path.getsize(fp)
        print(f'  {fn} ({size})')

print('\n=== Local index.html ===')
with open(os.path.join(public_dir, 'index.html'), 'r') as f:
    print(f.read())

# Check assets dir
assets_dir = os.path.join(public_dir, 'assets')
js_files = [f for f in os.listdir(assets_dir) if f.startswith('index-') and f.endswith('.js')]
css_files = [f for f in os.listdir(assets_dir) if f.startswith('index-') and f.endswith('.css')]
print(f'\n=== Local index JS: {js_files} ===')
print(f'=== Local index CSS: {css_files} ===')

# Connect to FTP and upload the correct index.html + assets
ftp = ftplib.FTP('147.93.37.161')
ftp.set_pasv(True)
ftp.login('u357867701.grandmidia', 'T5/wWR8WZ8aRzLcI')
print('\n=== FTP CWD ===')
print(ftp.pwd())

# Try nlst instead of size
print('\n=== FTP nlst public/ ===')
ftp.cwd('/')
try:
    ftp.cwd('public')
    print(f'CWD after public: {ftp.pwd()}')
    entries = ftp.nlst()
    print(f'Entries: {len(entries)}')
    for e in sorted(entries):
        print(f'  {e}')
except Exception as ex:
    print(f'Error: {ex}')

# Try to upload new index.html
print('\n=== Uploading new index.html ===')
local_index = os.path.join(public_dir, 'index.html')
with open(local_index, 'rb') as f:
    content = f.read()
print(f'Local index.html size: {len(content)}')
print(f'Content: {content.decode("utf-8")[:200]}')

# Upload to public/index.html
ftp.cwd('/')
try:
    ftp.cwd('public')
except:
    print('Creating public/')
    ftp.mkd('public')
    ftp.cwd('public')

with open(local_index, 'rb') as f:
    ftp.storbinary('STOR index.html', f)
print('[OK] index.html uploaded')

# Verify
data = []
ftp.retrbinary('RETR index.html', lambda b: data.append(b))
verify = b''.join(data).decode('utf-8')
print(f'Verified: {verify[:200]}')

# Upload new assets
print('\n=== Uploading new assets ===')
for fn in js_files + css_files:
    fp = os.path.join(assets_dir, fn)
    with open(fp, 'rb') as f:
        ftp.storbinary(f'STOR {fn}', f)
    size = os.path.getsize(fp)
    print(f'  [OK] {fn} ({size})')

# Also upload sw.js, workbox
for fn in ['sw.js', 'workbox-dc521307.js', 'manifest.webmanifest']:
    fp = os.path.join(public_dir, fn)
    if os.path.exists(fp):
        with open(fp, 'rb') as f:
            ftp.storbinary(f'STOR {fn}', f)
        print(f'  [OK] {fn}')

# Also upload public/.htaccess
ht_path = os.path.join(public_dir, '.htaccess')
if os.path.exists(ht_path):
    with open(ht_path, 'rb') as f:
        ftp.storbinary('STOR .htaccess', f)
    print(f'  [OK] public/.htaccess')

# Also upload public/index.php
php_path = os.path.join(public_dir, 'index.php')
if os.path.exists(php_path):
    with open(php_path, 'rb') as f:
        ftp.storbinary('STOR index.php', f)
    print(f'  [OK] public/index.php')

ftp.quit()

# Test HTTP
print('\n=== HTTP test after upload ===')
for path in ['/', '/agency']:
    try:
        req = urllib.request.Request(f'https://aplicativo.grandmidia.com.br{path}', headers={'User-Agent': 'Mozilla/5.0'})
        resp = urllib.request.urlopen(req, timeout=10)
        content = resp.read(500).decode('utf-8', errors='replace')
        print(f'  {path}: {resp.status} - {content[:150]}')
    except urllib.error.HTTPError as e:
        body = e.read(200).decode('utf-8', errors='replace')
        print(f'  {path}: HTTP {e.code} - {body[:150]}')
    except Exception as e:
        print(f'  {path}: Error: {e}')
