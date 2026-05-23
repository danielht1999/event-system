const API_URL = 'http://localhost:3000/api/v1';
let authToken = null;
let currentUser = null;

// Mostrar mensaje
function showMessage(message, type) {
    const mensaje = document.createElement('div');
    mensaje.className = `mensaje ${type}`;
    mensaje.textContent = message;
    document.body.appendChild(mensaje);
    
    setTimeout(() => {
        mensaje.remove();
    }, 3000);
}

// Guardar token en localStorage
function saveAuthData(token, user) {
    authToken = token;
    currentUser = user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
}

// Cargar token guardado
function loadAuthData() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
        authToken = token;
        currentUser = JSON.parse(user);
        return true;
    }
    return false;
}

// Cerrar sesion
function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.getElementById('authPanel').style.display = 'block';
    document.getElementById('userPanel').style.display = 'none';
    document.getElementById('misReservasSection').style.display = 'none';
    showMessage('Sesion cerrada exitosamente', 'success');
}

// Actualizar UI segun usuario
function updateUI() {
    if (currentUser) {
        document.getElementById('authPanel').style.display = 'none';
        document.getElementById('userPanel').style.display = 'block';
        document.getElementById('userNombre').textContent = currentUser.nombre;
        document.getElementById('userRol').textContent = currentUser.rol;
        
        // Mostrar seccion de crear evento solo para organizadores
        if (currentUser.rol === 'organizador') {
            document.getElementById('crearEventoSection').style.display = 'block';
        } else {
            document.getElementById('crearEventoSection').style.display = 'none';
        }
        
        document.getElementById('misReservasSection').style.display = 'block';
        cargarMisReservas();
    }
}

// Cargar lista de eventos
async function cargarEventos() {
    try {
        const response = await fetch(`${API_URL}/eventos`);
        const data = await response.json();
        
        const container = document.getElementById('eventosList');
        
        if (data.success && data.data.length > 0) {
            container.innerHTML = data.data.map(evento => `
                <div class="evento-card">
                    <h3>${evento.titulo}</h3>
                    <p>${evento.descripcion || 'Sin descripcion'}</p>
                    <p>Ubicacion: ${evento.lugar}</p>
                    <p>Fecha: ${new Date(evento.fecha).toLocaleDateString()}</p>
                    <p>Cupos disponibles: ${evento.cuposDisponibles}</p>
                    <div class="precio">$${evento.precio}</div>
                    <button onclick="comprarTicket('${evento.id}')" class="btn-primary" style="margin-top: 10px;">Comprar Ticket</button>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="loading">No hay eventos disponibles</p>';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('eventosList').innerHTML = '<p class="loading">Error al cargar eventos</p>';
    }
}

// Comprar ticket
async function comprarTicket(eventoId) {
    if (!authToken) {
        showMessage('Debes iniciar sesion para comprar tickets', 'error');
        return;
    }
    
    const cantidad = prompt('Cuantos tickets deseas comprar? (maximo 4)', '1');
    if (!cantidad) return;
    
    const cantidadNum = parseInt(cantidad);
    if (cantidadNum < 1 || cantidadNum > 4) {
        showMessage('Solo puedes comprar entre 1 y 4 tickets', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/reservas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                eventoId: eventoId,
                cantidadTickets: cantidadNum
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage(`Reserva creada! Codigo: ${data.data.codigoTicket}`, 'success');
            cargarMisReservas();
            
            // Preguntar si quiere pagar ahora
            if (confirm('Deseas confirmar el pago ahora?')) {
                await confirmarPago(data.data.id);
            }
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('Error al crear reserva', 'error');
    }
}

// Confirmar pago
async function confirmarPago(reservaId) {
    try {
        const response = await fetch(`${API_URL}/reservas/${reservaId}/pagar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Pago confirmado! Ticket emitido', 'success');
            cargarMisReservas();
            cargarEventos();
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('Error al confirmar pago', 'error');
    }
}

// Cargar mis reservas
async function cargarMisReservas() {
    if (!authToken) return;
    
    try {
        const response = await fetch(`${API_URL}/reservas/mis-reservas`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        const container = document.getElementById('reservasList');
        
        if (data.success && data.data.length > 0) {
            container.innerHTML = data.data.map(reserva => `
                <div class="evento-card">
                    <h3>${reserva.eventoTitulo}</h3>
                    <p>Ubicacion: ${reserva.eventoLugar}</p>
                    <p>Fecha: ${new Date(reserva.eventoFecha).toLocaleDateString()}</p>
                    <p>Cantidad: ${reserva.cantidadTickets} tickets</p>
                    <p>Estado: ${reserva.estado}</p>
                    <p>Codigo: ${reserva.codigoTicket}</p>
                    ${reserva.estado === 'PENDIENTE_PAGO' ? 
                        `<button onclick="confirmarPago('${reserva.id}')" class="btn-primary" style="margin-top: 10px;">Confirmar Pago</button>` : 
                        ''}
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="loading">No tienes reservas</p>';
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Registro de usuario
document.getElementById('registerFormElement')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userData = {
        nombre: document.getElementById('regNombre').value,
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
        rol: document.getElementById('regRol').value
    };
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            saveAuthData(data.data.token, data.data.user);
            updateUI();
            cargarEventos();
            showMessage('Registro exitoso! Bienvenido', 'success');
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('Error al registrar', 'error');
    }
});

// Login
document.getElementById('loginFormElement')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const credentials = {
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
    };
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        
        const data = await response.json();
        
        if (data.success) {
            saveAuthData(data.data.token, data.data.user);
            updateUI();
            cargarEventos();
            showMessage('Login exitoso!', 'success');
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('Error al iniciar sesion', 'error');
    }
});

// Crear evento
document.getElementById('eventoForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const evento = {
        titulo: document.getElementById('titulo').value,
        descripcion: document.getElementById('descripcion').value,
        fecha: new Date(document.getElementById('fecha').value).toISOString(),
        lugar: document.getElementById('lugar').value,
        capacidad: parseInt(document.getElementById('capacidad').value),
        precio: parseFloat(document.getElementById('precio').value)
    };
    
    try {
        const response = await fetch(`${API_URL}/eventos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(evento)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Evento creado exitosamente', 'success');
            document.getElementById('eventoForm').reset();
            cargarEventos();
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('Error al crear evento', 'error');
    }
});

// Comprar ticket desde el formulario
document.getElementById('comprarTicketBtn')?.addEventListener('click', async () => {
    const eventoId = document.getElementById('eventoIdCompra').value;
    const cantidad = document.getElementById('cantidadTickets').value;
    
    if (!eventoId || !cantidad) {
        showMessage('Completa todos los campos', 'error');
        return;
    }
    
    await comprarTicket(eventoId);
});

// Cambiar entre login y registro
document.getElementById('showRegister')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
});

document.getElementById('showLogin')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
});

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    logout();
});

// Inicializar
if (loadAuthData()) {
    updateUI();
}
cargarEventos();