import React, { useEffect, useState } from "react";
import { Box, Typography, Card, CardActions, Button, Chip, CircularProgress, Stack } from "@mui/material";
// import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import { listPublicSearchesApi } from "../api/searches";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation, Autoplay } from "swiper/modules";

import SearchDetailDialog from "../components/ModalSearches";

const STATUS_COLORS = {
  Activa: "success",
  Pausada: "warning",
  Cerrada: "default",
};

export default function PublicSearchesCarousel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSearch, setSelectedSearch] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await listPublicSearchesApi({ estado: "Activa", limit: 12 });
        const items = Array.isArray(data?.items) ? data.items : [];
        setRows(
          items.map((s) => ({
            id: s._id,
            titulo: s.titulo,
            area: s.area,
            estado: s.estado,
            ubicacion: s.ubicacion || "",
            descripcion: s.descripcion || "",
            updatedAt: s.updatedAt,
          }))
        );
      } catch (e) {
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!rows.length) {
    return (
      <Box sx={{ textAlign: "center", py: 6 }}>
        <Typography color="text.secondary">No hay búsquedas activas en este momento.</Typography>
      </Box>
    );
  }

  // Lógica: Solo activamos el loop infinito si hay más elementos (4) 
  // que los que mostramos en la pantalla más grande (4).
  const isLoopEnabled = rows.length > 4;

  return (
    <Box 
      sx={{ 
        py: 2, 
        width: "100%",
        
        // --- ESTILOS RESPONSIVE DEL SWIPER ---
        // Usamos CSS dentro de SX para controlar el padding del contenedor Swiper
        "& .swiper": {
            width: "100%",
            // Padding dinámico: poco en móviles, mucho en PC
            paddingTop: "10px",
            paddingBottom: "40px", // Espacio para la sombra de las cards
            paddingLeft: { xs: "10px", sm: "20px", md: "40px" },
            paddingRight: { xs: "10px", sm: "20px", md: "40px" },
        },

        // --- BOTONES DE NAVEGACIÓN RESPONSIVE ---
        "& .swiper-button-prev": {
            display: { xs: 'none', lg: 'flex' }, // Oculto por defecto, visible en 'lg' (1200px+)
            color: "#1976d2",
            // En móvil (xs) pegado al borde, en escritorio (md) desplazado -10px
            left: { lg: "-5px" }, 
            // Hacemos los botones un poco más chicos en móvil para no estorbar
            transform: { lg: "scale(1)" },
            fontWeight: "bold",
        },
        "& .swiper-button-next": {
            display: { xs: 'none', lg: 'flex' }, // Oculto por defecto, visible en 'lg' (1200px+)
            color: "#1976d2",
            // En móvil pegado al borde, en escritorio desplazado 5px
            right: { lg: "-5px" },
            transform: { lg: "scale(1)" },
            fontWeight: "bold",
        },
        "& .swiper-button-disabled": {
            opacity: 0.3,
        }
      }}
    >
      <Typography variant="h4" gutterBottom textAlign="center" sx={{ fontSize: { xs: "1.8rem", md: "2.125rem" } }}>
        Búsquedas Activas
      </Typography>
      
      <Swiper
        // KEY: Fuerza a React a reiniciar el Swiper si cambian los datos o el modo loop
        key={`${rows.length}-${isLoopEnabled ? 'loop' : 'noloop'}`}
        
        // CONFIGURACIÓN FUNCIONAL
        loop={isLoopEnabled}
        centerInsufficientSlides={true}
        centeredSlides={false}
        observer={true}
        observeParents={true}
        
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        modules={[Navigation, Autoplay]}
        navigation
        spaceBetween={24}
        slidesPerView={1}
        breakpoints={{
          // Móvil grande / Tablet pequeña
          600: { slidesPerView: 2 },
          // Tablet horizontal / Laptop pequeña
          900: { slidesPerView: 3 },
          // Desktop estándar
          1200: { slidesPerView: 4 },
        }}
        // NOTA: Quitamos el 'style' con padding fijo de aquí y lo pasamos al 'sx' del Box padre
        // para tener control responsive total.
      >
        {rows.map((item) => (
          <SwiperSlide key={item.id} style={{ display: "flex", justifyContent: "center" }}>
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: 3,
                height: 220,
                width: "100%", 
                maxWidth: 280, // Límite para que no se vean gigantes
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                p: 2,
                // Pequeño margen automático para asegurar centrado en layouts flexibles
                mx: "auto"
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="caption" color="primary">
                    {item.area}
                  </Typography>
                  <Typography fontWeight="bold" variant="subtitle1" color="text.primary" noWrap>
                    {item.titulo}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {item.ubicacion || item.descripcion?.slice(0, 60)}
                  </Typography>
                </Box>
              </Stack>
              
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Chip
                  label={item.estado}
                  color={STATUS_COLORS[item.estado] || "default"}
                  size="small"
                  sx={{ fontWeight: "bold", mt: 2, justifyContent: "center" }}
                />
              </Box>
              
              <CardActions sx={{ justifyContent: "center" }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => {
                    setSelectedSearch({ search: item });
                    setModalOpen(true);
                  }}
                >
                  Más Info
                </Button>
              </CardActions>
            </Card>
          </SwiperSlide>
        ))}
      </Swiper>
      
      <SearchDetailDialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        application={selectedSearch}
      />
    </Box>
  );
}