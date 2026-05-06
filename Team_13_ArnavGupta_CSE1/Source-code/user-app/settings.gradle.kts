import java.util.Properties

// Auto-detect Android SDK and write to local.properties if missing or invalid
run {
    val localPropsFile = file("local.properties")
    val props = Properties().apply { if (localPropsFile.exists()) load(localPropsFile.inputStream()) }
    val currentSdkDir = props.getProperty("sdk.dir")

    if (currentSdkDir == null || !file(currentSdkDir).exists()) {
        val home = System.getProperty("user.home") ?: ""
        val os = System.getProperty("os.name", "").lowercase()

        val candidates: List<String> = when {
            os.contains("win") -> listOfNotNull(
                System.getenv("ANDROID_HOME"),
                System.getenv("ANDROID_SDK_ROOT"),
                System.getenv("LOCALAPPDATA")?.let { "$it\\Android\\Sdk" },
                "$home\\AppData\\Local\\Android\\Sdk"
            )
            os.contains("mac") -> listOfNotNull(
                System.getenv("ANDROID_HOME"),
                System.getenv("ANDROID_SDK_ROOT"),
                "$home/Library/Android/sdk"
            )
            else -> listOfNotNull(
                System.getenv("ANDROID_HOME"),
                System.getenv("ANDROID_SDK_ROOT"),
                "$home/Android/Sdk"
            )
        }

        val detected = candidates.firstOrNull { it.isNotBlank() && file(it).exists() }
            ?: throw GradleException(
                "Android SDK not found. Set the ANDROID_HOME environment variable or add sdk.dir to local.properties."
            )

        props["sdk.dir"] = detected
        localPropsFile.writer().use { props.store(it, "Auto-generated — do not commit") }
        println("[setup] Android SDK auto-detected: $detected")
    }
}

pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "studylab"
include(":app")
 