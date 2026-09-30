import ftplib
import os
import sys
import time

FTP_HOST = '147.93.37.161'
FTP_USER = 'u357867701.grandmidia'
FTP_PASS = 'T5/wWR8WZ8aRzLcI'
LOCAL_BASE = r'D:\visioindoor---php (2)\backend'

def connect():
    ftp = ftplib.FTP(FTP_HOST)
    ftp.set_pasv(True)
    ftp.login(FTP_USER, FTP_PASS)
    ftp.voidcmd('TYPE I')  # Binary mode
    return ftp

def mkdir_p(ftp, path):
    """Recursively create remote directories."""
    dirs = path.split('/')
    ftp.cwd('/')
    for d in dirs:
        if d:
            try:
                ftp.cwd(d)
            except ftplib.error_perm:
                try:
                    ftp.mkd(d)
                    ftp.cwd(d)
                except ftplib.error_perm:
                    pass
    ftp.cwd('/')

def upload_file(ftp, local_path, remote_path):
    mkdir_p(ftp, os.path.dirname(remote_path).replace('\\', '/'))
    with open(local_path, 'rb') as f:
        ftp.storbinary(f'STOR {os.path.basename(remote_path)}', f)

def main():
    start = time.time()
    
    # Parse args
    mode = sys.argv[1] if len(sys.argv) > 1 else 'assets'
    
    ftp = connect()
    print(f'Connected to {FTP_HOST}')
    
    if mode == 'vendor':
        # Upload vendor files
        vendor_dir = os.path.join(LOCAL_BASE, 'vendor')
        
        # Get existing remote top-level dirs
        try:
            ftp.cwd('vendor')
            remote_top = set(ftp.nlst())
            remote_top.discard('.')
            remote_top.discard('..')
        except:
            remote_top = set()
            try:
                ftp.cwd('/')
                ftp.mkd('vendor')
            except:
                pass
        
        all_files = []
        for root, dirs, files in os.walk(vendor_dir):
            for f in files:
                fp = os.path.join(root, f)
                rel = os.path.relpath(fp, vendor_dir).replace('\\', '/')
                all_files.append((fp, f'vendor/{rel}'))
        
        # Start from a specific offset if given
        offset = int(sys.argv[2]) if len(sys.argv) > 2 else 0
        
        ok = 0
        fail = 0
        total = len(all_files)
        
        for i, (fp, rp) in enumerate(all_files):
            if i < offset:
                continue
            try:
                upload_file(ftp, fp, rp)
                ok += 1
            except Exception as e:
                fail += 1
                if fail <= 3:
                    print(f'  [FAIL] {rp}: {e}')
            
            if (i + 1) % 200 == 0:
                elapsed = time.time() - start
                print(f'  [{i+1}/{total}] ok={ok} fail={fail} elapsed={elapsed:.0f}s')
                sys.stdout.flush()
        
        elapsed = time.time() - start
        print(f'\nVendor done: {ok} uploaded, {fail} failed out of {total} (offset={offset})')
        print(f'Time: {elapsed:.0f}s')
    
    elif mode == 'backend':
        # Upload key backend files (non-vendor, non-public)
        skip_dirs = {'vendor', 'public', '.git', 'node_modules', 'writable'}
        ok = 0
        for root, dirs, files in os.walk(LOCAL_BASE):
            # Skip certain dirs
            dirs[:] = [d for d in dirs if d not in skip_dirs]
            
            for f in files:
                if f.endswith(('.zip', '.py', '.ps1')):
                    continue
                fp = os.path.join(root, f)
                rel = os.path.relpath(fp, LOCAL_BASE).replace('\\', '/')
                try:
                    upload_file(ftp, fp, rel)
                    ok += 1
                except Exception as e:
                    print(f'  [FAIL] {rel}: {e}')
        
        print(f'Backend done: {ok} files uploaded')
    
    ftp.quit()
    print('Done')

if __name__ == '__main__':
    main()
