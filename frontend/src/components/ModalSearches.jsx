import {
    Dialog, Box,DialogTitle, DialogContent, DialogActions, Button,
    Typography, Stack, Chip
} from "@mui/material";
import { useNavigate } from "react-router-dom";

// Define los colores de estado (ajusta según tu app)
const STATE_COLORS = {
    Activa: "success",
    Pausada: "warning",
    Cerrada: "default",
};

function SearchDetailDialog({ open, onClose, application }) {
    const navigate = useNavigate();
    if (!application || !application.search) return null;

    const { search } = application;

    // Estado legible y color
    const estado = search.estado || "Activa";
    const color = STATE_COLORS[estado] || "default";

    const searchId = search._id || search.id;
    const descripcion = search.descripcion || search.description;

    const handleApply = () => {
        // Redirige a la página de detalle de la búsqueda específica
        navigate(`/searches/${searchId}`);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
  {/* ===== HEADER ===== */}
  <DialogTitle
    sx={{
      bgcolor: '#f8f9fa',
      borderBottom: '1px solid #e0e0e0'
    }}
  >
    <Stack spacing={0.5}>
      <Typography variant="h6" fontWeight="bold">
        {search.titulo || "Detalle de Búsqueda"}
      </Typography>

      <Stack direction="row" spacing={1} flexWrap="wrap">
        <Chip
          label={search.area || "Sin área"}
          size="small"
          variant="outlined"
          color="primary"
        />
        <Chip
          label={estado}
          size="small"
          color={color}
          sx={{ textTransform: 'uppercase' }}
        />
      </Stack>
    </Stack>
  </DialogTitle>

  {/* ===== CONTENT ===== */}
  <DialogContent sx={{ p: 3 }}>
    <Stack spacing={3}>
      {/* Información general */}
      <Box>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 'bold',
            borderBottom: '2px solid #eee',
            pb: 0.5,
            mb: 1
          }}
        >
          Información de la búsqueda
        </Typography>

        <Stack spacing={0.5}>
          <Typography variant="body1">
            {search.titulo || searchId || "-"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {search.ubicacion || "-"} · {search.area || "-"} · {search.estado || "-"}
          </Typography>
        </Stack>
      </Box>

      {/* Descripción */}
      <Box>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 'bold',
            borderBottom: '2px solid #eee',
            pb: 0.5,
            mb: 1
          }}
        >
          Descripción
        </Typography>

        {descripcion ? (
          <Typography
            variant="body2"
            sx={{ whiteSpace: 'pre-wrap' }}
          >
            {descripcion}
          </Typography>
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontStyle: 'italic' }}
          >
            Sin descripción registrada
          </Typography>
        )}
      </Box>
    </Stack>
  </DialogContent>

  {/* ===== ACTIONS ===== */}
  <DialogActions sx={{ px: 3, pb: 2 }}>
    <Button onClick={onClose} variant="outlined">
      Cerrar
    </Button>
  </DialogActions>
</Dialog>

    );
}

export default SearchDetailDialog;