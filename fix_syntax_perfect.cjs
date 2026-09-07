const fs = require('fs');

const file = 'C:\\Users\\Eber-ACS\\AndroidStudioProjects\\TotemPlayer\\app\\src\\main\\java\\com\\veerocket\\grandmidia\\MainActivity.java';
let content = fs.readFileSync(file, 'utf8');

const regex = /private void playMedia\(MediaItem item\) \{[\s\S]*?private void playNextMedia\(\)/;

const newPlayMedia = `private void playMedia(MediaItem item) {
        if (playlist.isEmpty() || isSleeping) return;

        statusOperacional = "FUNCIONANDO CORRETAMENTE";
        statusAtualApp = "Reproduzindo: " + (item.caminhoLocal != null ? item.caminhoLocal : "Widget");
        enviarStatusSimples();

        int nextPlayerIndex = (activePlayerIndex + 1) % 2;
        int prevPlayerIndex = activePlayerIndex;

        try {
            if (item.tipo != null && item.tipo.equals("noticia")) {
                if (!isInternetAvailable()) {
                    mainHandler.postDelayed(this::playNextMedia, 1000);
                    return;
                }

                webPlayers[nextPlayerIndex].loadUrl(item.caminhoLocal);
                webPlayers[nextPlayerIndex].setVisibility(View.VISIBLE);

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

            } else {
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
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            playNextMedia();
        }
    }

    private void playNextMedia()`;

content = content.replace(regex, newPlayMedia);

// Also remove stray closing brace that might be present near getFolderSize due to my previous script
const errorRegex = /\s*\}\s*private long getFolderSize/;
content = content.replace(errorRegex, '\n\n    private long getFolderSize');

fs.writeFileSync(file, content, 'utf8');
console.log("Syntax perfectly patched!");
