import ftplib
import os
import sys
import time

FTP_HOST = '147.93.37.161'
FTP_USER = 'u357867701.grandmidia'
FTP_PASS = 'T5/wWR8WZ8aRzLcI'
LOCAL_BASE = r'D:\visioindoor---php (2)\backend'

# Files/dirs that SHOULD exist at root
ROOT_ALLOW = {
    'public', 'app', 'vendor', 'writable', 'system',
    '.env', '.htaccess', 'composer.json', 'composer.lock',
    'index.php', 'spark', 'env', '.gitkeep', 'reads.me',
    '..', '.'
}

def connect():
    ftp = ftplib.FTP(FTP_HOST)
    ftp.set_pasv(True)
    ftp.login(FTP_USER, FTP_PASS)
    ftp.voidcmd('TYPE I')
    return ftp

def safe_cwd(ftp, path):
    """Navigate to a directory, creating intermediate dirs. Return to start after."""
    start = ftp.pwd()
    ftp.cwd('/')
    for part in path.strip('/').split('/'):
        if part:
            try:
                ftp.cwd(part)
            except ftplib.error_perm:
                ftp.mkd(part)
                ftp.cwd(part)
    current = ftp.pwd()
    ftp.cwd(start)
    return current

def upload_file_fixed(ftp, local_path, remote_path):
    """Upload file to exact remote_path, navigating properly."""
    remote_dir = os.path.dirname(remote_path).replace('\\', '/')
    filename = os.path.basename(remote_path)
    
    # Navigate to target directory
    start_dir = ftp.pwd()
    ftp.cwd('/')
    for part in remote_dir.split('/'):
        if part:
            try:
                ftp.cwd(part)
            except ftplib.error_perm:
                ftp.mkd(part)
                ftp.cwd(part)
    
    # Upload
    with open(local_path, 'rb') as f:
        ftp.storbinary(f'STOR {filename}', f)
    
    # Return to start
    ftp.cwd(start_dir)

def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else 'clean'
    ftp = connect()
    print(f'Connected. Mode: {mode}')
    
    if mode == 'clean':
        # Remove stray files from root
        ftp.cwd('/')
        entries = ftp.nlst()
        kept = []
        removed = 0
        for entry in entries:
            if entry in ROOT_ALLOW:
                kept.append(entry)
                continue
            try:
                ftp.delete(entry)
                removed += 1
            except ftplib.error_perm:
                # It's a directory, try to remove
                try:
                    # Remove directory contents recursively
                    ftp.cwd(entry)
                    sub_entries = ftp.nlst()
                    ftp.cwd('/')
                    # Can't easily delete non-empty dirs via FTP
                    # Just skip for now
                except:
                    pass
        print(f'Kept: {kept}')
        print(f'Removed {removed} stray files from root')
    
    elif mode == 'vendor':
        # Upload vendor properly
        vendor_dir = os.path.join(LOCAL_BASE, 'vendor')
        start_time = time.time()
        
        all_files = []
        for root, dirs, files in os.walk(vendor_dir):
            for f in files:
                fp = os.path.join(root, f)
                rel = os.path.relpath(fp, vendor_dir).replace('\\', '/')
                all_files.append((fp, rel))
        
        offset = int(sys.argv[2]) if len(sys.argv) > 2 else 0
        ok = 0
        fail = 0
        total = len(all_files)
        
        for i, (fp, rel) in enumerate(all_files):
            if i < offset:
                continue
            try:
                upload_file_fixed(ftp, fp, f'vendor/{rel}')
                ok += 1
            except Exception as e:
                fail += 1
                if fail <= 5:
                    print(f'  [FAIL] vendor/{rel}: {e}')
            
            if (i + 1) % 100 == 0:
                elapsed = time.time() - start_time
                print(f'  [{i+1}/{total}] ok={ok} fail={fail} elapsed={elapsed:.0f}s')
                sys.stdout.flush()
        
        elapsed = time.time() - start_time
        print(f'\nVendor: {ok} uploaded, {fail} failed out of {total} (offset={offset})')
        print(f'Time: {elapsed:.0f}s')
    
    elif mode == 'root':
        # Upload essential root files
        for fn in ['.htaccess']:
            fp = os.path.join(LOCAL_BASE, fn)
            if os.path.exists(fp):
                try:
                    upload_file_fixed(ftp, fp, fn)
                    print(f'[OK] {fn}')
                except Exception as e:
                    print(f'[FAIL] {fn}: {e}')
        
        # Also upload app/ directory (controllers, models, etc.)
        app_dir = os.path.join(LOCAL_BASE, 'app')
        skip_dirs = {'Tests', 'Language'}
        ok = 0
        for root, dirs, files in os.walk(app_dir):
            dirs[:] = [d for d in dirs if d not in skip_dirs]
            for f in files:
                fp = os.path.join(root, f)
                rel = os.path.relpath(fp, LOCAL_BASE).replace('\\', '/')
                try:
                    upload_file_fixed(ftp, fp, rel)
                    ok += 1
                except Exception as e:
                    print(f'  [FAIL] {rel}: {e}')
        print(f'App files uploaded: {ok}')
    
    ftp.quit()
    print('Done')

if __name__ == '__main__':
    main()
