import { useState } from 'react'

interface Props {
  eventoTitulo: string
  cargando: boolean
  onConfirmar: (cantidad: number) => void
  onCerrar: () => void
}

function ComprarModal({ eventoTitulo, cargando, onConfirmar, onCerrar }: Props) {
  const [cantidad, setCantidad] = useState(1)

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>Comprar tickets</h3>
        <p style={{ color: '#666', marginBottom: '16px' }}>{eventoTitulo}</p>
        
        <div className="form-group">
          <input
            type="number"
            min={1}
            max={4}
            value={cantidad}
            onChange={e => setCantidad(parseInt(e.target.value))}
          />
          <small style={{ color: '#999' }}>Máximo 4 tickets por persona</small>
        </div>

        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onCerrar}>
            Cancelar
          </button>
          <button 
            onClick={() => onConfirmar(cantidad)} 
            disabled={cargando} // Evita doble clicks mientras procesa
            className="btn btn-primary" > {cargando ? 'Procesando...' : 'Confirmar Compra'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ComprarModal