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
    remote_dir = os.path.dirname(remote_path).replace('\\', '/')
    filename = os.path.basename(remote_path)
    start = ftp.pwd()
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
    ftp.cwd(start)

def main():
    ftp = connect()
    start = time.time()
    print(f'Connected to {FTP_HOST}')

    # 1. Upload ALL backend files (skip vendor and writable)
    skip_dirs = {'vendor', 'writable', 'node_modules', '.git'}
    ok = 0
    fail = 0
    for root, dirs, files in os.walk(LOCAL_BASE):
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
                fail += 1
                if fail <= 10:
                    print(f'  [FAIL] {rel}: {e}')
    
    elapsed = time.time() - start
    print(f'\nBackend (non-vendor): {ok} ok, {fail} fail in {elapsed:.0f}s')

    # 2. Upload vendor in one go
    vendor_dir = os.path.join(LOCAL_BASE, 'vendor')
    if os.path.isdir(vendor_dir):
        all_files = []
        for root, dirs, files in os.walk(vendor_dir):
            for f in files:
                fp = os.path.join(root, f)
                rel = os.path.relpath(fp, vendor_dir).replace('\\', '/')
                all_files.append((fp, rel))

        total = len(all_files)
        print(f'\nUploading vendor: {total} files...')
        vok = 0
        vfail = 0
        for i, (fp, rel) in enumerate(all_files):
            try:
                upload_file(ftp, fp, f'vendor/{rel}')
                vok += 1
            except Exception as e:
                vfail += 1
                if vfail <= 5:
                    print(f'  [FAIL] vendor/{rel}: {e}')
            if (i + 1) % 500 == 0:
                elapsed = time.time() - start
                print(f'  [{i+1}/{total}] vok={vok} vfail={vfail} elapsed={elapsed:.0f}s')
                sys.stdout.flush()

        elapsed = time.time() - start
        print(f'\nVendor: {vok} ok, {vfail} fail in {elapsed:.0f}s')

    elapsed = time.time() - start
    print(f'\n=== DONE in {elapsed:.0f}s ===')
    ftp.quit()

if __name__ == '__main__':
    main()
