const fs = require('fs');

const file = 'C:\\Users\\Eber-ACS\\AndroidStudioProjects\\TotemPlayer\\app\\src\\main\\java\\com\\veerocket\\grandmidia\\MainActivity.java';
let content = fs.readFileSync(file, 'utf8');

// 1. Update MediaItem class
content = content.replace(
    /public static class MediaItem \{[\s\S]*?int tempoExibicao;[\s\S]*?MediaItem\(String tipo, String caminhoLocal, int tempoExibicao\) \{[\s\S]*?this\.tipo = tipo;[\s\S]*?this\.caminhoLocal = caminhoLocal;[\s\S]*?this\.tempoExibicao = tempoExibicao;[\s\S]*?\}[\s\S]*?\}/,
    `public static class MediaItem {
        String tipo;
        String caminhoLocal;
        String urlOnline;
        int tempoExibicao;

        MediaItem(String tipo, String caminhoLocal, String urlOnline, int tempoExibicao) {
            this.tipo = tipo;
            this.caminhoLocal = caminhoLocal;
            this.urlOnline = urlOnline;
            this.tempoExibicao = tempoExibicao;
        }
    }`
);

// 2. Remove showDownloadingScreen and synchronous download from checkDatabaseForUpdates
// Find the block:
/*
            int totalArquivosParaBaixar = 0;
            for (int i = 0; i < jsonArray.length(); i++) {
...
                if (jsonObject.has("limpeza_automatica") && !jsonObject.isNull("limpeza_automatica") && jsonObject.getBoolean("limpeza_automatica")) {
*/
const syncBlockRegex = /int totalArquivosParaBaixar = 0;[\s\S]*?if \(jsonObject\.has\("limpeza_automatica"\)/;

const newSyncBlock = `
            List<MediaItem> temporaryPlaylist = new ArrayList<>();
            List<String> caminhosOffline = new ArrayList<>();

            for (int i = 0; i < jsonArray.length(); i++) {
                try {
                    JSONObject item = jsonArray.getJSONObject(i);
                    String tipoMidia = item.getString("tipo_midia");
                    String urlArquivo = item.getString("url_arquivo");
                    int tempoExibicao = item.has("tempo_exibicao") && !item.isNull("tempo_exibicao") ? item.getInt("tempo_exibicao") : defaultDisplayTime;

                    if (tipoMidia.equals("noticia")) {
                        temporaryPlaylist.add(new MediaItem(tipoMidia, urlArquivo, urlArquivo, tempoExibicao));
                        caminhosOffline.add(urlArquivo);
                    } else {
                        String nomeArquivo = urlArquivo.substring(urlArquivo.lastIndexOf('/') + 1);
                        String caminhoLocal = new java.io.File(getFilesDir(), nomeArquivo).getAbsolutePath();
                        temporaryPlaylist.add(new MediaItem(tipoMidia, caminhoLocal, urlArquivo, tempoExibicao));
                        caminhosOffline.add(caminhoLocal);
                    }
                } catch (Exception itemEx) {
                    itemEx.printStackTrace();
                    caminhosOffline.add("");
                }
            }
            
            // Iniciar download em background
            new Thread(() -> {
                for (int i = 0; i < jsonArray.length(); i++) {
                    try {
                        JSONObject item = jsonArray.getJSONObject(i);
                        String tipoMidia = item.getString("tipo_midia");
                        String urlArquivo = item.getString("url_arquivo");
                        if (!tipoMidia.equals("noticia")) {
                            String nomeArquivo = urlArquivo.substring(urlArquivo.lastIndexOf('/') + 1);
                            downloadMediaFile(urlArquivo, nomeArquivo);
                        }
                    } catch(Exception e){}
                }
            }).start();

            if (jsonObject.has("limpeza_automatica")`;

content = content.replace(syncBlockRegex, newSyncBlock);

// 3. Update playMedia logic
const playMediaRegex = /if \(\(item\.tipo != null && item\.tipo\.equals\("video"\)\) \|\| \(item\.caminhoLocal != null && \(item\.caminhoLocal\.toLowerCase\(\)\.contains\("\.mp4"\) \|\| item\.caminhoLocal\.toLowerCase\(\)\.contains\("\.avi"\) \|\| item\.caminhoLocal\.toLowerCase\(\)\.contains\("\.mkv"\)\)\)\) \{[\s\S]*?videoPlayers\[nextPlayerIndex\]\.start\(\);[\s\S]*?\} else \{[\s\S]*?imagePlayers\[nextPlayerIndex\]\.setImageURI\(Uri\.fromFile\(new java\.io\.File\(item\.caminhoLocal\)\)\);[\s\S]*?mainHandler\.postDelayed\(imageRunnable, item\.tempoExibicao \* 1000L\);[\s\S]*?\}/;

const newPlayMedia = `
            boolean useOnline = isInternetAvailable();
            String targetUrl = useOnline ? item.urlOnline : item.caminhoLocal;

            if ((item.tipo != null && item.tipo.equals("video")) || (targetUrl != null && (targetUrl.toLowerCase().contains(".mp4") || targetUrl.toLowerCase().contains(".avi") || targetUrl.toLowerCase().contains(".mkv")))) {
                videoPlayers[nextPlayerIndex].setOnInfoListener((mp, what, extra) -> {
                    if (what == android.media.MediaPlayer.MEDIA_INFO_VIDEO_RENDERING_START) {
                        mainHandler.post(() -> {
                            videoPlayers[nextPlayerIndex].setVisibility(View.VISIBLE);
                            videoPlayers[prevPlayerIndex].setVisibility(View.GONE);
                            imagePlayers[prevPlayerIndex].setVisibility(View.GONE);
                            webPlayers[prevPlayerIndex].setVisibility(View.GONE);
                            if(videoPlayers[prevPlayerIndex].isPlaying()){
                                videoPlayers[prevPlayerIndex].stopPlayback();
                            }
                            webPlayers[prevPlayerIndex].loadUrl("about:blank");
                            activePlayerIndex = nextPlayerIndex;
                        });
                        return true;
                    }
                    return false;
                });

                videoPlayers[nextPlayerIndex].setVisibility(View.INVISIBLE);
                videoPlayers[nextPlayerIndex].setVideoURI(useOnline ? Uri.parse(item.urlOnline) : Uri.parse(item.caminhoLocal));
                videoPlayers[nextPlayerIndex].start();

                if (videoTimeoutRunnable != null) mainHandler.removeCallbacks(videoTimeoutRunnable);
                videoTimeoutRunnable = this::playNextMedia;
                mainHandler.postDelayed(videoTimeoutRunnable, (item.tempoExibicao + 2) * 1000L);

            } else {
                if (useOnline) {
                    new Thread(() -> {
                        try {
                            java.net.URL url = new java.net.URL(item.urlOnline);
                            android.graphics.Bitmap bmp = android.graphics.BitmapFactory.decodeStream(url.openConnection().getInputStream());
                            mainHandler.post(() -> {
                                imagePlayers[nextPlayerIndex].setImageBitmap(bmp);
                                imagePlayers[nextPlayerIndex].setVisibility(View.VISIBLE);
                
                                videoPlayers[prevPlayerIndex].setVisibility(View.GONE);
                                imagePlayers[prevPlayerIndex].setVisibility(View.GONE);
                                webPlayers[prevPlayerIndex].setVisibility(View.GONE);
                                if(videoPlayers[prevPlayerIndex].isPlaying()){
                                    videoPlayers[prevPlayerIndex].stopPlayback();
                                }
                                webPlayers[prevPlayerIndex].loadUrl("about:blank");
                                activePlayerIndex = nextPlayerIndex;
                
                                if (imageRunnable != null) mainHandler.removeCallbacks(imageRunnable);
                                imageRunnable = this::playNextMedia;
                                mainHandler.postDelayed(imageRunnable, item.tempoExibicao * 1000L);
                            });
                        } catch (Exception e) {
                            e.printStackTrace();
                            mainHandler.post(this::playNextMedia);
                        }
                    }).start();
                } else {
                    imagePlayers[nextPlayerIndex].setImageURI(Uri.fromFile(new java.io.File(item.caminhoLocal)));
                    imagePlayers[nextPlayerIndex].setVisibility(View.VISIBLE);
    
                    videoPlayers[prevPlayerIndex].setVisibility(View.GONE);
                    imagePlayers[prevPlayerIndex].setVisibility(View.GONE);
                    webPlayers[prevPlayerIndex].setVisibility(View.GONE);
                    if(videoPlayers[prevPlayerIndex].isPlaying()){
                        videoPlayers[prevPlayerIndex].stopPlayback();
                    }
                    webPlayers[prevPlayerIndex].loadUrl("about:blank");
                    activePlayerIndex = nextPlayerIndex;
    
                    if (imageRunnable != null) mainHandler.removeCallbacks(imageRunnable);
                    imageRunnable = this::playNextMedia;
                    mainHandler.postDelayed(imageRunnable, item.tempoExibicao * 1000L);
                }
            }`;

content = content.replace(playMediaRegex, newPlayMedia);

fs.writeFileSync(file, content, 'utf8');
console.log("MainActivity patched for online streaming logic!");
