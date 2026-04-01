/* filebase.js — Filebase (S3-compatible) upload/delete using SubtleCrypto SigV4 */
const FilebaseService = (() => {
  const enc = new TextEncoder();

  async function hmac(key, data) {
    const k = await crypto.subtle.importKey('raw', typeof key === 'string' ? enc.encode(key) : key,
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(data)));
  }

  async function sha256hex(data) {
    const buf = typeof data === 'string' ? enc.encode(data) : data;
    return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', buf)))
      .map(b => b.toString(16).padStart(2,'0')).join('');
  }

  function isoDate(d) { return d.toISOString().replace(/[:-]/g, '').replace(/\.\d{3}/,''); }
  function shortDate(d) { return isoDate(d).slice(0, 8); }

  async function getSignedHeaders(method, key, contentType, bodyHash, extraHeaders = {}) {
    const { apiKey, apiSecret, bucketName, region } = CONFIG.filebase;
    const now = new Date();
    const amzDate  = isoDate(now);
    const dateStamp = shortDate(now);
    const host = `${bucketName}.s3.filebase.com`;
    const service = 's3';
    const scope = `${dateStamp}/${region}/${service}/aws4_request`;

    const headers = {
      host,
      'x-amz-content-sha256': bodyHash,
      'x-amz-date': amzDate,
      ...extraHeaders
    };
    if (contentType) headers['content-type'] = contentType;

    const sortedKeys = Object.keys(headers).sort();
    const canonicalHeaders = sortedKeys.map(k => `${k}:${headers[k]}\n`).join('');
    const signedHeadersList = sortedKeys.join(';');

    const encodedKey = encodeURIComponent(key).replace(/%2F/g, '/');
    const canonicalRequest = [method, '/' + encodedKey, '',
      canonicalHeaders, signedHeadersList, bodyHash].join('\n');

    const strToSign = ['AWS4-HMAC-SHA256', amzDate, scope,
      await sha256hex(canonicalRequest)].join('\n');

    let signingKey = await hmac('AWS4' + apiSecret, dateStamp);
    signingKey = await hmac(signingKey, region);
    signingKey = await hmac(signingKey, service);
    signingKey = await hmac(signingKey, 'aws4_request');

    const sigHex = Array.from(await hmac(signingKey, strToSign))
      .map(b => b.toString(16).padStart(2,'0')).join('');

    const authHeader = `AWS4-HMAC-SHA256 Credential=${apiKey}/${scope},SignedHeaders=${signedHeadersList},Signature=${sigHex}`;

    const reqHeaders = {};
    sortedKeys.forEach(k => reqHeaders[k] = headers[k]);
    reqHeaders['Authorization'] = authHeader;
    delete reqHeaders['host'];
    return reqHeaders;
  }

  function bucketUrl(key) {
    const { bucketName } = CONFIG.filebase;
    return `https://${bucketName}.s3.filebase.com/${encodeURIComponent(key).replace(/%2F/g,'/')}`;
  }

  function publicUrl(key) { return bucketUrl(key); }

  function normalizeFolder(folder) {
    const raw = String(folder || '').trim().replace(/^\/+|\/+$/g, '');
    if (!raw) throw new Error('Upload folder is required.');

    // Keep compatibility with older callers while enforcing standardized folders.
    const legacyMap = {
      'assets/images': 'image-assets/products',
      'assets/models': 'model-assets/products'
    };
    return legacyMap[raw] || raw;
  }

  async function getPresignedUrl(key) {
    const { apiKey, apiSecret, bucketName, region } = CONFIG.filebase;
    if (!key) return '';
    const now = new Date();
    const amzDate = isoDate(now);
    const dateStamp = shortDate(now);
    const host = `${bucketName}.s3.filebase.com`;
    const service = 's3';
    const scope = `${dateStamp}/${region}/${service}/aws4_request`;
    const expires = '3600';
    
    const encodedKey = encodeURIComponent(key).replace(/%2F/g, '/');
    const cred = encodeURIComponent(`${apiKey}/${scope}`);
    
    const queryParams = [
      `X-Amz-Algorithm=AWS4-HMAC-SHA256`,
      `X-Amz-Credential=${cred}`,
      `X-Amz-Date=${amzDate}`,
      `X-Amz-Expires=${expires}`,
      `X-Amz-SignedHeaders=host`
    ];
    const canonicalQueryString = queryParams.join('&');
    const canonicalHeaders = `host:${host}\n`;
    const signedHeadersList = 'host';
    const payloadHash = 'UNSIGNED-PAYLOAD';
    
    const canonicalRequest = ['GET', '/' + encodedKey, canonicalQueryString, canonicalHeaders, signedHeadersList, payloadHash].join('\n');
    const strToSign = ['AWS4-HMAC-SHA256', amzDate, scope, await sha256hex(canonicalRequest)].join('\n');
    let signingKey = await hmac('AWS4' + apiSecret, dateStamp);
    signingKey = await hmac(signingKey, region);
    signingKey = await hmac(signingKey, service);
    signingKey = await hmac(signingKey, 'aws4_request');
    const sigHex = Array.from(await hmac(signingKey, strToSign)).map(b => b.toString(16).padStart(2,'0')).join('');
      
    return `https://${host}/${encodedKey}?${canonicalQueryString}&X-Amz-Signature=${sigHex}`;
  }

  async function uploadFile(file, folder) {
    const safeFolder = normalizeFolder(folder);
    const key  = `${safeFolder}/${Date.now()}_${file.name.replace(/\s+/g,'_')}`;
    const body = await file.arrayBuffer();
    const hash = await sha256hex(body);
    const contentType = file.type || 'application/octet-stream';
    const headers = await getSignedHeaders('PUT', key, contentType, hash);
    headers['content-type'] = contentType;
    headers['x-amz-content-sha256'] = hash;
    try {
      const res = await fetch(bucketUrl(key), {
        method: 'PUT',
        headers,
        body: new Uint8Array(body)
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
      return { key, url: publicUrl(key) };
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error(
          'Upload blocked by browser/network (possible CORS). Add your local origin to Filebase bucket CORS AllowedOrigins and allow PUT, GET, HEAD, OPTIONS.'
        );
      }
      throw error;
    }
  }

  async function deleteFile(key) {
    const hash = await sha256hex('');
    const headers = await getSignedHeaders('DELETE', key, null, hash);
    headers['x-amz-content-sha256'] = hash;
    const res = await fetch(bucketUrl(key), { method: 'DELETE', headers });
    if (!res.ok && res.status !== 204) throw new Error(`Delete failed: ${res.status}`);
    return true;
  }

  async function listFiles(prefix) {
    const { bucketName } = CONFIG.filebase;
    const hash = await sha256hex('');
    const now  = new Date();
    const amzDate   = isoDate(now);
    const dateStamp = shortDate(now);
    const region    = CONFIG.filebase.region;
    const service   = 's3';
    const scope     = `${dateStamp}/${region}/${service}/aws4_request`;
    const host      = `${bucketName}.s3.filebase.com`;
    const encodedPrefix = encodeURIComponent(prefix);
    const query     = `list-type=2&prefix=${encodedPrefix}`;

    const canonicalRequest = [
      'GET', '/', query,
      `host:${host}\nx-amz-content-sha256:${hash}\nx-amz-date:${amzDate}\n`,
      'host;x-amz-content-sha256;x-amz-date', hash
    ].join('\n');

    const strToSign = ['AWS4-HMAC-SHA256', amzDate, scope,
      await sha256hex(canonicalRequest)].join('\n');

    let signingKey = await hmac('AWS4' + CONFIG.filebase.apiSecret, dateStamp);
    signingKey = await hmac(signingKey, region);
    signingKey = await hmac(signingKey, service);
    signingKey = await hmac(signingKey, 'aws4_request');
    const sigHex = Array.from(await hmac(signingKey, strToSign))
      .map(b => b.toString(16).padStart(2,'0')).join('');

    const authHeader = `AWS4-HMAC-SHA256 Credential=${CONFIG.filebase.apiKey}/${scope},SignedHeaders=host;x-amz-content-sha256;x-amz-date,Signature=${sigHex}`;

    const res = await fetch(`https://${host}/?${query}`, {
      headers: { 'Authorization': authHeader, 'x-amz-content-sha256': hash, 'x-amz-date': amzDate }
    });
    if (!res.ok) throw new Error(`List failed: ${res.status}`);
    const xml = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    return Array.from(doc.querySelectorAll('Contents')).map(el => ({
      key:          el.querySelector('Key')?.textContent,
      size:         parseInt(el.querySelector('Size')?.textContent || '0'),
      lastModified: el.querySelector('LastModified')?.textContent,
      url:          publicUrl(el.querySelector('Key')?.textContent)
    }));
  }

  return { uploadFile, deleteFile, listFiles, publicUrl, getPresignedUrl };
})();
