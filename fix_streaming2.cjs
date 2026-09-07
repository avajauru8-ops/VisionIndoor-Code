const fs = require('fs');

const file = 'C:\\Users\\Eber-ACS\\AndroidStudioProjects\\TotemPlayer\\app\\src\\main\\java\\com\\veerocket\\grandmidia\\MainActivity.java';
let content = fs.readFileSync(file, 'utf8');

// Fix VideoView visibility issue
content = content.replace(
    /videoPlayers\[nextPlayerIndex\]\.setOnInfoListener\(\(mp, what, extra\) -> \{[\s\S]*?return false;\s*\}\);[\s\S]*?videoPlayers\[nextPlayerIndex\]\.setVisibility\(View\.INVISIBLE\);/m,
    `videoPlayers[nextPlayerIndex].setOnPreparedListener(mp -> {
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
                    });`
);

// Fix ImageView decodeStream issue
content = content.replace(
    /java\.net\.URL url = new java\.net\.URL\(item\.urlOnline\);\s*android\.graphics\.Bitmap bmp = android\.graphics\.BitmapFactory\.decodeStream\(url\.openConnection\(\)\.getInputStream\(\)\);/m,
    `java.net.URL url = new java.net.URL(item.urlOnline);
                                java.net.HttpURLConnection connection = (java.net.HttpURLConnection) url.openConnection();
                                connection.setRequestProperty("User-Agent", "Mozilla/5.0");
                                connection.setConnectTimeout(10000);
                                connection.setReadTimeout(10000);
                                connection.connect();
                                android.graphics.Bitmap bmp = android.graphics.BitmapFactory.decodeStream(connection.getInputStream());`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed visibility and streaming logic!');
