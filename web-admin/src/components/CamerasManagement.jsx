import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SafeIcon from './SafeIcon';
import camerasService from '../services/camerasService';
import { getCameraSnapshotProxyPath } from '../config/cameras';
import './CamerasManagement.css';

const SNAPSHOT_REFRESH_MS = 1000;

function formatDateTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-BR');
  } catch {
    return iso;
  }
}

const CamerasManagement = () => {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [snapshotSrc, setSnapshotSrc] = useState(null);
  const [snapshotError, setSnapshotError] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const snapshotObjectUrlRef = useRef(null);

  const selectedCamera = useMemo(
    () => cameras.find((c) => c.id === selectedId) || null,
    [cameras, selectedId]
  );

  const revokeSnapshotUrl = useCallback(() => {
    if (snapshotObjectUrlRef.current) {
      URL.revokeObjectURL(snapshotObjectUrlRef.current);
      snapshotObjectUrlRef.current = null;
    }
  }, []);

  const loadCameras = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await camerasService.getCameras();
      setCameras(list);
      setSelectedId((current) => {
        if (current && list.some((c) => c.id === current)) return current;
        return list.length > 0 ? list[0].id : null;
      });
    } catch (err) {
      setError(err.message || 'Não foi possível carregar as câmeras.');
      setCameras([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSnapshot = useCallback(async (cameraId) => {
    if (!cameraId) return;

    try {
      setSnapshotLoading(true);
      setSnapshotError(false);
      const blob = await camerasService.fetchSnapshotBlob(cameraId);
      revokeSnapshotUrl();
      const objectUrl = URL.createObjectURL(blob);
      snapshotObjectUrlRef.current = objectUrl;
      setSnapshotSrc(objectUrl);
    } catch (err) {
      console.error('Erro ao carregar snapshot:', err);
      revokeSnapshotUrl();
      setSnapshotSrc(null);
      setSnapshotError(true);
    } finally {
      setSnapshotLoading(false);
    }
  }, [revokeSnapshotUrl]);

  useEffect(() => {
    loadCameras();
    return () => revokeSnapshotUrl();
  }, [loadCameras, revokeSnapshotUrl]);

  useEffect(() => {
    if (!selectedId) {
      revokeSnapshotUrl();
      setSnapshotSrc(null);
      return undefined;
    }

    loadSnapshot(selectedId);

    if (!autoRefresh) return undefined;

    const timer = setInterval(() => {
      loadSnapshot(selectedId);
    }, SNAPSHOT_REFRESH_MS);

    return () => clearInterval(timer);
  }, [selectedId, autoRefresh, loadSnapshot, revokeSnapshotUrl]);

  const handleSelectCamera = (camera) => {
    setSelectedId(camera.id);
    setSnapshotError(false);
  };

  return (
    <div className="cameras-management">
      <div className="cameras-content">
        <header className="cameras-header">
          <div>
            <h2>Câmeras</h2>
            <p className="cameras-subtitle">
              Monitoramento via snapshots em tempo quase real (proxy seguro via API)
            </p>
          </div>
          <button type="button" className="cameras-refresh-btn" onClick={loadCameras}>
            <SafeIcon name="refresh" size={18} color="#fff" style={{ marginRight: 8 }} />
            Atualizar lista
          </button>
        </header>

        {loading ? (
          <div className="cameras-state">
            <div className="cameras-spinner" />
            <p>Carregando câmeras...</p>
          </div>
        ) : error ? (
          <div className="cameras-state cameras-state-error">
            <SafeIcon name="warning" size={48} color="#f59e0b" />
            <p>{error}</p>
            <button type="button" className="cameras-retry-btn" onClick={loadCameras}>
              Tentar novamente
            </button>
          </div>
        ) : (
          <div className="cameras-layout">
            <aside className="cameras-list-panel">
              <h3 className="cameras-list-title">
                {cameras.length} câmera{cameras.length !== 1 ? 's' : ''}
              </h3>
              {cameras.length === 0 ? (
                <p className="cameras-empty">Nenhuma câmera cadastrada.</p>
              ) : (
                <ul className="cameras-list">
                  {cameras.map((camera) => {
                    const active = camera.id === selectedId;
                    return (
                      <li key={camera.id}>
                        <button
                          type="button"
                          className={`cameras-list-item${active ? ' active' : ''}`}
                          onClick={() => handleSelectCamera(camera)}
                        >
                          <span className="cameras-list-item-icon">
                            <SafeIcon name="videocam" size={22} color={active ? '#fff' : '#536173'} />
                          </span>
                          <span className="cameras-list-item-body">
                            <span className="cameras-list-item-name">{camera.name || camera.id}</span>
                            <span className="cameras-list-item-id">{camera.id}</span>
                          </span>
                          <span
                            className={`cameras-status-badge${camera.enabled ? ' on' : ' off'}`}
                          >
                            {camera.enabled ? 'Ativa' : 'Inativa'}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </aside>

            <section className="cameras-viewer-panel">
              {!selectedCamera ? (
                <div className="cameras-viewer-empty">
                  <SafeIcon name="videocam" size={64} color="#9ca3af" />
                  <p>Selecione uma câmera para ver a imagem ao vivo</p>
                </div>
              ) : (
                <>
                  <div className="cameras-viewer-toolbar">
                    <div>
                      <h3>{selectedCamera.name || selectedCamera.id}</h3>
                      <p className="cameras-viewer-meta">
                        Atualizado: {formatDateTime(selectedCamera.updated_at)}
                      </p>
                    </div>
                    <label className="cameras-auto-refresh">
                      <input
                        type="checkbox"
                        checked={autoRefresh}
                        onChange={(e) => setAutoRefresh(e.target.checked)}
                      />
                      Atualizar a cada 1s
                    </label>
                    <button
                      type="button"
                      className="cameras-snapshot-btn"
                      onClick={() => loadSnapshot(selectedCamera.id)}
                      disabled={snapshotLoading}
                    >
                      {snapshotLoading ? 'Carregando...' : 'Capturar agora'}
                    </button>
                  </div>

                  <div className="cameras-viewer-frame">
                    {snapshotError ? (
                      <div className="cameras-viewer-error">
                        <SafeIcon name="warning" size={40} color="#f59e0b" />
                        <p>Não foi possível carregar a imagem desta câmera.</p>
                        <button
                          type="button"
                          className="cameras-retry-btn"
                          onClick={() => loadSnapshot(selectedCamera.id)}
                        >
                          Tentar novamente
                        </button>
                      </div>
                    ) : snapshotSrc ? (
                      <img
                        src={snapshotSrc}
                        alt={`Câmera ${selectedCamera.name || selectedCamera.id}`}
                        className="cameras-snapshot-img"
                      />
                    ) : (
                      <div className="cameras-viewer-empty">
                        <div className="cameras-spinner" />
                        <p>Carregando imagem...</p>
                      </div>
                    )}
                  </div>

                  <p className="cameras-viewer-url">{getCameraSnapshotProxyPath(selectedCamera.id)}</p>
                </>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default CamerasManagement;
