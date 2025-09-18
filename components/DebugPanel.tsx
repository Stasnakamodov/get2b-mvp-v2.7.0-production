import React from 'react';

export function DebugPanel({ data }: { data: any }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100%',
      background: '#222',
      color: '#fff',
      fontSize: 12,
      zIndex: 9999,
      maxHeight: 220,
      overflow: 'auto',
      padding: 8,
      borderTop: '2px solid #444',
      fontFamily: 'monospace',
    }}>
      <strong>DEBUG:</strong>
      <pre style={{ margin: 0 }}>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
} 