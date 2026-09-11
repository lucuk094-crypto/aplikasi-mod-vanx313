package com.vanmod.store

import android.content.Intent
import androidx.core.content.FileProvider
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.io.File

class MainActivity : FlutterActivity() {
    private val channel = "vanmod.store/install"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, channel).setMethodCallHandler { call, result ->
            if (call.method == "openFile") {
                val path = call.argument<String>("path")
                if (path.isNullOrEmpty()) {
                    result.error("ARG", "Missing path", null)
                    return@setMethodCallHandler
                }
                try {
                    openFile(path)
                    result.success(true)
                } catch (e: Exception) {
                    result.error("OPEN_FAILED", e.message, null)
                }
            } else {
                result.notImplemented()
            }
        }
    }

    private fun openFile(path: String) {
        val file = File(path)
        val uri = FileProvider.getUriForFile(
            this,
            "${applicationContext.packageName}.vanmod.fileprovider",
            file,
        )
        val mime = when (file.extension.lowercase()) {
            "apk" -> "application/vnd.android.package-archive"
            "xapk", "apks" -> "application/vnd.android.package-archive"
            "zip" -> "application/zip"
            else -> "*/*"
        }
        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, mime)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        startActivity(intent)
    }
}
