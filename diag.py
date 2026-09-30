import ftplib
import urllib.request
import urllib.error

ftp = ftplib.FTP('147.93.37.161')
ftp.set_pasv(True)
ftp.login('u357867701.grandmidia', 'T5/wWR8WZ8aRzLcI')
# FTP home IS /public_html, so just stay at root

print('=== CWD ===')
print(ftp.pwd())

# Check which assets exist
print('\n=== Old asset hashes ===')
for name in ['assets/index-D0bFZHQ_.js', 'assets/index-D0bFZHQ_.css']:
    try:
        size = ftp.size(f'public/{name}')
        print(f'  {name}: EXISTS ({size} bytes)')
    except:
        print(f'  {name}: MISSING')

print('\n=== New asset hashes ===')
for name in ['assets/index-D_AXw0MM.js', 'assets/index-DN3oB2Km.css']:
    try:
        size = ftp.size(f'public/{name}')
        print(f'  {name}: EXISTS ({size} bytes)')
    except:
        print(f'  {name}: MISSING')

# Check all critical root files
print('\n=== Critical files ===')
checks = [
    '.htaccess',
    '.env',
    'composer.json',
    'public/index.html',
    'public/index.php',
    'public/.htaccess',
    'vendor/autoload.php',
    'vendor/codeigniter4/framework/system/Boot.php',
    'vendor/codeigniter4/framework/system/CodeIgniter.php',
    'vendor/composer/autoload_real.php',
    'vendor/composer/ClassLoader.php',
    'app/Controllers/React.php',
]
for path in checks:
    try:
        size = ftp.size(path)
        print(f'  [OK] {path} ({size})')
    except:
        print(f'  [XX] {path}')

# HTTP test
print('\n=== HTTP / ===')
try:
    req = urllib.request.Request('https://aplicativo.grandmidia.com.br/', headers={'User-Agent': 'Mozilla/5.0'})
    resp = urllib.request.urlopen(req, timeout=10)
    content = resp.read(500).decode('utf-8', errors='replace')
    print(f'  Status: {resp.status}')
    print(f'  Body: {content[:300]}')
except urllib.error.HTTPError as e:
    body = e.read(500).decode('utf-8', errors='replace')
    print(f'  HTTP {e.code}')
    print(f'  Body: {body[:300]}')
except Exception as e:
    print(f'  Error: {e}')

print('\n=== HTTP /agency ===')
try:
    req = urllib.request.Request('https://aplicativo.grandmidia.com.br/agency', headers={'User-Agent': 'Mozilla/5.0'})
    resp = urllib.request.urlopen(req, timeout=10)
    content = resp.read(500).decode('utf-8', errors='replace')
    print(f'  Status: {resp.status}')
    print(f'  Body: {content[:300]}')
except urllib.error.HTTPError as e:
    body = e.read(500).decode('utf-8', errors='replace')
    print(f'  HTTP {e.code}')
    print(f'  Body: {body[:300]}')
except Exception as e:
    print(f'  Error: {e}')

ftp.quit()
