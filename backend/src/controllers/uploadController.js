import cloudinary from '../config/cloudinary.js';

// @desc    Upload any file (image/pdf) to Cloudinary and return URL
// @route   POST /api/upload
// @access  Private
export const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file provided" });
        }

        // Logic: Create a Promise wrapper around the Cloudinary stream
        const uploadToCloudinary = (buffer) => {
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        resource_type: "auto", // Auto-detect: image, video, or raw (pdf, doc)
                        folder: "uni_connect_chat_files",
                    },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                );
                uploadStream.end(buffer);
            });
        };

        const result = await uploadToCloudinary(req.file.buffer);

        res.status(200).json({
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            resource_type: result.resource_type,
            original_filename: req.file.originalname
        });

    } catch (error) {
        console.error("Upload Controller Error:", error);
        res.status(500).json({ message: "File upload failed", error: error.message });
    }
};