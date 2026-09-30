import ftplib
import os

FTP_HOST = '147.93.37.161'
FTP_USER = 'u357867701.grandmidia'
FTP_PASS = 'T5/wWR8WZ8aRzLcI'
LOCAL_BASE = r'D:\visioindoor---php (2)\backend'

def connect():
    ftp = ftplib.FTP(FTP_HOST)
    ftp.set_pasv(True)
    ftp.login(FTP_USER, FTP_PASS)
    return ftp

def upload_file(ftp, local_path, remote_path):
    remote_dir = os.path.dirname(remote_path).replace('\\', '/')
    if remote_dir:
        ftp.cwd('/')
        for part in remote_dir.split('/'):
            if part:
                try:
                    ftp.cwd(part)
                except:
                    try:
                        ftp.mkd(part)
                        ftp.cwd(part)
                    except:
                        pass
    with open(local_path, 'rb') as f:
        ftp.storbinary(f'STOR {os.path.basename(remote_path)}', f)

def main():
    ftp = connect()
    print(f'Connected to {FTP_HOST}')
    
    # 1. Root .htaccess
    root_htaccess = os.path.join(LOCAL_BASE, '.htaccess')
    if os.path.exists(root_htaccess):
        try:
            upload_file(ftp, root_htaccess, '.htaccess')
            print('[OK] Root .htaccess')
        except Exception as e:
            print(f'[FAIL] Root .htaccess: {e}')
    
    # 2. Public root files
    public_dir = os.path.join(LOCAL_BASE, 'public')
    for fn in ['index.html', 'sw.js', 'workbox-dc521307.js', 'manifest.webmanifest', '.htaccess']:
        fp = os.path.join(public_dir, fn)
        if os.path.exists(fp):
            try:
                upload_file(ftp, fp, f'public/{fn}')
                print(f'[OK] public/{fn}')
            except Exception as e:
                print(f'[FAIL] public/{fn}: {e}')
    
    # 3. Assets
    assets_dir = os.path.join(public_dir, 'assets')
    if os.path.isdir(assets_dir):
        try:
            ftp.cwd('/')
            ftp.cwd('public/assets')
            server_files = set(ftp.nlst())
            server_files.discard('.')
            server_files.discard('..')
        except:
            server_files = set()
        
        local_files = [f for f in os.listdir(assets_dir) if os.path.isfile(os.path.join(assets_dir, f))]
        new_files = [f for f in local_files if f not in server_files]
        print(f'\nAssets: {len(new_files)} new out of {len(local_files)} total')
        
        ok = 0
        for fn in sorted(new_files):
            fp = os.path.join(assets_dir, fn)
            try:
                upload_file(ftp, fp, f'public/assets/{fn}')
                ok += 1
            except Exception as e:
                print(f'  [FAIL] {fn}: {e}')
        print(f'Assets uploaded: {ok}/{len(new_files)}')
    
    ftp.quit()
    print('\nDone with frontend files')

if __name__ == '__main__':
    main()
