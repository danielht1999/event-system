// client/src/components/ComprarModal.tsx
import { useState } from 'react'

interface Props {
  eventoTitulo: string
  cargando: boolean
  onConfirmar: (cantidad: number) => Promise<void>
  onCerrar: () => void
}

function ComprarModal({ eventoTitulo, cargando, onConfirmar, onCerrar }: Props) {
  const [cantidad, setCantidad] = useState(1)

  const handleConfirmar = async () => {
    await onConfirmar(cantidad)
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🎟️ Comprar Tickets</h3>
          <button className="modal-close" onClick={onCerrar}>✕</button>
        </div>
        
        <div className="modal-body">
          <p><strong>Evento:</strong> {eventoTitulo}</p>
          
          <div className="form-group">
            <label>Cantidad de tickets (máximo 4):</label>
            <input 
              type="number" 
              min="1" 
              max="4" 
              value={cantidad}
              onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
              disabled={cargando}
            />
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            className="btn-confirmar" 
            onClick={handleConfirmar} 
            disabled={cargando}
          >
            {cargando ? 'Procesando...' : '✅ Confirmar'}
          </button>
          <button className="btn-cerrar-modal" onClick={onCerrar} disabled={cargando}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ComprarModal