# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Preserve the WebView JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep Capacitor and Cordova plugins
-keep class com.getcapacitor.** { *; }
-keep class org.apache.cordova.** { *; }

# Keep SQLite related classes
-keep class org.sqlite.** { *; }
-keep class org.sqlite.database.** { *; }
-keep class net.sqlcipher.** { *; }
-keep class net.sqlcipher.database.** { *; }
-keep class androidx.sqlite.** { *; }
-keep class androidx.sqlite.db.** { *; }

# Preserve all native method names and the names of their classes
-keepclasseswithmembernames class * {
    native <methods>;
}

# Preserve Capacitor bridge - enhanced rules
-keep public class * extends com.getcapacitor.Plugin
-keep public class * extends com.getcapacitor.PluginMethod
-keep public class * extends com.getcapacitor.annotation.CapacitorPlugin
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * {
  @com.getcapacitor.annotation.CapacitorPlugin *;
  @com.getcapacitor.PluginMethod public <methods>;
}

# Preserve social sharing plugin classes
-keep class nl.xservices.plugins.** { *; }

# Preserve line numbers for debugging
-keepattributes SourceFile,LineNumberTable

# Keep JavaScript interfaces
-keepattributes JavascriptInterface
-keepattributes *Annotation*

# Keep app version classes
-keep class org.apache.cordova.appversion.** { *; }

# Maintain enums
-keepclassmembers class * extends java.lang.Enum {
    <fields>;
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep Ionic/Angular specific entries
-keep class io.ionic.** { *; }

# Keep WebView events
-keepclassmembers class * extends android.webkit.WebViewClient {
    public void *(android.webkit.WebView, java.lang.String, android.graphics.Bitmap);
    public boolean *(android.webkit.WebView, java.lang.String);
}

# Keep all JavaScript interface implementations
-keep public class * extends android.webkit.WebChromeClient

# Keep any classes accessed via reflection
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep specific plugins that might be causing issues
# These common plugins often need explicit rules
-keep class org.apache.cordova.file.** { *; }
-keep class org.apache.cordova.filetransfer.** { *; }
-keep class com.ionicframework.** { *; }
-keep class com.silkimen.** { *; }
-keep class de.appplant.** { *; }
-keep class plugin.** { *; }

# Keep JSInterface and serialization related attributes
-keepattributes Signature

# Hide original source file name
-renamesourcefileattribute SourceFile

# Handle missing Error Prone annotations (common issue with certain dependencies)
-keep class com.google.errorprone.annotations.** { *; }
-dontwarn com.google.errorprone.annotations.CanIgnoreReturnValue
-dontwarn com.google.errorprone.annotations.CheckReturnValue
-dontwarn com.google.errorprone.annotations.Immutable
-dontwarn com.google.errorprone.annotations.RestrictedApi
-dontwarn javax.annotation.Nullable
-dontwarn javax.annotation.concurrent.GuardedBy