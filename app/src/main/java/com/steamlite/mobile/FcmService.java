package com.steamlite.mobile;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

/** Receives push messages from SteamLite Online (through Firebase) and turns them into notifications. */
public class FcmService extends FirebaseMessagingService {
    @Override
    public void onNewToken(String token) { Push.register(getApplicationContext(), token); }

    @Override
    public void onMessageReceived(RemoteMessage m) {
        try { Notify.show(getApplicationContext(), m.getData()); } catch (Exception e) { }
    }
}
