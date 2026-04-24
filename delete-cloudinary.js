// api/delete-cloudinary.js
// Vercel Serverless Function — hapus foto dari Cloudinary pakai API Secret (signed)

const https = require('https');
const crypto = require('crypto');
const querystring = require('querystring');

module.exports = async function handler(req, res) {
  // Hanya izinkan POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { public_id } = req.body;
  if (!public_id) {
    return res.status(400).json({ error: 'public_id wajib diisi' });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(500).json({ error: 'Konfigurasi Cloudinary belum lengkap' });
  }

  try {
    // Buat signature untuk signed delete
    const timestamp = Math.round(Date.now() / 1000);
    const toSign    = `public_id=${public_id}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(toSign).digest('hex');

    // Kirim request ke Cloudinary
    const formData = querystring.stringify({
      public_id,
      timestamp,
      api_key:   apiKey,
      signature,
    });

    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.cloudinary.com',
        path:     `/v1_1/${cloudName}/image/destroy`,
        method:   'POST',
        headers:  {
          'Content-Type':   'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(formData),
        },
      };

      const reqCloud = https.request(options, (resCloud) => {
        let data = '';
        resCloud.on('data', chunk => data += chunk);
        resCloud.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch(e) { reject(new Error('Response Cloudinary tidak valid')); }
        });
      });

      reqCloud.on('error', reject);
      reqCloud.write(formData);
      reqCloud.end();
    });

    if (result.result === 'ok') {
      return res.status(200).json({ success: true, result: result.result });
    } else {
      return res.status(400).json({ success: false, result: result.result });
    }

  } catch (err) {
    console.error('[delete-cloudinary] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
