import java.util.Properties

plugins {
    id("com.android.application")
    // push notifications: the plugin reads app/google-services.json (not in the public repo)
    id("com.google.gms.google-services")
}

// release signing: the key lives in ../signing (never uploaded). Updates only install over an earlier
// version when they are signed with the SAME key, so keep a backup of that folder.
val keyProps = Properties().apply {
    val f = rootProject.file("signing/keystore.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}

android {
    namespace = "com.steamlite.mobile"
    compileSdk {
        version = release(36)
    }

    defaultConfig {
        applicationId = "com.steamlite.mobile"
        minSdk = 26
        targetSdk = 36
        versionCode = 3
        versionName = "1.1.0"
    }

    signingConfigs {
        if (keyProps.containsKey("storeFile")) {
            create("release") {
                storeFile = rootProject.file("signing/" + File(keyProps.getProperty("storeFile")).name)
                storePassword = keyProps.getProperty("storePassword")
                keyAlias = keyProps.getProperty("keyAlias")
                keyPassword = keyProps.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            if (keyProps.containsKey("storeFile")) signingConfig = signingConfigs.getByName("release")
        }
    }
    lint {
        checkReleaseBuilds = false
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
}

dependencies {
    implementation(platform("com.google.firebase:firebase-bom:35.0.0"))
    implementation("com.google.firebase:firebase-messaging")
}

