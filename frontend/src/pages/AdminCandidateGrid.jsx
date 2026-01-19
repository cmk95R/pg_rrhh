// src/pages/AdminCandidatesGrid.jsx
import * as React from "react";
import {
  Container, Stack, Paper, Typography, TextField, MenuItem, Tooltip, IconButton,
  Snackbar, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Button, InputAdornment
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import GoogleIcon from "@mui/icons-material/Google";
import EmailIcon from "@mui/icons-material/Email";
import LockResetIcon from "@mui/icons-material/LockReset";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import { listUsersWithCvApi, resetUserPasswordApi, adminUpdateUserApi } from "../api/users";
import { getCvByIdApi } from "../api/cv";
import Swal from 'sweetalert2';
import VisibilityIcon from '@mui/icons-material/Visibility';
import UserDetailsDialog from "../components/admin/UserDetailsDialog";

const fmtDate = (v) => {
  if (!v) return "";
  const d = new Date(v);
  return isNaN(d) ? "" : d.toLocaleDateString();
};

const normalizeLink = (url) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
};

export default function AdminCandidatesGrid() {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [snack, setSnack] = React.useState({ open: false, severity: "success", msg: "" });
  const [filters, setFilters] = React.useState({ q: "", areaInteres: "all" });
  const [paginationModel, setPaginationModel] = React.useState({ page: 0, pageSize: 10 });
  const [rowCount, setRowCount] = React.useState(0);
  const [downloadingId, setDownloadingId] = React.useState(null);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState(null);
  
  // Estados para el modal de Reset Password
  const [resetModalOpen, setResetModalOpen] = React.useState(false);
  const [resettingUser, setResettingUser] = React.useState(null);
  const [tempPassword, setTempPassword] = React.useState("");

    // Estados para el modal de detalles
  const [detailsModalOpen, setDetailsModalOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState(null);
  
  const fetchCandidates = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        rol: "user", // Solo queremos candidatos
        q: filters.q,
        areaInteres: filters.areaInteres === "all" ? "" : filters.areaInteres,
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
      };
      const { data } = await listUsersWithCvApi(params);
      const mapped = (data?.items || []).map(u => ({
        id: u._id,
        cvId: u.cvId,
        publicId: u.publicId,
        nombre: u.nombre,
        apellido: u.apellido,
        email: u.email,
        ubicacion: [u.direccion?.localidad?.nombre, u.direccion?.provincia?.nombre].filter(Boolean).join(", "),
        rol: u.rol,
        estado: u.estado,
        area: u.cvArea,
        nivel: u.cvNivel,
        linkedin: u.cvLinkedin,
        telefono: u.telefono || u.cvTelefono,
        creado: u.createdAt,
        hasCv: u.hasCv,
        authMethod: u.providers?.google ? "Google" : "Email",
      }));
      setRows(mapped);
      setRowCount(data?.total || 0);
    } catch (e) {
      console.error(e);
      setSnack({
        open: true,
        severity: "error",
        msg: e?.response?.data?.message || "No se pudieron cargar los candidatos",
      });
    } finally {
      setLoading(false);
    }
  }, [filters, paginationModel]);

  React.useEffect(() => {
    const timer = setTimeout(() => fetchCandidates(), 500); // debounce para no llamar a la API en cada tecla
    return () => clearTimeout(timer);
  }, [fetchCandidates]);

  const allAreas = React.useMemo(() => {
    const set = new Set(rows.map(r => r.area).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [rows]);
   const handleOpenDetailsModal = (user) => {
    setSelectedUser(user);
    setDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setDetailsModalOpen(false);
    setSelectedUser(null);
  };
  const handleDownloadCv = async (row) => {
    setDownloadingId(row.id);
    try {
      // Usamos getCvByIdApi para obtener la URL del archivo (webViewLink de Drive)
      const { data } = await getCvByIdApi(row.cvId);
      const url = data?.cv?.cvFile?.url;
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        throw new Error("El CV no tiene un archivo adjunto válido.");
      }
    } catch (e) {
      console.error(e);
      setSnack({ open: true, severity: "error", msg: e?.response?.data?.message || "No se pudo obtener el CV" });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleEditClick = async (row) => {
    const result = await Swal.fire({
      title: '¿Editar usuario?',
      text: `Vas a editar los datos de ${row.nombre} ${row.apellido}.`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Sí, editar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setEditingUser({ ...row });
      setEditOpen(true);
    }
  };

  const handleResetPasswordClick = async (row) => {
    if (row.authMethod === "Google") return;

    const result = await Swal.fire({
      title: 'Restablecer contraseña',
      text: `¿Deseas iniciar el proceso de cambio de contraseña para ${row.nombre}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setResettingUser(row);
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
      setSnack({ open: true, severity: "warning", msg: "Debes generar una contraseña primero." });
      return;
    }
    
    try {
      setLoading(true); // Bloquear UI levemente o usar estado local de carga
      await resetUserPasswordApi(resettingUser.id, tempPassword);
      setResetModalOpen(false);
      Swal.fire('¡Guardado!', `La contraseña ha sido actualizada y enviada a ${resettingUser.email}.`, 'success');
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'Hubo un problema al restablecer la contraseña.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
    setEditingUser(null);
  };

  const handleSaveEdit = async () => {
    try {
      await adminUpdateUserApi(editingUser.id, {
        nombre: editingUser.nombre,
        apellido: editingUser.apellido,
        email: editingUser.email,
        telefono: editingUser.telefono
      });
      
      Swal.fire('¡Actualizado!', `Los datos de ${editingUser.nombre} han sido actualizados.`, 'success');
      handleCloseEdit();
      fetchCandidates();
    } catch (e) {
      const msg = e.response?.data?.message || 'No se pudo actualizar el usuario.';
      Swal.fire('Error', msg, 'error');
    }
  };

  const columns = [
    { field: "publicId", headerName: "ID", width: 120 },
    
    { field: "nombre", headerName: "Nombre", flex: 1, minWidth: 100 },
    { field: "apellido", headerName: "Apellido", flex: 1, minWidth: 100  },
    { field: "email", headerName: "Email", flex: 1.2, minWidth: 220 },
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
      field: "ubicacion",
      headerName: "Ubicación",
      flex: 1.2,
      minWidth: 150,
      renderCell: (p) => p.value ? p.value : <span style={{ opacity: .6 }}>—</span>
    },
    // {
    //   field: "area",
    //   headerName: "Área de interés",
    //   width: 150,
    //   renderCell: (p) => p.value ? p.value : <span style={{ opacity: .6 }}>—</span>
    // },
    // {
    //   field: "nivel",
    //   headerName: "Nivel académico",
    //   width: 220,
    //   renderCell: (p) => p.value ? p.value : <span style={{ opacity: .6 }}>—</span>
    // },
    {
      field: "linkedin",
      headerName: "LinkedIn",
      flex: 0.5,
      minWidth: 120,
      renderCell: (p) =>
        p.value
          ? <a href={normalizeLink(p.value)} target="_blank" rel="noreferrer">{p.value}</a>
          : <span style={{ opacity: .6 }}>—</span>
    },
    {
      field: "telefono",
      headerName: "Teléfono",
      flex: 0.5,
      minWidth: 120,
      renderCell: (p) => p.value ? p.value : <span style={{ opacity: .6 }}>—</span>
    },
    {
      field: "creado",
      headerName: "Creado",
      width: 120,
      valueGetter: (value, row) => fmtDate(row.creado)
    },
    {
      field: "actions",
      headerName: "Acciones",
      width: 140,
      align: "center",
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title={params.row.authMethod === "Google" ? "No disponible (Google)" : "Restablecer contraseña"}>
            <span>
              <IconButton 
                size="small" 
                color="warning" 
                onClick={() => handleResetPasswordClick(params.row)}
                disabled={params.row.authMethod === "Google"}
              >
                <LockResetIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Ver Detalles">
                      <IconButton onClick={() => handleOpenDetailsModal(params.row)} size="small">
                        <VisibilityIcon fontSize="large"  />
                      </IconButton>
                    </Tooltip>
          <Tooltip title="Editar datos">
            <IconButton size="small" onClick={() => handleEditClick(params.row)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          {params.row.hasCv && (
            <Tooltip title="Descargar CV">
              <span>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleDownloadCv(params.row)}
                  disabled={downloadingId === params.row.id}
                >
                  {downloadingId === params.row.id ? <CircularProgress size={20} /> : <DownloadIcon />}
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 400 }}>
        Gestión de Candidatos
      </Typography>

      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }} elevation={2}>
        <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
          <TextField
            label="Buscar (nombre, apellido o email)"
            value={filters.q}
            onChange={(e) => setFilters(f => ({ ...f, q: e.target.value }))}
            fullWidth
          />

          <TextField
            select
            label="Área"
            value={filters.areaInteres}
            onChange={(e) => setFilters(f => ({ ...f, areaInteres: e.target.value }))}
            sx={{ width: 150 }}
          >
            {allAreas.map((a) => (
              <MenuItem key={a} value={a}>
                {a === "all" ? "Todas" : a}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      <Paper sx={{ height: 560, borderRadius: 2 }} elevation={2}>
        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }}>
            <CircularProgress />
          </Stack>
        ) : (
          <DataGrid
            rows={rows}
            columns={columns}
            rowCount={rowCount}
            loading={loading}
            pageSizeOptions={[5, 10, 25]}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            paginationMode="server"
            disableRowSelectionOnClick
            getRowId={(row) => row.id}
          />
        )}
      </Paper>

      {/* Modal de Edición */}
      <Dialog open={editOpen} onClose={handleCloseEdit} fullWidth maxWidth="sm">
        <DialogTitle>Editar Candidato</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField 
              label="Nombre" 
              value={editingUser?.nombre || ''} 
              onChange={e => setEditingUser({...editingUser, nombre: e.target.value})} 
              fullWidth 
            />
            <TextField 
              label="Apellido" 
              value={editingUser?.apellido || ''} 
              onChange={e => setEditingUser({...editingUser, apellido: e.target.value})} 
              fullWidth 
            />
            <TextField 
              label="Email" 
              value={editingUser?.email || ''} 
              onChange={e => setEditingUser({...editingUser, email: e.target.value})} 
              fullWidth 
            />
            <TextField 
              label="Teléfono" 
              value={editingUser?.telefono || ''} 
              onChange={e => setEditingUser({...editingUser, telefono: e.target.value})} 
              fullWidth 
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveEdit}>Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Reset Password */}
      <Dialog open={resetModalOpen} onClose={() => setResetModalOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Generar Nueva Contraseña</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" gutterBottom>
            Usuario: <strong>{resettingUser?.nombre} {resettingUser?.apellido}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Genera una clave temporal, cópiala si es necesario y envíala por correo.
          </Typography>
          
          <Stack spacing={2}>
            <Button variant="outlined" startIcon={<AutoFixHighIcon />} onClick={generatePassword}>
              Generar Clave
            </Button>
            
            <TextField
              fullWidth
              label="Contraseña Temporal"
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
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Detalles */}
      <UserDetailsDialog
        open={detailsModalOpen}
        onClose={handleCloseDetailsModal}
        user={selectedUser}
      />

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
    </Container>
  );
}
