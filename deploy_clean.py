import ftplib
import os
import time
import sys

FTP_HOST = '147.93.37.161'
FTP_USER = 'u357867701.grandmidia'
FTP_PASS = 'T5/wWR8WZ8aRzLcI'
LOCAL_BASE = r'D:\visioindoor---php (2)\backend'

def connect():
    ftp = ftplib.FTP(FTP_HOST)
    ftp.set_pasv(True)
    ftp.login(FTP_USER, FTP_PASS)
    ftp.voidcmd('TYPE I')
    return ftp

def upload_file(ftp, local_path, remote_path):
    """Upload file to exact remote_path, navigating to the correct directory."""
    remote_dir = os.path.dirname(remote_path).replace('\\', '/')
    filename = os.path.basename(remote_path)
    
    start_dir = ftp.pwd()
    ftp.cwd('/')
    if remote_dir:
        for part in remote_dir.split('/'):
            if part:
                try:
                    ftp.cwd(part)
                except ftplib.error_perm:
                    ftp.mkd(part)
                    ftp.cwd(part)
    
    with open(local_path, 'rb') as f:
        ftp.storbinary(f'STOR {filename}', f)
    
    ftp.cwd(start_dir)

def main():
    ftp = connect()
    start = time.time()
    print(f'Connected to {FTP_HOST}')
    
    mode = sys.argv[1] if len(sys.argv) > 1 else 'all'
    
    if mode in ('env', 'all'):
        # 1. Upload .env
        env_path = os.path.join(LOCAL_BASE, '.env')
        if os.path.exists(env_path):
            try:
                upload_file(ftp, env_path, '.env')
                print('[OK] .env uploaded')
            except Exception as e:
                print(f'[FAIL] .env: {e}')
    
    if mode in ('htaccess', 'all'):
        # 2. Upload root .htaccess
        ht_path = os.path.join(LOCAL_BASE, '.htaccess')
        if os.path.exists(ht_path):
            try:
                upload_file(ftp, ht_path, '.htaccess')
                print('[OK] .htaccess uploaded')
            except Exception as e:
                print(f'[FAIL] .htaccess: {e}')
    
    if mode in ('root', 'all'):
        # 3. Upload key root files
        for fn in ['index.php', 'composer.json']:
            fp = os.path.join(LOCAL_BASE, fn)
            if os.path.exists(fp):
                try:
                    upload_file(ftp, fp, fn)
                    print(f'[OK] {fn}')
                except Exception as e:
                    print(f'[FAIL] {fn}: {e}')
    
    if mode in ('vendor', 'all'):
        # 4. Upload vendor properly
        vendor_dir = os.path.join(LOCAL_BASE, 'vendor')
        if os.path.isdir(vendor_dir):
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
                    upload_file(ftp, fp, f'vendor/{rel}')
                    ok += 1
                except Exception as e:
                    fail += 1
                    if fail <= 5:
                        print(f'  [FAIL] vendor/{rel}: {e}')
                
                if (i + 1) % 200 == 0:
                    elapsed = time.time() - start
                    print(f'  [{i+1}/{total}] ok={ok} fail={fail} elapsed={elapsed:.0f}s')
                    sys.stdout.flush()
            
            elapsed = time.time() - start
            print(f'\nVendor: {ok} uploaded, {fail} failed out of {total} (offset={offset})')
            print(f'Time: {elapsed:.0f}s')
    
    if mode in ('app', 'all'):
        # 5. Upload app directory
        app_dir = os.path.join(LOCAL_BASE, 'app')
        skip_dirs = {'Tests'}
        ok = 0
        for root, dirs, files in os.walk(app_dir):
            dirs[:] = [d for d in dirs if d not in skip_dirs]
            for f in files:
                fp = os.path.join(root, f)
                rel = os.path.relpath(fp, LOCAL_BASE).replace('\\', '/')
                try:
                    upload_file(ftp, fp, rel)
                    ok += 1
                except Exception as e:
                    print(f'  [FAIL] {rel}: {e}')
        print(f'App: {ok} files uploaded')
    
    ftp.quit()
    print(f'\nDone in {time.time()-start:.0f}s')

if __name__ == '__main__':
    main()
