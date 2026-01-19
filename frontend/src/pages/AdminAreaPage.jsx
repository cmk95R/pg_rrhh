import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Typography,
  Paper,
  Stack,
  TextField,
  Button,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  Divider,
  Box
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import BusinessIcon from '@mui/icons-material/Business';
import { DataGrid } from "@mui/x-data-grid";
import { listAreasApi, createAreaApi, deleteAreaApi } from "../api/areas";
import Swal from 'sweetalert2';

export default function AdminAreaPage() {
  const [areas, setAreas] = useState([]);
  const [newArea, setNewArea] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [snack, setSnack] = useState({ open: false, severity: "success", msg: "" });

  const fetchAreas = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await listAreasApi();
      setAreas(data.areas || []);
    } catch (e) {
      console.error("Error cargando áreas", e);
      setSnack({ open: true, severity: "error", msg: "Error al cargar áreas" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newArea.trim()) return;

    const result = await Swal.fire({
      title: '¿Crear nueva área?',
      text: `Vas a agregar "${newArea}" al listado de áreas.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, crear',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setCreating(true);
      try {
        await createAreaApi({ nombre: newArea });
        setNewArea("");
        Swal.fire('¡Creada!', 'El área ha sido creada exitosamente.', 'success');
        fetchAreas();
      } catch (e) {
        Swal.fire('Error', e.response?.data?.message || "Error al crear área", 'error');
      } finally {
        setCreating(false);
      }
    }
  };

  const handleDelete = async (id, nombre) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Vas a eliminar el área "${nombre}". Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteAreaApi(id);
        Swal.fire('¡Eliminado!', 'El área ha sido eliminada.', 'success');
        fetchAreas();
      } catch (e) {
        Swal.fire('Error', 'No se pudo eliminar el área.', 'error');
      }
    }
  };

  const columns = [
    { field: "nombre", headerName: "Nombre", flex: 1, minWidth: 200 },
    { 
      field: "createdAt", 
      headerName: "Creado", 
      width: 180, 
      type: "dateTime",
      valueGetter: (value) => value && new Date(value),
      valueFormatter: (value) => value?.toLocaleString()
    },
    { 
      field: "updatedAt", 
      headerName: "Última Actualización", 
      width: 180, 
      type: "dateTime",
      valueGetter: (value) => value && new Date(value),
      valueFormatter: (value) => value?.toLocaleString()
    },
    {
      field: "actions",
      headerName: "Acciones",
      width: 100,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <IconButton color="error" onClick={() => handleDelete(params.row.id, params.row.nombre)}>
          <DeleteIcon />
        </IconButton>
      ),
    },
  ];

  const rows = areas.map(a => ({
    id: a._id,
    nombre: a.nombre,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt
  }));

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" spacing={2} mb={1}>
        <BusinessIcon color="primary" fontSize="large" />
        <Typography variant="h4" fontWeight={500}>
          Gestión de Áreas
        </Typography>
      </Stack>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, ml: 6 }}>
        Administra las áreas disponibles para clasificar las búsquedas laborales.
      </Typography>

      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }} elevation={1}>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          Agregar Nueva Área
        </Typography>
        <Box component="form" onSubmit={handleAdd} sx={{ mt: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="stretch">
            <TextField
              label="Nombre del área"
              value={newArea}
              onChange={(e) => setNewArea(e.target.value)}
              fullWidth
              size="small"
              placeholder="Ej: Marketing, IT, Ventas..."
            />
            <Button
              type="submit"
              variant="contained"
              startIcon={<AddIcon />}
              disabled={creating || !newArea.trim()}
              sx={{ minWidth: 120, borderRadius: 2 }}
            >
              {creating ? "Creando..." : "Agregar"}
            </Button>
          </Stack>
        </Box>
      </Paper>

      <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden', height: 500, width: '100%' }}>
        {loading ? (
          <Box sx={{ p: 4, display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={rows}
            columns={columns}
            pageSizeOptions={[5, 10, 25]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
              sorting: { sortModel: [{ field: 'updatedAt', sort: 'desc' }] },
            }}
            disableRowSelectionOnClick
          />
        )}
      </Paper>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Container>
  );
}