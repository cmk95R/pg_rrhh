import * as React from "react";
import {
  Box, Stack, Button, Chip, TextField, MenuItem,Container,
  Snackbar, Alert, Paper, Typography, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select,
  IconButton, Tooltip, Grid, Divider, Avatar, InputAdornment
} from "@mui/material";
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import DeleteIcon from '@mui/icons-material/Delete';
import LockResetIcon from '@mui/icons-material/LockReset';
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { DataGrid } from "@mui/x-data-grid";
import GoogleIcon from "@mui/icons-material/Google";
import EmailIcon from "@mui/icons-material/Email";
// Usamos la API que soporta paginación y filtros
import { listUsersWithCvApi, adminSetUserRoleApi, adminSetUserStatusApi, deleteUserApi, resetUserPasswordApi } from "../api/users";
import UserDetailsDialog from "../components/admin/UserDetailsDialog";
import Swal from 'sweetalert2';

export default function AdminUsersGrid() {
  // Estado para manejar la paginación y datos del servidor
  const [paginationModel, setPaginationModel] = React.useState({ page: 0, pageSize: 10 });
  const [rowCount, setRowCount] = React.useState(0);
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [snack, setSnack] = React.useState({ open: false, severity: "success", msg: "" });

  // Estado para el modal de cambio de rol
  const [roleModalOpen, setRoleModalOpen] = React.useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState(null);
  const [newRole, setNewRole] = React.useState('');

  // Estado para el modal de Reset Password
  const [resetModalOpen, setResetModalOpen] = React.useState(false);
  const [resettingUser, setResettingUser] = React.useState(null);
  const [tempPassword, setTempPassword] = React.useState("");
  
  // Estado para filtros
  const [query, setQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [queryTimeout, setQueryTimeout] = React.useState(null);

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      // Preparamos los parámetros para la API
      const params = {
        page: paginationModel.page + 1, // La API espera página base 1
        limit: paginationModel.pageSize,
        q: query,
        rol: roleFilter === "all" ? undefined : roleFilter,
      };

      const { data } = await listUsersWithCvApi(params);
      
      
      const mapped = (data?.items ?? []).map((u) => {
        

        // Si los datos del CV vienen anidados en un objeto 'cv', los extraemos
        // Verificamos si es un array (común en lookups) y tomamos el primero, o si es objeto.
        const rawCv = u.cv;
        const cvData = Array.isArray(rawCv) ? (rawCv[0] || {}) : (rawCv || {});
        
        return {
          ...u, 
          ...cvData, // Aplanamos el objeto para tener acceso directo
          id: u._id || u.id,
          nombre: u.nombre ?? "",
          apellido: u.apellido ?? "",
          email: u.email ?? "",
          rol: u.rol ?? "user",
          estado: u.estado ?? 'activo',
          createdAt: u.createdAt,
          // Aseguramos que los campos del modal existan, buscando en raíz o en cvData
          telefono: u.telefono || cvData.telefono || "",
          direccion: u.direccion || cvData.direccion || "",
          experiencia: (cvData.experiencia || cvData.experiencias || u.experiencia || []).map(item => ({
            ...item,
            fechaInicio: item.desde || item.fechaInicio,
            fechaFin: item.hasta || item.fechaFin
          })),
          educacion: (u.educacion || u.educacion || u.educacion || []).map(item => ({
            ...item,
            fechaInicio: item.desde || item.fechaInicio,
            fechaFin: item.hasta || item.fechaFin,
            titulo: item.carrera || item.titulo
          })),
          sobreMi: cvData.perfil || cvData.sobreMi || u.sobreMi || u.perfil || "",
          fechaNacimiento: u.nacimiento || u.fechaNacimiento || u.fechaNacimiento || null,
          // Extraemos datos adicionales
          linkedin: u.cvLinkedin || "",
          cvFile: cvData.cvFile || null,
           authMethod: u.providers?.google ? "Google" : "Email",
        };
      });

      setRows(mapped);
      setRowCount(data?.total ?? 0);

    } catch (e) {
      console.error(e);
      setSnack({ open: true, severity: "error", msg: e?.response?.data?.message || "No se pudieron cargar los usuarios" });
      // En caso de error, reseteamos el estado
      setRows([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  }, [paginationModel, query, roleFilter]);

  React.useEffect(() => {
    // Usamos un debounce para no llamar a la API en cada tecla presionada
    if (queryTimeout) clearTimeout(queryTimeout);
    const timeoutId = setTimeout(() => fetchUsers(), 500);
    setQueryTimeout(timeoutId);

    return () => clearTimeout(timeoutId);
  }, [fetchUsers]); // fetchUsers ya depende de los filtros y paginación

  // --- Lógica del modal de cambio de rol ---
  const handleOpenRoleModal = async (user) => {
    const result = await Swal.fire({
      title: '¿Gestionar rol?',
      text: `Vas a modificar el rol de ${user.nombre}.`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setSelectedUser(user);
      setNewRole(user.rol);
      setRoleModalOpen(true);
    }
  };

  const handleCloseRoleModal = () => {
    setRoleModalOpen(false);
    setSelectedUser(null);
    setNewRole('');
  };

  // --- Lógica del modal de detalles ---
  const handleOpenDetailsModal = (user) => {
    setSelectedUser(user);
    setDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setDetailsModalOpen(false);
    setSelectedUser(null);
  };

  const handleRoleChange = async () => {
    if (!selectedUser || selectedUser.rol === newRole) {
      handleCloseRoleModal();
      return;
    }

    try {
      await adminSetUserRoleApi(selectedUser.id, newRole);
      setRows(prev => prev.map(r => r.id === selectedUser.id ? { ...r, rol: newRole } : r));
      Swal.fire('¡Actualizado!', `El rol ha sido actualizado a ${newRole}.`, 'success');
    } catch (e) {
      console.error(e);
      Swal.fire('Error', e?.response?.data?.message || "No se pudo cambiar el rol", 'error');
    } finally {
      handleCloseRoleModal();
    }
  };  

  // --- Lógica de Reset Password ---
  const handleResetPasswordClick = async (user) => {
    // Verificar si es usuario de Google
    if (user.providers?.google) {
      Swal.fire('Acción no permitida', 'Este usuario se registró con Google y no utiliza contraseña.', 'info');
      return;
    }

    const result = await Swal.fire({
      title: 'Restablecer contraseña',
      text: `¿Deseas cambiar la contraseña de ${user.nombre}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setResettingUser(user);
      setTempPassword(""); // Limpiar campo
      setResetModalOpen(true);
    }
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let pass = "";
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTempPassword(pass);
  };

  const copyToClipboard = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      setSnack({ open: true, severity: "info", msg: "Contraseña copiada al portapapeles" });
    }
  };

  const handleSavePassword = async () => {
    if (!tempPassword) {
      setSnack({ open: true, severity: "warning", msg: "Debes ingresar o generar una contraseña." });
      return;
    }
    
    try {
      await resetUserPasswordApi(resettingUser.id, tempPassword);
      setResetModalOpen(false);
      Swal.fire('¡Guardado!', `La contraseña ha sido actualizada .`, 'success');
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'Hubo un problema al restablecer la contraseña.', 'error');
    }
  };

  const handleToggleStatus = async (user) => {
    if (!user) return;
    const newStatus = user.estado === 'activo' ? 'inactivo' : 'activo';
    const actionText = newStatus === 'activo' ? 'habilitar' : 'deshabilitar';

    const result = await Swal.fire({
      title: `¿${actionText.charAt(0).toUpperCase() + actionText.slice(1)} usuario?`,
      text: `Vas a ${actionText} a ${user.nombre}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: newStatus === 'activo' ? '#2e7d32' : '#ed6c02',
      cancelButtonColor: '#3085d6',
      confirmButtonText: `Sí, ${actionText}`,
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await adminSetUserStatusApi(user.id, newStatus);
        setRows(prev => prev.map(r => r.id === user.id ? { ...r, estado: newStatus } : r));
        Swal.fire('¡Actualizado!', `El usuario ha sido ${newStatus === 'activo' ? 'habilitado' : 'deshabilitado'}.`, 'success');
      } catch (e) {
        console.error(e);
        Swal.fire('Error', e?.response?.data?.message || "No se pudo cambiar el estado", 'error');
      }
    }
  };

  const handleDeleteUser = async (user) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Vas a eliminar al usuario ${user.nombre} ${user.apellido}. Esta acción no es reversible.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteUserApi(user.id);
        Swal.fire('¡Eliminado!', 'El usuario ha sido eliminado.', 'success');
        fetchUsers();
      } catch (e) {
        Swal.fire('Error', e?.response?.data?.message || 'No se pudo eliminar el usuario.', 'error');
      }
    }
  };

  const columns = [
    { field: "nombre", headerName: "Nombre", flex: 1, minWidth: 150,align: "center", headerAlign: "center"},
    { field: "apellido", headerName: "Apellido", flex: 1, minWidth: 150,align: "center", headerAlign: "center" },
    { field: "email", headerName: "Email", flex: 1.5, minWidth: 220, align: "center", headerAlign: "center" },
     {
          field: "authMethod",
          headerName: "Registro",
          width: 80,
          align: "center",
          headerAlign: "center",
          renderCell: (params) => (
            <Tooltip title={params.value === "Google" ? "Registrado con Google" : "Registrado con Email"}>
              {params.value === "Google" ? <GoogleIcon color="error" fontSize="small" /> : <EmailIcon color="action" fontSize="small" />}
            </Tooltip>
          ),
        },
    {
    field: "rol",
      headerName: "Rol",
      align: "center", headerAlign: "center",
      flex: 1,
      minWidth: 100,
      
      renderCell: (params) => (
        <Chip label={params.value} color={params.value === "admin" ? "success" : params.value === 'rrhh' ? 'info' : "default"} size="small" />
      ),
    },
    {
      field: "estado",
      headerName: "Estado",
      flex: 1,
      minWidth: 100,
      
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const isActivo = params.value === 'activo';
        return (
          <Tooltip title={isActivo ? 'Deshabilitar Usuario' : 'Habilitar Usuario'} >
            <IconButton onClick={() => handleToggleStatus(params.row)} color={isActivo ? 'success' : 'error'} size="large">
              {isActivo ? <ToggleOnIcon fontSize="large" /> : <ToggleOffIcon fontSize="large" />}
            </IconButton> 
          </Tooltip>
        );
      }
    },
    {
      field: "createdAt",
      headerName: "Creado",
      type: "dateTime", // 1. Indicamos que es una columna de fecha/hora
      flex: 1,
      minWidth: 150,
      align: "center", headerAlign: "center",
      width: 150,
      // 2. valueGetter devuelve un objeto Date para que el ordenamiento funcione
      valueGetter: (value) => {
        return value ? new Date(value) : null;
      },
      // 3. valueFormatter se encarga solo de la presentación visual
      valueFormatter: (value) => {
        return value ? value.toLocaleDateString('es-AR') : '';
      },
    },
    {
      field: "updatedAt",
      headerName: "Modificado",
      type: "dateTime",
      flex: 1,
      minWidth: 150,
      align: "center", headerAlign: "center",
      width: 150,
      valueGetter: (value) => {
        return value ? new Date(value) : null;
      },
      valueFormatter: (value) => {
        return value ? value.toLocaleDateString('es-AR') : '';
      },
    },
    {
      field: "actions",
      headerName: "Acciones",
      flex: 1.4,
      width: 140,
      align: "center", headerAlign: "center",
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Ver Detalles">
            <IconButton onClick={() => handleOpenDetailsModal(params.row)} size="small">
              <VisibilityIcon fontSize="large" />
            </IconButton>
          </Tooltip>
          <Tooltip title={params.row.providers?.google ? "Usuario Google (Sin contraseña)" : "Restablecer Contraseña"}>
            <IconButton onClick={() => handleResetPasswordClick(params.row)} color="warning" size="small" disabled={!!params.row.providers?.google}>
              <LockResetIcon fontSize="large" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Cambiar Rol">
            <IconButton onClick={() => handleOpenRoleModal(params.row)} size="small">
              <ManageAccountsIcon fontSize="large" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar Usuario">
            <IconButton onClick={() => handleDeleteUser(params.row)} color="error" size="small">
              <DeleteIcon fontSize="large" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 400 }}>
        Gestión de Usuarios
      </Typography>

      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }} elevation={2}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label="Buscar (nombre, apellido o email)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            fullWidth
          />
          <TextField
            select
            label="Rol"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            sx={{ width: 200 }}
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="user">User</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="rrhh">RRHH</MenuItem>
          </TextField>
        </Stack>
      </Paper>

      <Paper sx={{ height: 520, borderRadius: 2 }} elevation={2}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          // Configuración para paginación del lado del servidor
          paginationMode="server"
          rowCount={rowCount}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          // Opciones de tamaño de página
          pageSizeOptions={[5, 10, 25, 50]}
          // Otras props
          disableRowSelectionOnClick
          getRowId={(row) => row.id}
        />
      </Paper>

      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>

      {/* Modal para cambiar el rol */}
      <Dialog open={roleModalOpen} onClose={handleCloseRoleModal} fullWidth maxWidth="xs">
        <DialogTitle>Cambiar rol de {selectedUser?.nombre}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="role-select-label">Rol</InputLabel>
            <Select
              labelId="role-select-label"
              value={newRole}
              label="Rol"
              onChange={(e) => setNewRole(e.target.value)}
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="rrhh">RRHH</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRoleModal}>Cerrar</Button>
          <Button
            onClick={handleRoleChange}
            variant="contained"
            disabled={!selectedUser || selectedUser.rol === newRole}
          >
            Cambiar Rol
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Reset Password */}
      <Dialog open={resetModalOpen} onClose={() => setResetModalOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Restablecer Contraseña</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" gutterBottom>
            Usuario: <strong>{resettingUser?.nombre} {resettingUser?.apellido}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Genera una clave temporal o escribe una manualmente.
          </Typography>
          
          <Stack spacing={2}>
            <Button variant="outlined" startIcon={<AutoFixHighIcon />} onClick={generatePassword}>
              Generar Aleatoria
            </Button>
            
            <TextField
              fullWidth
              label="Nueva Contraseña"
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={copyToClipboard} edge="end" disabled={!tempPassword}>
                      <ContentCopyIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetModalOpen(false)}>Cancelar</Button>
          <Button variant="contained" color="primary" onClick={handleSavePassword} disabled={!tempPassword}>
            Guardar y Enviar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para ver detalles del usuario */}
      <UserDetailsDialog
        open={detailsModalOpen}
        onClose={handleCloseDetailsModal}
        user={selectedUser}
      />
    </Container>
  );
}
