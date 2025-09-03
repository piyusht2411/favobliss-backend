import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
const cloudName = "dgcksrb1n";
const apiKey = "225158414381951";
const apiSecret = "uR-CTktbDCbmuh39hbL-8aTiXb8";


// Check environment variables at startup
if (!cloudName || !apiKey || !apiSecret) {
  console.error("Missing Cloudinary environment variables:", {
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret ? "****" : undefined,
  });
  throw new Error(
    "Cloudinary configuration failed. Please check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file."
  );
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

export async function POST(req: Request) {
  console.log("API Route: Starting POST request");
  try {
    console.log("API Route: Cloudinary Config", {
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret ? "****" : undefined,
    });

    console.log("API Route: Parsing formData");
    const formData = await req.formData();
    const file = formData.get("image") as File;
    console.log("API Route: File received", file ? file.name : "No file");

    if (!file) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed." },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: "File size exceeds 5MB limit." },
        { status: 400 }
      );
    }

    console.log("API Route: Converting file to base64");
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = buffer.toString("base64");
    const dataUri = `data:${file.type};base64,${base64Image}`;

    console.log("API Route: Uploading to Cloudinary");
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "product-images",
      public_id: `${Date.now()}-${file.name}`,
    });

    console.log("API Route: Upload successful", result.secure_url);
    const imageUrl = result.secure_url;
    return NextResponse.json({ url: imageUrl }, { status: 200 });
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}