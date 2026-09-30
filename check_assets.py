import urllib.request

urls = [
    'https://aplicativo.grandmidia.com.br/assets/index-D_AXw0MM.js',
    'https://aplicativo.grandmidia.com.br/assets/index-DN3oB2Km.css',
    'https://aplicativo.grandmidia.com.br/sw.js',
]
for url in urls:
    name = url.split('/')[-1]
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        resp = urllib.request.urlopen(req, timeout=10)
        print(f'{name}: {resp.status}')
    except urllib.error.HTTPError as e:
        print(f'{name}: HTTP {e.code}')
    except Exception as e:
        print(f'{name}: Error: {e}')
