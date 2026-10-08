package com.steamlite.mobile;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.Matrix;
import android.media.ExifInterface;
import android.media.MediaRecorder;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Base64;
import android.view.HapticFeedbackConstants;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.JsPromptResult;
import android.webkit.JsResult;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {
    static volatile boolean foreground = false;
    private static final int REQ_PICK = 11, REQ_LOCK = 12, PERM_NOTIF = 21, PERM_MIC = 22;

    private WebView web;
    private final Handler ui = new Handler(Looper.getMainLooper());
    private final ExecutorService pool = Executors.newFixedThreadPool(4);
    private SharedPreferences sp;
    private String pickId = "";
    private MediaRecorder rec;
    private File recFile;
    private long recStart;
    private long leftAt = 0;
    private boolean locking = false, pageReady = false;
    private String pendingOpen = "";

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        sp = getSharedPreferences("sl", MODE_PRIVATE);
        final Thread.UncaughtExceptionHandler old = Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler((t, e) -> {
            try { sp.edit().putString("crash", String.valueOf(e) + " @ " + (e.getStackTrace().length > 0 ? e.getStackTrace()[0] : "")).commit(); } catch (Exception x) { }
            if (old != null) old.uncaughtException(t, e);
        });
        PollService.ensureChannel(this);
        web = new WebView(this);
        web.setBackgroundColor(0xff0b0f17);
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setMediaPlaybackRequiresUserGesture(true);
        s.setAllowFileAccessFromFileURLs(false);
        s.setAllowUniversalAccessFromFileURLs(false);
        web.addJavascriptInterface(new Bridge(), "SLNative");
        // only our own bundled page may run here; any other link opens in the browser
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if ("file".equals(u.getScheme()) && u.getPath() != null && u.getPath().startsWith("/android_asset/www/")) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception e) { }
                return true;
            }

            @Override
            public void onPageFinished(WebView v, String url) { pageReady = true; deliverOpen(); }
        });
        // confirm() / prompt() / alert() in the page need this, or they do nothing
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onJsConfirm(WebView v, String url, String msg, final JsResult r) {
                new AlertDialog.Builder(MainActivity.this, android.R.style.Theme_Material_Dialog_Alert).setMessage(msg)
                        .setPositiveButton("OK", (d, w) -> r.confirm()).setNegativeButton("Cancel", (d, w) -> r.cancel()).setOnCancelListener(d -> r.cancel()).show();
                return true;
            }

            @Override
            public boolean onJsAlert(WebView v, String url, String msg, final JsResult r) {
                new AlertDialog.Builder(MainActivity.this, android.R.style.Theme_Material_Dialog_Alert).setMessage(msg)
                        .setPositiveButton("OK", (d, w) -> r.confirm()).setOnCancelListener(d -> r.cancel()).show();
                return true;
            }

            @Override
            public boolean onJsPrompt(WebView v, String url, String msg, String def, final JsPromptResult r) {
                final EditText et = new EditText(MainActivity.this); et.setText(def); et.setSelectAllOnFocus(true);
                new AlertDialog.Builder(MainActivity.this, android.R.style.Theme_Material_Dialog_Alert).setMessage(msg).setView(et)
                        .setPositiveButton("OK", (d, w) -> r.confirm(et.getText().toString())).setNegativeButton("Cancel", (d, w) -> r.cancel()).setOnCancelListener(d -> r.cancel()).show();
                return true;
            }
        });
        pendingOpen = b == null ? getIntent().getStringExtra("open") : null;
        if (pendingOpen == null) pendingOpen = "";
        web.loadUrl("file:///android_asset/www/index.html");
    }

    @Override
    protected void onNewIntent(Intent i) {
        super.onNewIntent(i);
        setIntent(i);
        String o = i.getStringExtra("open"); if (o != null) { pendingOpen = o; deliverOpen(); }
    }

    private void deliverOpen() {
        if (!pageReady || pendingOpen.isEmpty()) return;
        final String o = pendingOpen; pendingOpen = "";
        ui.postDelayed(() -> web.evaluateJavascript("window.openFromNotif&&openFromNotif(" + JSONObject.quote(o) + ")", null), 900);
    }

    @Override
    protected void onResume() {
        super.onResume();
        foreground = true;
        if (web != null) web.evaluateJavascript("window.onResumeApp&&onResumeApp()", null);
        if (sp.getBoolean("lock", false) && leftAt > 0 && System.currentTimeMillis() - leftAt > 20000 && !locking) askLock();
        leftAt = 0;
        android.app.NotificationManager nm = (android.app.NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (nm != null) nm.cancelAll();
    }

    @Override
    protected void onPause() { super.onPause(); foreground = false; leftAt = System.currentTimeMillis(); }

    private void askLock() {
        KeyguardManager km = (KeyguardManager) getSystemService(KEYGUARD_SERVICE);
        if (km == null || !km.isDeviceSecure()) return;
        Intent i = km.createConfirmDeviceCredentialIntent("SteamLite", "Unlock to continue");
        if (i == null) return;
        locking = true;
        web.evaluateJavascript("window.lockUi&&lockUi(true)", null);
        startActivityForResult(i, REQ_LOCK);
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("(window.onBack?onBack():false)", v -> { if (!"true".equals(v)) finish(); });
    }

    private void js(String code) { ui.post(() -> web.evaluateJavascript(code, null)); }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req == REQ_LOCK) {
            locking = false;
            if (res == RESULT_OK) { leftAt = 0; js("window.lockUi&&lockUi(false)"); }   // if cancelled, the lock screen stays and its button asks again
            return;
        }
        if (req == REQ_PICK) {
            final String id = pickId; pickId = "";
            if (res != RESULT_OK || data == null || data.getData() == null) { js("window.__cb(" + JSONObject.quote(id) + ",null)"); return; }
            final Uri u = data.getData();
            pool.execute(() -> { String out = "null"; try { out = processImage(u); } catch (Exception e) { } js("window.__cb(" + JSONObject.quote(id) + "," + JSONObject.quote(out) + ")"); });
        }
    }

    /** Shrinks a photo so it uploads fast (max 1280 px, JPEG). GIFs are kept as they are when small enough. */
    private String processImage(Uri u) throws Exception {
        String type = getContentResolver().getType(u); if (type == null) type = "";
        if (type.equals("image/gif")) {
            InputStream is = getContentResolver().openInputStream(u); ByteArrayOutputStream bo = new ByteArrayOutputStream(); byte[] buf = new byte[16384]; int n;
            while ((n = is.read(buf)) > 0 && bo.size() < 1100000) bo.write(buf, 0, n); is.close();
            if (bo.size() <= 950000) { JSONObject o = new JSONObject(); o.put("mime", "image/gif"); o.put("data", Base64.encodeToString(bo.toByteArray(), Base64.NO_WRAP)); o.put("w", 0); o.put("h", 0); return o.toString(); }
            throw new Exception("gif too big");
        }
        BitmapFactory.Options bo = new BitmapFactory.Options(); bo.inJustDecodeBounds = true;
        InputStream a = getContentResolver().openInputStream(u); BitmapFactory.decodeStream(a, null, bo); a.close();
        int sample = 1; while (Math.max(bo.outWidth, bo.outHeight) / sample > 2600) sample *= 2;
        BitmapFactory.Options o2 = new BitmapFactory.Options(); o2.inSampleSize = sample;
        InputStream b2 = getContentResolver().openInputStream(u); Bitmap bm = BitmapFactory.decodeStream(b2, null, o2); b2.close();
        if (bm == null) throw new Exception("decode");
        int rot = 0;
        try { InputStream e = getContentResolver().openInputStream(u); int ori = new ExifInterface(e).getAttributeInt(ExifInterface.TAG_ORIENTATION, 1); e.close(); rot = ori == 6 ? 90 : ori == 3 ? 180 : ori == 8 ? 270 : 0; } catch (Exception x) { }
        float sc = Math.min(1f, 1280f / Math.max(bm.getWidth(), bm.getHeight()));
        Matrix m = new Matrix(); m.postScale(sc, sc); if (rot != 0) m.postRotate(rot);
        Bitmap out = Bitmap.createBitmap(bm, 0, 0, bm.getWidth(), bm.getHeight(), m, true);
        int q = 82; byte[] bytes;
        do { ByteArrayOutputStream bs = new ByteArrayOutputStream(); out.compress(Bitmap.CompressFormat.JPEG, q, bs); bytes = bs.toByteArray(); q -= 12; } while (bytes.length > 900000 && q > 30);
        JSONObject o = new JSONObject(); o.put("mime", "image/jpeg"); o.put("data", Base64.encodeToString(bytes, Base64.NO_WRAP)); o.put("w", out.getWidth()); o.put("h", out.getHeight());
        return o.toString();
    }

    @Override
    public void onRequestPermissionsResult(int req, String[] perms, int[] res) {
        super.onRequestPermissionsResult(req, perms, res);
        boolean ok = res.length > 0 && res[0] == PackageManager.PERMISSION_GRANTED;
        if (req == PERM_MIC) js("window.__cb('mic'," + JSONObject.quote(ok ? "granted" : "denied") + ")");
        if (req == PERM_NOTIF) js("window.__cb('notif'," + JSONObject.quote(ok ? "granted" : "denied") + ")");
    }

    /** What the page can ask the phone to do. Network calls go through here, so no browser cross-site rules get in the way. */
    class Bridge {
        @JavascriptInterface
        public void http(final String id, final String method, final String url, final String headers, final String body) {
            pool.execute(() -> {
                Object[] r;
                try { r = Net.call(method, url, new JSONObject(headers == null || headers.isEmpty() ? "{}" : headers), body); } catch (Exception e) { r = new Object[]{0, String.valueOf(e.getMessage())}; }
                js("window.__http(" + JSONObject.quote(id) + "," + r[0] + "," + JSONObject.quote((String) r[1]) + ")");
            });
        }

        @JavascriptInterface
        public void openUrl(String url) {
            try { Uri u = Uri.parse(url); String sc = u.getScheme(); if ("https".equals(sc) || "steam".equals(sc)) startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception e) { }
        }

        @JavascriptInterface
        public void copy(String text) {
            ui.post(() -> { android.content.ClipboardManager cm = (android.content.ClipboardManager) getSystemService(CLIPBOARD_SERVICE); cm.setPrimaryClip(android.content.ClipData.newPlainText("SteamLite", text)); });
        }

        @JavascriptInterface
        public String version() { try { return getPackageManager().getPackageInfo(getPackageName(), 0).versionName; } catch (Exception e) { return "0.0.0"; } }

        /** The page gives us the sign-in token so the background check can look for new messages. Empty = signed out. */
        @JavascriptInterface
        public void setToken(String tok) {
            sp.edit().putString("token", tok == null ? "" : tok).apply();
            if (tok == null || tok.isEmpty()) { PollService.cancel(MainActivity.this); sp.edit().remove("n_req").apply(); } else PollService.schedule(MainActivity.this);
        }

        @JavascriptInterface
        public void setMuteAll(boolean on) { sp.edit().putBoolean("muteAll", on).apply(); }

        @JavascriptInterface
        public void askNotif() {
            ui.post(() -> {
                if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, PERM_NOTIF);
                else js("window.__cb('notif','granted')");
            });
        }

        @JavascriptInterface
        public void pickImage(final String id) {
            ui.post(() -> {
                pickId = id;
                Intent i = new Intent(Intent.ACTION_GET_CONTENT).setType("image/*").addCategory(Intent.CATEGORY_OPENABLE);
                try { startActivityForResult(Intent.createChooser(i, "Choose a photo"), REQ_PICK); } catch (Exception e) { js("window.__cb(" + JSONObject.quote(id) + ",null)"); }
            });
        }

        @JavascriptInterface
        public void recStart() {
            ui.post(() -> {
                if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) { requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, PERM_MIC); return; }
                try {
                    recFile = new File(getCacheDir(), "voice.m4a");
                    rec = new MediaRecorder();
                    rec.setAudioSource(MediaRecorder.AudioSource.MIC);
                    rec.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
                    rec.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
                    rec.setAudioEncodingBitRate(40000);
                    rec.setAudioSamplingRate(22050);
                    rec.setMaxDuration(60000);
                    rec.setOutputFile(recFile.getAbsolutePath());
                    rec.setOnInfoListener((mr, what, extra) -> { if (what == MediaRecorder.MEDIA_RECORDER_INFO_MAX_DURATION_REACHED) js("window.onRecLimit&&onRecLimit()"); });
                    rec.prepare(); rec.start(); recStart = System.currentTimeMillis();
                    js("window.__cb('mic','recording')");
                } catch (Exception e) { rec = null; js("window.__cb('mic','error')"); }
            });
        }

        /** Stops recording and hands the audio back through __cb('rec', json). cancel=true throws it away. */
        @JavascriptInterface
        public void recStop(final boolean cancel) {
            ui.post(() -> {
                if (rec == null) { js("window.__cb('rec',null)"); return; }
                final long ms = System.currentTimeMillis() - recStart;
                try { rec.stop(); } catch (Exception e) { cancel0(); js("window.__cb('rec',null)"); return; }
                rec.release(); rec = null;
                if (cancel || ms < 700) { js("window.__cb('rec',null)"); return; }
                pool.execute(() -> {
                    String out = "null";
                    try {
                        FileInputStream is = new FileInputStream(recFile); ByteArrayOutputStream bo = new ByteArrayOutputStream(); byte[] buf = new byte[16384]; int n;
                        while ((n = is.read(buf)) > 0) bo.write(buf, 0, n); is.close();
                        if (bo.size() < 900000) { JSONObject o = new JSONObject(); o.put("mime", "audio/mp4"); o.put("data", Base64.encodeToString(bo.toByteArray(), Base64.NO_WRAP)); o.put("ms", ms); out = o.toString(); }
                    } catch (Exception e) { }
                    js("window.__cb('rec'," + JSONObject.quote(out) + ")");
                });
            });
        }

        private void cancel0() { try { rec.release(); } catch (Exception e) { } rec = null; }

        @JavascriptInterface
        public void haptic(String kind) {
            ui.post(() -> {
                int c = "heavy".equals(kind) ? HapticFeedbackConstants.LONG_PRESS : (Build.VERSION.SDK_INT >= 30 && "ok".equals(kind)) ? HapticFeedbackConstants.CONFIRM : HapticFeedbackConstants.KEYBOARD_TAP;
                web.performHapticFeedback(c);
            });
        }

        /** Colours the status and navigation bars to match the page's theme. */
        @JavascriptInterface
        public void setBars(final String hex, final boolean lightBackground) {
            ui.post(() -> {
                try {
                    int c = Color.parseColor(hex);
                    getWindow().setStatusBarColor(c); getWindow().setNavigationBarColor(c);
                    View d = getWindow().getDecorView(); int f = d.getSystemUiVisibility();
                    f = lightBackground ? (f | View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | (Build.VERSION.SDK_INT >= 26 ? View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR : 0)) : (f & ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR & ~(Build.VERSION.SDK_INT >= 26 ? View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR : 0));
                    d.setSystemUiVisibility(f);
                    web.setBackgroundColor(c);
                } catch (Exception e) { }
            });
        }

        @JavascriptInterface
        public boolean canLock() { KeyguardManager km = (KeyguardManager) getSystemService(KEYGUARD_SERVICE); return km != null && km.isDeviceSecure(); }

        @JavascriptInterface
        public void setLock(boolean on) { sp.edit().putBoolean("lock", on).apply(); }

        @JavascriptInterface
        public String takeCrash() { String c = sp.getString("crash", ""); if (!c.isEmpty()) sp.edit().remove("crash").apply(); return c; }

        @JavascriptInterface
        public void unlock() { ui.post(() -> { if (!locking) askLock(); }); }

        @JavascriptInterface
        public void exit() { ui.post(() -> finish()); }
    }
}
