import ftplib
import urllib.request
import urllib.error

ftp = ftplib.FTP('147.93.37.161')
ftp.set_pasv(True)
ftp.login('u357867701.grandmidia', 'T5/wWR8WZ8aRzLcI')

checks = [
    '.htaccess', '.env', 'composer.json',
    'vendor/autoload.php',
    'vendor/codeigniter4/framework/system/Boot.php',
    'vendor/codeigniter4/framework/system/CodeIgniter.php',
    'vendor/composer/autoload_real.php',
    'vendor/composer/autoload_static.php',
    'vendor/composer/ClassLoader.php',
    'public/index.html', 'public/index.php', 'public/.htaccess',
    'app/Controllers/React.php',
    'app/Config/Routes.php',
]
print('=== Server state ===')
for path in checks:
    try:
        size = ftp.size(path)
        print(f'  [OK] {path} ({size})')
    except:
        print(f'  [XX] {path}')

print('\n=== vendor/codeigniter4/framework ===')
try:
    ftp.cwd('vendor/codeigniter4/framework')
    for e in ftp.nlst():
        if e not in ('.', '..'):
            print(f'  {e}')
except Exception as ex:
    print(f'  Error: {ex}')

print('\n=== HTTP test ===')
try:
    req = urllib.request.Request('https://aplicativo.grandmidia.com.br/', headers={'User-Agent': 'Mozilla/5.0'})
    resp = urllib.request.urlopen(req, timeout=10)
    print(f'  Status: {resp.status}')
    content = resp.read(500).decode('utf-8', errors='replace')
    print(f'  Content: {content[:300]}')
except urllib.error.HTTPError as e:
    body = e.read(500).decode('utf-8', errors='replace')
    print(f'  HTTP {e.code}: {body[:300]}')
except Exception as e:
    print(f'  Error: {e}')

ftp.quit()
