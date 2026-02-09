import React from 'react';

export default function TrailsSection({ nodes, navigate }) {
  return (
    <div className="page container">
      <h2 className="title">Trilhas de Aprendizado</h2>
      <p className="subtitle">Complete os módulos para ganhar XP e subir de nível.</p>
      
      <div className="trail-map" style={{ marginTop: 20 }}>
        {nodes.map((node, index) => (
          <div 
            key={node} 
            className={`trail-node ${index === 0 ? 'completed' : ''}`}
            onClick={() => navigate('/aula')}
            style={{ cursor: 'pointer' }}
          >
            <div className="title" style={{ fontSize: 16 }}>{node}</div>
            <div className="subtitle">{index === 0 ? 'Completo' : 'Disponível'}</div>
            {index === 0 && <span style={{ display: 'block', marginTop: 8 }}>✅</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
