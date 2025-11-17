import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function Gallery({ albumId }) {
  const [album, setAlbum] = useState(null);

  useEffect(() => {
    async function load() {
      const res = await api.get(`albums/${albumId}/`);
      setAlbum(res.data);
    }
    load();
  }, [albumId]);

  if (!album) return <div>Loading...</div>;

  return (
    <div>
      <h2>{album.title}</h2>

      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {album.photos.map((photo) => (
          <div key={photo.id} style={{ margin: 10 }}>
            <img
              src={`https://${process.env.REACT_APP_AZURE_ACCOUNT_NAME}.blob.core.windows.net/${process.env.REACT_APP_AZURE_CONTAINER}/${photo.blob_path}`}
              alt={photo.filename}
              width="200"
            />
            <p>{photo.filename}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
