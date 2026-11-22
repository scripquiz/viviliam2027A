package com.viviliam.app;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // The Capacitor SplashScreen plugin installs and manages the
        // Android 12+ splash screen itself (see SplashScreen.showOnLaunch).
        // Installing a second handler here with a false keep-on-screen
        // condition conflicts with it and dismisses the splash immediately.
        super.onCreate(savedInstanceState);
        WindowCompat.enableEdgeToEdge(getWindow());
    }
}