import React, { useState } from "react";
import api from "../services/api";

export default function Uploader({ albumId }) {
  const [file, setFile] = useState(null);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Select a file first!");

    // STEP 1 — Ask backend for SAS upload URL
    const presignRes = await api.post("photos/create_sas/", {
      filename: file.name,
      content_type: file.type,
      album: albumId,
    });

    const uploadUrl = presignRes.data.upload_url;
    const blobPath = presignRes.data.blob_path;

    // STEP 2 — Upload directly to Azure Blob Storage
    await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "x-ms-blob-type": "BlockBlob",
        "Content-Type": file.type,
      },
      body: file,
    });

    // STEP 3 — Create database entry in Django
    await api.post("photos/", {
      album: albumId,
      blob_path: blobPath,
      filename: file.name,
      metadata: {},
    });

    alert("Upload successful!");
  };

  return (
    <form onSubmit={handleUpload}>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button type="submit">Upload</button>
    </form>
  );
}
