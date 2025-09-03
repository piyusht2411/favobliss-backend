import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: "dgcksrb1n",
  api_key: "225158414381951",
  api_secret: "uR-CTktbDCbmuh39hbL-8aTiXb8",
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("video") as File;

    if (!file) {
      return new NextResponse("No video file provided", { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "video",
          folder: "product_videos",
          chunk_size: 6000000, // 6MB chunks for large files
          eager: [{ quality: "auto", fetch_format: "auto" }],
          eager_async: true,
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json({ url: (result as any).secure_url });
  } catch (error) {
    console.error("[VIDEO_UPLOAD]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
