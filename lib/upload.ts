import { v2 as cloudinary } from "cloudinary";

// 配置 Cloudinary（从环境变量读取）
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * 上传文件到 Cloudinary
 * @param file - File 对象
 * @param folder - 文件夹名称（"videos" / "thumbnails" / "images"）
 * @returns { url, publicId }
 */
export async function uploadFile(
  file: File,
  folder: "videos" | "thumbnails" | "images"
): Promise<{ url: string; publicId: string }> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const isVideo = folder === "videos";

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `dance-calendar/${folder}`,
        resource_type: isVideo ? "video" : "image",
        // 视频转成 mp4，图片保持质量
        ...(isVideo
          ? { format: "mp4", quality: "auto" }
          : { format: "jpg", quality: "auto:good" }),
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary 上传失败: ${error.message}`));
        } else if (result) {
          resolve({ url: result.secure_url, publicId: result.public_id });
        } else {
          reject(new Error("Cloudinary 上传返回为空"));
        }
      }
    );

    // 写入 buffer 到上传流
    uploadStream.write(buffer);
    uploadStream.end();
  });
}

/**
 * 从 Cloudinary 删除文件
 * @param publicId - Cloudinary 的 public ID
 */
export async function deleteFile(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary 删除失败:", error);
  }
}
