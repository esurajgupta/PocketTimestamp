package com.pockettimestamp.mediastore

import android.content.ContentValues
import android.content.Context
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import com.facebook.react.bridge.*
import java.io.File
import java.io.FileInputStream
import java.io.OutputStream

class MediaStoreModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "MediaStoreModule"

    @ReactMethod
    fun saveVideoToGallery(path: String, promise: Promise) {
        try {
            val file = File(path)
            if (!file.exists()) {
                promise.reject("ENOENT", "File not found at $path")
                return
            }

            val values = ContentValues().apply {
                put(MediaStore.Video.Media.DISPLAY_NAME, file.name)
                put(MediaStore.Video.Media.MIME_TYPE, "video/mp4")
                put(MediaStore.Video.Media.RELATIVE_PATH, "DCIM/Camera")
            }

            val resolver = reactApplicationContext.contentResolver
            val uri: Uri? =
                resolver.insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, values)

            if (uri != null) {
                resolver.openOutputStream(uri).use { out: OutputStream? ->
                    FileInputStream(file).use { input ->
                        input.copyTo(out!!)
                    }
                }
                promise.resolve(uri.toString())
            } else {
                promise.reject("EINSERT", "Failed to insert video into MediaStore")
            }
        } catch (e: Exception) {
            promise.reject("EWRITE", "Error saving video: ${e.localizedMessage}")
        }
    }
}
