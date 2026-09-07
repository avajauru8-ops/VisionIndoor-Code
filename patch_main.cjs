const fs = require('fs');

const file = 'C:\\Users\\Eber-ACS\\AndroidStudioProjects\\TotemPlayer\\app\\src\\main\\java\\com\\veerocket\\grandmidia\\MainActivity.java';
let content = fs.readFileSync(file, 'utf8');

const searchRegex = /android\.content\.SharedPreferences prefs = getSharedPreferences\("TotemPrefs", MODE_PRIVATE\);\s+androidId = prefs\.getString\("device_id_6_alpha", null\);\s+if \(androidId == null \|\| androidId\.isEmpty\(\)\) {[\s\S]*?prefs\.edit\(\)\.putString\("device_id_6_alpha", androidId\)\.apply\(\);\s+}/;

const replacement = `          androidId = null;
          try {
              String rawId = android.provider.Settings.Secure.getString(getContentResolver(), android.provider.Settings.Secure.ANDROID_ID);
              if (rawId == null || rawId.isEmpty()) {
                  android.content.SharedPreferences prefs = getSharedPreferences("TotemPrefs", MODE_PRIVATE);
                  androidId = prefs.getString("device_id_6_alpha", null);
                  if (androidId == null || androidId.isEmpty()) {
                      String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
                      StringBuilder sb = new StringBuilder(6);
                      java.util.Random rnd = new java.util.Random();
                      for (int i = 0; i < 6; i++) {
                          sb.append(chars.charAt(rnd.nextInt(chars.length())));
                      }
                      androidId = sb.toString();
                      prefs.edit().putString("device_id_6_alpha", androidId).apply();
                  }
              } else {
                  java.security.MessageDigest md = java.security.MessageDigest.getInstance("MD5");
                  byte[] hash = md.digest(rawId.getBytes());
                  StringBuilder hexString = new StringBuilder();
                  for (byte b : hash) {
                      String hex = Integer.toHexString(0xff & b);
                      if (hex.length() == 1) hexString.append('0');
                      hexString.append(hex);
                  }
                  String base36 = new java.math.BigInteger(hexString.toString(), 16).toString(36).toUpperCase();
                  if (base36.length() > 6) {
                      androidId = base36.substring(0, 6);
                  } else {
                      while (base36.length() < 6) base36 = "0" + base36;
                      androidId = base36;
                  }
              }
          } catch (Exception e) {
              androidId = "ERRO12";
          }`;

if (content.match(searchRegex)) {
    content = content.replace(searchRegex, replacement);
    fs.writeFileSync(file, content, 'utf8');
    console.log("MainActivity.java patched for deterministic device_id!");
} else {
    console.log("Could not find the target code block in MainActivity.java.");
}
