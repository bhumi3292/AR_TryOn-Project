import fs from 'fs';
import path from 'path';

const callMLService = async (localFilePath, userId, productId, category) => {
    if (!localFilePath || !productId) {
        console.error("❌ ML Service Error: Missing localFilePath or productId");
        return null;
    }

    try {
        const fileBuffer = fs.readFileSync(localFilePath);
        const fileName = path.basename(localFilePath);
        const fileBlob = new Blob([fileBuffer], { type: 'image/png' });

        const formData = new FormData();
        formData.append('file', fileBlob, fileName);
        formData.append('user_id', userId?.toString() || "");
        formData.append('product_id', productId.toString());
        formData.append('category', category || "necklace"); // Pass category

        console.log(`🚀 Sending ${category} [${productId}] to ML Service...`);

        const res = await fetch('http://127.0.0.1:8000/convert-2d-to-3d', {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) {
            const errorTxt = await res.text();
            console.error('❌ ML Service returned error:', res.status, errorTxt);
            return null;
        }

        const json = await res.json();
        console.log('✅ ML Service received the request successfully.');
        return json.model3DPath || null;
    } catch (err) {
        console.error('❌ Failed to connect to ML service. Error Details:', err.message);
        return null;
    }
};

export default callMLService;