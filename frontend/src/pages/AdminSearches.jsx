// src/pages/AdminSearches.jsx
import * as React from "react";
import {
  Container, Paper, Stack, Typography, Button, TextField, MenuItem,
  Snackbar, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  Divider, FormControl, InputLabel, Select, Chip, IconButton, Tooltip
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import { listSearchesApi, createSearchApi, updateSearchApi, deleteSearchApi } from "../api/searches";
import { listAreasApi } from "../api/areas";
import Swal from 'sweetalert2';

const ESTADOS = ["Activa", "Pausada", "Cerrada"];

const STATUS_COLORS = { Activa: "success", Pausada: "warning", Cerrada: "default" };
const CHIP_W = 100;
const CHIP_H = 28;

const emptyForm = { titulo: "", area: "", estado: "Activa", ubicacion: "", descripcion: "" };

export default function AdminSearches() {
  const navigate = useNavigate();
  const [rows, setRows] = React.useState([]);
  const [areas, setAreas] = React.useState([]); // Estado para áreas dinámicas
  const [loading, setLoading] = React.useState(true);
  const [snack, setSnack] = React.useState({ open: false, severity: "success", msg: "" });

  // filtros
  const [q, setQ] = React.useState("");
  const [estadoTab, setEstadoTab] = React.useState("Todas");
  const [areaFilter, setAreaFilter] = React.useState("Todas");

  // modal
  const [openDlg, setOpenDlg] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState(emptyForm);
  const [editingId, setEditingId] = React.useState(null);

  // Cargar áreas
  const fetchAreas = React.useCallback(async () => {
    try {
      const { data } = await listAreasApi();
      setAreas(data.areas || []);
    } catch (e) {
      console.error("Error cargando áreas", e);
    }
  }, []);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await listSearchesApi(); // GET /admin/searches
      const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
      setRows(items.map((s) => ({
        id: s._id || s.id,
        titulo: s.titulo,
        area: s.area,
        estado: s.estado,
        ubicacion: s.ubicacion,
        descripcion: s.descripcion,
        created: s.createdAt,
        updatedAt: s.updatedAt,
      })));
    } catch (e) {
      console.error(e);
      setSnack({ open: true, severity: "error", msg: e?.response?.data?.message || "No se pudieron cargar las búsquedas" });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { 
    fetchData(); 
    fetchAreas(); 
  }, [fetchData, fetchAreas]);

  const filtered = rows.filter((r) => {
    if (estadoTab !== "Todas" && r.estado !== estadoTab) return false;
    if (areaFilter !== "Todas" && r.area !== areaFilter) return false;
    const term = q.trim().toLowerCase();
    if (!term) return true;
    return (
      r.titulo?.toLowerCase().includes(term) ||
      r.area?.toLowerCase().includes(term) ||
      r.estado?.toLowerCase().includes(term) ||
      r.ubicacion?.toLowerCase().includes(term) ||
      r.descripcion?.toLowerCase().includes(term)
    );
  });

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setOpenDlg(true); };
  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      titulo: row.titulo || "",
      area: row.area || "",
      estado: row.estado || "Activa",
      ubicacion: row.ubicacion || "",
      descripcion: row.descripcion || "",
    });
    setOpenDlg(true);
  };
  const closeDlg = () => { setOpenDlg(false); setForm(emptyForm); setEditingId(null); };

  const handleSave = async () => {
    if (!form.titulo || !form.area || !form.estado) {
      setSnack({ open: true, severity: "warning", msg: "Completá título, área y estado." });
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateSearchApi(editingId, form);
        setSnack({ open: true, severity: "success", msg: "Búsqueda actualizada ✅" });
      } else {
        await createSearchApi(form);
        setSnack({ open: true, severity: "success", msg: "Búsqueda creada ✅" });
      }
      closeDlg();
      fetchData();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, severity: "error", msg: e?.response?.data?.message || "No se pudo guardar" });
    } finally { setSaving(false); }
  };

  const handleEditClick = async (row) => {
    const result = await Swal.fire({
      title: '¿Editar búsqueda?',
      text: `Vas a editar los datos de "${row.titulo}".`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Sí, editar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      openEdit(row);
    }
  };

  const handleDelete = async (row) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Vas a eliminar la búsqueda "${row.titulo}". Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteSearchApi(row.id);
        Swal.fire('¡Eliminado!', 'La búsqueda ha sido eliminada.', 'success');
        fetchData();
      } catch (e) {
        console.error(e);
        Swal.fire('Error', e?.response?.data?.message || "No se pudo eliminar", 'error');
      }
    }
  };

  const columns = [
    {
      field: "titulo",
      headerName: "Título",
      flex: 1.4,
      minWidth: 220,
      renderCell: (p) => (
        <Stack spacing={0.5} sx={{ py: 1 }}>
          <Typography variant="subtitle2" fontWeight={700} color="text.primary">
            {p.row.titulo}
          </Typography>
          <Typography variant="caption" color="primary">
            {p.row.area} • #{String(p.row.id).slice(-6)}
          </Typography>
        </Stack>
      ),
      sortable: true,
    },
    {
      field: "estado",
      headerName: "Estado",
      width: 140,
      align: "center",
      headerAlign: "center",
      renderCell: (p) => (
        <Chip
          size="small"
          label={p.value}
          color={STATUS_COLORS[p.value] || "default"}
          sx={{
            fontWeight: "bold",
            width: CHIP_W,
            height: CHIP_H,
            borderRadius: "999px",
            "& .MuiChip-label": { width: "100%", textAlign: "center", px: 0 }
          }}
        />
      ),
      sortable: true,
    },
    {
      field: "ubicacion",
      headerName: "Ubicación",
      flex: 1,
      minWidth: 200,
      align: "center",
      headerAlign: "center",
      renderCell: (p) =>
        p.value ? (
          <Typography
            variant="body2"
            noWrap
            title={p.value}
            sx={{ width: "100%", textAlign: "center" }}
          >
            {p.value}
          </Typography>
        ) : (
          <span style={{ opacity: 0.6 }}>—</span>
        ),
      sortable: true,
    },
    {
      field: "descripcion",
      headerName: "Descripción",
      flex: 1.2,
      minWidth: 260,
      align: "center",
      headerAlign: "center",
      renderCell: (p) => (
        <Typography
          variant="body2"
          noWrap
          title={p.value}
          sx={{ width: "100%", textAlign: "center" }}
        >
          {p.value || "—"}
        </Typography>
      ),
      sortable: false,
    },
    {
      field: "created",
      headerName: "Creado",
      width: 160,
      align: "center",
      headerAlign: "center",
      type: "dateTime",
      valueGetter: (value) => (value ? new Date(value) : null),
      valueFormatter: (value) => (value ? value.toLocaleString() : ""),
      sortable: true
    },
    {
      field: "updatedAt",
      headerName: "Última actualización",
      width: 160,
      align: "center",
      headerAlign: "center",
      type: "dateTime",
      valueGetter: (value) => (value ? new Date(value) : null),
      valueFormatter: (value) => (value ? value.toLocaleString() : ""),
      sortable: true,
    },
    
    {
      field: "acciones",
      headerName: "Acciones",
      width: 140,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} justifyContent="center" sx={{ width: "100%" }}>
          <Tooltip title="Editar">
            <IconButton size="small" color="primary" onClick={() => handleEditClick(params.row)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton size="small" color="error" onClick={() => handleDelete(params.row)}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h5" gutterBottom>ABM de Búsquedas</Typography>

      {/* Filtros */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={3} alignItems="center">
        <TextField
          label="Buscar (título/área/estado/ubicación/descr.)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          fullWidth
        />
        <FormControl sx={{ minWidth: 220 }}>
          <InputLabel id="area-filter-label" sx={{ lineHeight: 'normal' }}>Área</InputLabel>
          <Select
            labelId="area-filter-label"
            id="area-filter-select"
            value={areaFilter}
            label="Área"
            onChange={(e) => setAreaFilter(e.target.value)}
          >
            <MenuItem value="Todas">Todas las áreas</MenuItem>
            {areas.map((a) => (
              <MenuItem key={a._id} value={a.nombre}>{a.nombre}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", md: "block" } }} />
        <Stack direction="row" spacing={1}>
          {["Todas", ...ESTADOS].map((et) => (
            <Button
              key={et}
              variant={estadoTab === et ? "contained" : "outlined"}
              onClick={() => setEstadoTab(et)}
              sx={{ textTransform: "none" }}
            >
              {et === "Todas" ? "Todas" : ` ${et}`}
            </Button>
          ))}
        </Stack>

        
        <Button variant="contained" onClick={openCreate} sx={{ lineHeight: 'normal' }} fontsize="small">Agregar búsqueda</Button>
      </Stack>

      {/* Tabla */}
      <Paper sx={{ height: 560, borderRadius: 3, overflow: "hidden" }} elevation={1}>
        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }}>
            <CircularProgress />
          </Stack>
        ) : (
          <DataGrid
            rows={filtered}
            columns={columns}
            getRowId={(row) => row.id}
            disableRowSelectionOnClick
            pageSizeOptions={[5, 10, 25]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10, page: 0 } },
              sorting: { sortModel: [{ field: "updatedAt", sort: "desc" }] },
            }}
            sx={{
              border: 0,
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "background.default",
                borderBottom: "none",
                fontWeight: 700,
                py: 1,
                px: 2.5,
              },
              "& .MuiDataGrid-row": { backgroundColor: "background.paper" },
              "& .MuiDataGrid-cell": {
                borderBottom: "1px solid",
                borderColor: "divider",
                py: 1.25,
                px: 2.5,
                display: "flex",
                alignItems: "center",
              },
              // Centrar horizontalmente estas columnas
              '& .MuiDataGrid-cell[data-field="ubicacion"], \
                & .MuiDataGrid-cell[data-field="descripcion"], \
                & .MuiDataGrid-cell[data-field="acciones"]': {
                justifyContent: "center",
              },
            }}
          />
        )}
      </Paper>

      {/* Modal alta/edición */}
      <Dialog open={openDlg} onClose={closeDlg} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? "Editar búsqueda" : "Nueva búsqueda"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Título *"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              fullWidth
            />
            <TextField
              select
              label="Área *"
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
              fullWidth
            >
              {areas.map((a) => (
                <MenuItem key={a._id} value={a.nombre}>{a.nombre}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Estado *"
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
              fullWidth
            >
              {ESTADOS.map((e) => <MenuItem key={e} value={e}>{e}</MenuItem>)}
            </TextField>
            <TextField
              label="Ubicación"
              placeholder="Ej: CABA, Buenos Aires, AR"
              value={form.ubicacion}
              onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
              fullWidth
              sx={{ mt: 1 }}
            />
            <TextField
              label="Descripción"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              fullWidth
              multiline
              minRows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDlg}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

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
