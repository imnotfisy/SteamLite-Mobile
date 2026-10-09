package com.steamlite.mobile;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

/** Home-screen widget: how many friends are online and who they are. */
public class FriendsWidget extends AppWidgetProvider {
    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) { for (int id : ids) draw(c, m, id); }

    static void draw(Context c, AppWidgetManager m, int id) {
        SharedPreferences sp = c.getSharedPreferences("sl", Context.MODE_PRIVATE);
        boolean signedIn = !sp.getString("token", "").isEmpty();
        int n = sp.getInt("fw_n", 0); String names = sp.getString("fw_names", "");
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_friends);
        v.setTextViewText(R.id.f_count, !signedIn ? "-" : String.valueOf(n));
        v.setTextViewText(R.id.f_label, !signedIn ? "Open SteamLite to sign in" : n == 1 ? "friend online" : "friends online");
        v.setTextViewText(R.id.f_names, !signedIn ? "" : n == 0 ? "Nobody is on right now" : names);
        Intent i = new Intent(c, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP).putExtra("open", "#tab:friends");
        v.setOnClickPendingIntent(R.id.f_root, PendingIntent.getActivity(c, 1, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        m.updateAppWidget(id, v);
    }

    static void set(Context c, int online, String names) {
        c.getSharedPreferences("sl", Context.MODE_PRIVATE).edit().putInt("fw_n", online).putString("fw_names", names).apply();
        try { AppWidgetManager m = AppWidgetManager.getInstance(c); for (int id : m.getAppWidgetIds(new ComponentName(c, FriendsWidget.class))) draw(c, m, id); } catch (Exception e) { }
    }
}
