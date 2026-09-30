import urllib.request

# Check sw.js content
req = urllib.request.Request('https://aplicativo.grandmidia.com.br/sw.js', headers={'User-Agent': 'Mozilla/5.0'})
resp = urllib.request.urlopen(req, timeout=10)
sw = resp.read().decode('utf-8', errors='replace')
print(f'sw.js length: {len(sw)}')
print(f'First 500 chars:\n{sw[:500]}')

# Check if it references old or new hashes
if 'D_AXw0MM' in sw:
    print('\n=== sw.js has NEW hashes (D_AXw0MM) ===')
elif 'D0bFZHQ' in sw:
    print('\n=== sw.js has OLD hashes (D0bFZHQ) ===')
else:
    print('\n=== sw.js has NEITHER hash ===')

# Find the precache manifest entries
import re
entries = re.findall(r'"url":"([^"]+)"', sw)
print(f'\n=== Precached URLs ({len(entries)}) ===')
for e in entries[:20]:
    print(f'  {e}')
print('  ...')
