import React, { useEffect, useContext,useMemo, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Container,
  Grid,
  Stack,
  IconButton,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Chip,
  Button,
  Avatar,
  Divider,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Skeleton,
  Pagination,
  InputAdornment,
  Link as MUILink,
  Snackbar,
  Alert,
  Paper
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import WorkIcon from "@mui/icons-material/Work";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import SearchIcon from "@mui/icons-material/Search";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { Link as RouterLink } from "react-router-dom";

// APIs
import { myApplicationsApi, withdrawApplicationApi } from "../api/applications";
import { AuthContext } from "../context/AuthContext"; // 1. Importar el AuthContext
import { profileApi } from "../api/auth"; // API para obtener el perfil del usuario
import Swal from 'sweetalert2';
import SearchDetailDialog from "../components/ModalSearches";

const statusMap = {
  accepted: { label: "Aprobada", color: "success" },
  approved: { label: "Aprobada", color: "success" },
  hired: { label: "Contratado/a", color: "success" },
  rejected: { label: "Rechazada", color: "error" },
  declined: { label: "Rechazada", color: "error" },
  withdrawn: { label: "Retirada", color: "default" },
  interviewing: { label: "Entrevista", color: "info" },
  interview: { label: "Entrevista", color: "info" },
  viewed: { label: "Visto", color: "secondary" },
  pending: { label: "En revisión", color: "warning" },
  submitted: { label: "En revisión", color: "warning" },
  in_review: { label: "En revisión", color: "warning" },
};

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" });
}

function normalize(app) {
  let s = app?.search;
  if (Array.isArray(s)) s = s[0];
  if (!s || typeof s !== "object") s = {};

  const id = s._id || s.id || (typeof app?.search === "string" ? app.search : null);
  const title = s?.titulo || "Búsqueda";
  const company = s?.area || "";
  const location = s?.ubicacion || null;
  const createdAt = app?.createdAt || null;
  const state = (app?.state || "pending").toString().toLowerCase();
  const logoUrl = s?.logo || null;
  const descripcion = s?.descripcion || s?.description || "";

  return { id, title, company, location, createdAt, state, logoUrl, descripcion, raw: app, searchObj: s };
}

export default function MyApplications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [statusOptions, setStatusOptions] = useState(["ALL"]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1); 
  const [snack, setSnack] = useState({ open: false, severity: "success", msg: "" });
  const [user, setUser] = useState(null);
  const PER_PAGE = 12;
  const [selectedSearch, setSelectedSearch] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [{ data: appData }, { data: profileData }] = await Promise.all([
        myApplicationsApi(),
        profileApi()
      ]);

      const arr = Array.isArray(appData) ? appData : appData?.items || [];
      setItems(arr);
      setUser(profileData?.user || null);

      const estados = arr.map(app => (app.state || "pending").toLowerCase());
      setStatusOptions(["ALL", ...Array.from(new Set(estados))]);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Error inesperado";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Obtener el usuario del contexto
  const { user: authUser } = useContext(AuthContext);

  useEffect(() => {
    // 3. Solo ejecutar fetchData si hay un usuario autenticado
    if (authUser) {
      fetchData();
    }
  }, [fetchData, authUser]);

  const normalized = useMemo(() => items.map(normalize), [items]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return normalized.filter(({ title, company, state }) => {
      const passesStatus = statusFilter === "ALL" || state === statusFilter;
      const passesQuery = !q || title.toLowerCase().includes(q) || (company || "").toLowerCase().includes(q);
      return passesStatus && passesQuery;
    });
  }, [normalized, statusFilter, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, query]);

  const handleRetirarPostulacion = async (applicationId, applicationTitle) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Vas a retirar tu postulación a "${applicationTitle}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, retirar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await withdrawApplicationApi(applicationId);
        Swal.fire('¡Retirada!', 'Tu postulación ha sido retirada.', 'success');
        fetchData();
      } catch (e) {
        const msg = e?.response?.data?.message || "No se pudo retirar la postulación.";
        Swal.fire('Error', msg, 'error');
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 5, minHeight: '80vh' }}>
      {/* Header Section */}
      <Box sx={{ mb: 5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <div>
            <Typography variant="h4" fontWeight={500} color="text.primary" gutterBottom>
              Mis Postulaciones
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gestioná el estado de tus solicitudes y mantenete al tanto de las novedades.
            </Typography>
          </div>
          <Tooltip title="Actualizar lista">
            <span>
              <IconButton 
                onClick={fetchData} 
                disabled={loading}
                sx={{ 
                  bgcolor: 'background.paper', 
                  boxShadow: 1,
                  '&:hover': { bgcolor: 'background.paper', boxShadow: 3 }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Box>

      {/* Filters Section */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 3, 
          border: '1px solid', 
          borderColor: 'divider'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              width="290px"
              
              placeholder="Buscar por puesto..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><SearchIcon /></InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            
          </Grid>
        </Grid>
      </Paper>

      {/* Content */}
      <Box>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>
        )}

        {loading && !items.length && (
          <Grid container spacing={3}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Grid item xs={12} md={6} lg={4} key={`sk-${i}`}>
                <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 4 }} />
              </Grid>
            ))}
          </Grid>
        )}

        {!loading && !error && filtered.length === 0 && (
          <Box 
            sx={{ 
              textAlign: "center", 
              py: 8, 
              px: 2,
              bgcolor: 'background.paper', 
              borderRadius: 4,
              border: '1px dashed',
              borderColor: 'divider'
            }}
          >
            <WorkIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" fontWeight={600} color="text.primary" gutterBottom>
              No encontramos postulaciones
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
              {query || statusFilter !== "ALL" 
                ? "Intenta ajustar los filtros de búsqueda para encontrar lo que buscas." 
                : "Aún no te has postulado a ninguna oferta. ¡Explora las oportunidades disponibles!"}
            </Typography>
            <Button 
              component={RouterLink} 
              to="/searches" 
              variant="contained" 
              size="large"
              sx={{ borderRadius: 2, textTransform: 'none', px: 4 }}
            >
              Ver ofertas disponibles
            </Button>
          </Box>
        )}

        <Grid container spacing={3}>
          {paginated.map((item, idx) => {
            const { title, company, location, createdAt, state, logoUrl, descripcion, searchObj } = item;
            const statusCfg = statusMap[state] || statusMap.pending;

            const recruiterEmail = "rrhh@asytec.ar";
            const subject = `Consulta sobre mi postulación a: ${title}`;
            const body = `Hola equipo de RRHH de ASYTEC,\n\nQuería hacer una consulta sobre mi postulación a la búsqueda "${title}".\n\n[Escribe tu consulta aquí]\n\nSaludos cordiales,\n${user?.nombre || ''} ${user?.apellido || ''}`;
            const mailtoLink = `mailto:${recruiterEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

            return (
              <Grid item xs={12} md={6} lg={4} key={`${item.raw?._id}-${idx}`}>
                <Card 
                  elevation={0}
                  sx={{ 
                    height: "100%", 
                    display: "flex", 
                    flexDirection: "column", 
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.1)',
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  <CardHeader
                    avatar={
                      <Avatar 
                        src={logoUrl} 
                        sx={{ 
                          bgcolor: 'primary.light', 
                          color: 'primary.main',
                          width: 48, 
                          height: 48 
                        }}
                      >
                        {!logoUrl && <WorkIcon />}
                      </Avatar>
                    }
                   
                    title={
                      <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2} sx={{ mb: 0.5 }}>
                        {title}
                      </Typography>
                    }
                    subheader={
                      <Typography variant="body2" color="text.secondary">
                        {company || "Empresa confidencial"}
                      </Typography>
                    }
                    sx={{ pb: 1 }}
                  />
                  
                  <CardContent sx={{ pt: 1, flexGrow: 1 }}>
                     
                      
                    <Stack spacing={1.5}>
                      <Chip 
                        label={statusCfg.label} 
                        size="small" 
                        width="30px" 
                        color={statusCfg.color}
                        sx={{ fontWeight: 600, borderRadius: 1.5 }} 
                      />
                      {location && (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <LocationOnIcon fontSize="small" color="action" sx={{ opacity: 0.7 }} />
                          <Typography variant="body2" color="text.secondary">{location}</Typography>
                        </Stack>
                      )}
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CalendarTodayIcon fontSize="small" color="action" sx={{ opacity: 0.7 }} />
                        <Typography variant="body2" color="text.secondary">
                          Aplicado el {formatDate(createdAt)}
                        </Typography>
                      </Stack>
                      
                    </Stack>
                  </CardContent>

                  <Divider sx={{ borderStyle: 'dashed' }} />

                  <CardActions sx={{ p: 2, justifyContent: "space-between" }}>
                    <Button
                      size="small"
                      startIcon={<MailOutlineIcon />}
                      href={mailtoLink}
                      target="_blank"
                      sx={{ textTransform: 'none', color: 'text.secondary' }}
                    >
                      Contactar
                    </Button>
                    
                    <Stack direction="row" spacing={1}>
                      {state !== 'withdrawn' && state !== 'rejected' && state !== 'hired' && (
                        <Tooltip title="Retirar postulación">
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => handleRetirarPostulacion(item.raw?._id, title)}
                            sx={{ borderRadius: 2, minWidth: 0, px: 1.5 }}
                          >
                            Retirar
                          </Button>
                        </Tooltip>
                      )}
                      <Button 
                        variant="contained" 
                        size="small"
                        onClick={() => setSelectedSearch({ ...searchObj, descripcion })}
                        sx={{ borderRadius: 2, textTransform: 'none', boxShadow: 'none' }}
                      >
                        Ver detalle
                      </Button>
                    </Stack>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {filtered.length > PER_PAGE && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
            <Pagination
              count={pageCount}
              page={page}
              onChange={(_, p) => setPage(p)}
              shape="rounded"
              color="primary"
              size="large"
            />
          </Box>
        )}
      </Box>

      <SearchDetailDialog
        open={!!selectedSearch}
        onClose={() => setSelectedSearch(null)}
        application={{ search: selectedSearch }}
      />

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ width: '100%' }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Container>
  );
}