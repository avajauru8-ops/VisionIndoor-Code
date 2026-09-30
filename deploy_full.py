import ftplib
import os
import sys

FTP_HOST = '147.93.37.161'
FTP_USER = 'u357867701.grandmidia'
FTP_PASS = 'T5/wWR8WZ8aRzLcI'
LOCAL_BASE = r'D:\visioindoor---php (2)\backend'
REMOTE_BASE = '.'

def connect():
    ftp = ftplib.FTP(FTP_HOST)
    ftp.set_pasv(True)
    ftp.login(FTP_USER, FTP_PASS)
    return ftp

def ensure_dir(ftp, path):
    """Ensure remote directory exists, creating it if needed."""
    for part in path.split('/'):
        if part:
            try:
                ftp.mkd(part)
            except ftplib.error_perm:
                pass
            ftp.cwd(part)

def upload_file(ftp, local_path, remote_path):
    """Upload a single file, creating dirs as needed."""
    remote_dir = os.path.dirname(remote_path).replace('\\', '/')
    if remote_dir:
        try:
            ftp.cwd('/')
            for part in remote_dir.split('/'):
                if part:
                    try:
                        ftp.mkd(part)
                    except ftplib.error_perm:
                        pass
                    ftp.cwd(part)
        except:
            pass
        ftp.cwd('/')
        for part in remote_dir.split('/'):
            if part:
                try:
                    ftp.cwd(part)
                except:
                    ftp.mkd(part)
                    ftp.cwd(part)
    
    size = os.path.getsize(local_path)
    with open(local_path, 'rb') as f:
        ftp.storbinary(f'STOR {os.path.basename(remote_path)}', f)
    return size

def collect_files(directory, extensions=None):
    """Collect all files in directory recursively."""
    files = []
    for root, dirs, filenames in os.walk(directory):
        for fn in filenames:
            fp = os.path.join(root, fn)
            if extensions is None or any(fn.endswith(ext) for ext in extensions):
                rel = os.path.relpath(fp, LOCAL_BASE).replace('\\', '/')
                files.append((fp, rel))
    return files

def main():
    ftp = connect()
    print(f'Connected to {FTP_HOST}')
    
    # 1. Upload root .htaccess
    root_htaccess = os.path.join(LOCAL_BASE, '.htaccess')
    if os.path.exists(root_htaccess):
        try:
            ftp.cwd('/')
            upload_file(ftp, root_htaccess, '.htaccess')
            print('[OK] Root .htaccess uploaded')
        except Exception as e:
            print(f'[FAIL] Root .htaccess: {e}')
    
    # 2. Upload public root files (index.html, sw.js, etc.)
    public_dir = os.path.join(LOCAL_BASE, 'public')
    print('\n=== Uploading public root files ===')
    for fn in ['index.html', 'sw.js', 'workbox-dc521307.js', 'manifest.webmanifest']:
        fp = os.path.join(public_dir, fn)
        if os.path.exists(fp):
            try:
                upload_file(ftp, fp, f'public/{fn}')
                print(f'  [OK] public/{fn}')
            except Exception as e:
                print(f'  [FAIL] public/{fn}: {e}')
    
    # 3. Upload public/.htaccess
    public_htaccess = os.path.join(public_dir, '.htaccess')
    if os.path.exists(public_htaccess):
        try:
            upload_file(ftp, public_htaccess, 'public/.htaccess')
            print('  [OK] public/.htaccess')
        except Exception as e:
            print(f'  [FAIL] public/.htaccess: {e}')
    
    # 4. Upload ALL new assets from backend/public/assets/
    print('\n=== Uploading public/assets/ ===')
    assets_dir = os.path.join(public_dir, 'assets')
    if os.path.isdir(assets_dir):
        # Get existing files on server
        try:
            ftp.cwd('/')
            ftp.cwd('public/assets')
            server_files = set(ftp.nlst())
            server_files.discard('.')
            server_files.discard('..')
        except:
            server_files = set()
        
        all_local = []
        for fn in os.listdir(assets_dir):
            fp = os.path.join(assets_dir, fn)
            if os.path.isfile(fp):
                all_local.append((fp, fn))
        
        # Upload only new/changed files
        new_count = 0
        skip_count = 0
        for fp, fn in all_local:
            if fn not in server_files:
                try:
                    upload_file(ftp, fp, f'public/assets/{fn}')
                    new_count += 1
                except Exception as e:
                    print(f'  [FAIL] {fn}: {e}')
            else:
                skip_count += 1
        
        print(f'  Uploaded {new_count} new files, skipped {skip_count} existing')
    
    # 5. Upload vendor/ in batches
    print('\n=== Uploading vendor/ ===')
    vendor_dir = os.path.join(LOCAL_BASE, 'vendor')
    if not os.path.isdir(vendor_dir):
        print('  vendor/ not found locally, skipping')
        ftp.quit()
        return
    
    # Get existing vendor files on server
    try:
        ftp.cwd('/')
        ftp.cwd('vendor')
        server_vendor = set(ftp.nlst())
        server_vendor.discard('.')
        server_vendor.discard('..')
    except:
        server_vendor = set()
        # Create vendor dir
        try:
            ftp.cwd('/')
            ftp.mkd('vendor')
        except:
            pass
    
    vendor_files = collect_files(vendor_dir)
    uploaded = 0
    skipped = 0
    failed = 0
    total = len(vendor_files)
    
    for i, (fp, rel) in enumerate(vendor_files):
        filename = os.path.basename(fp)
        # Quick check if top-level dir file exists
        remote_path = f'vendor/{rel}'
        try:
            upload_file(ftp, fp, remote_path)
            uploaded += 1
        except Exception as e:
            failed += 1
            if failed <= 5:
                print(f'  [FAIL] vendor/{rel}: {e}')
        
        if (i + 1) % 100 == 0:
            print(f'  Progress: {i+1}/{total} (uploaded={uploaded}, failed={failed})')
    
    print(f'  Vendor done: {uploaded} uploaded, {failed} failed out of {total}')
    
    ftp.quit()
    print('\n=== All done ===')

if __name__ == '__main__':
    main()
